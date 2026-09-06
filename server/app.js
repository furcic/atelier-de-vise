import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { z } from 'zod';
import { transaction } from './db.js';
import { verifyPassword, tokenHash, cookieToken, sessionOptions } from './auth.js';
import {
  contactSchema,
  registrationSchema,
  eventSchema,
  artworkSchema,
  settingsSchema,
  problem,
  idParam,
} from './validation.js';

const eventFields = [
  'category',
  'title',
  'description',
  'starts_at',
  'ends_at',
  'capacity',
  'price',
  'location',
  'format',
  'status',
  'cover',
];
const artworkFields = ['title', 'description', 'price', 'dimensions', 'medium', 'image', 'status'];
const eventSelect = `SELECT e.*, COALESCE((SELECT SUM(r.seats) FROM registrations r WHERE r.event_id=e.id AND r.status='confirmed'),0) AS booked, (SELECT COUNT(*) FROM photos p WHERE p.event_id=e.id) AS photo_count FROM events e`;
function presentEvent(event) {
  return {
    ...event,
    starts_at: event.starts_at.replace(' ', 'T') + 'Z',
    ends_at: event.ends_at.replace(' ', 'T') + 'Z',
    booked: Number(event.booked),
    available: Math.max(0, event.capacity - Number(event.booked)),
  };
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 0 },
  fileFilter: (_req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});
async function encodeImage(file) {
  try {
    return await sharp(file.buffer, { limitInputPixels: 40000000 })
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw problem(400, 'Imagine invalidă. Încarcă JPG, PNG sau WebP de maximum 5 MB.');
  }
}
export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:'],
          'script-src': ["'self'"],
          'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin && origin !== (process.env.APP_ORIGIN || 'http://localhost:5174'))
        return next(problem(403, 'Origine neautorizată.'));
      if (req.headers['sec-fetch-site'] === 'cross-site')
        return next(problem(403, 'Cerere neautorizată.'));
      if (!req.is('application/json') && !req.is('multipart/form-data'))
        return next(problem(415, 'Formatul cererii nu este acceptat.'));
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  const publicLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Prea multe cereri. Încearcă din nou în 15 minute.' },
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Prea multe încercări. Revino în 15 minute.' },
  });
  const requireAdmin = async (req, _res, next) => {
    try {
      const [rows] = await db.execute(
        'SELECT a.id,a.email FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()',
        [tokenHash(cookieToken(req))],
      );
      if (!rows.length) throw problem(401, 'Autentifică-te pentru a continua.');
      req.admin = rows[0];
      next();
    } catch (error) {
      next(error);
    }
  };

  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true, database: 'mysql' });
  });
  app.get('/api/catalog', async (_req, res) => {
    const [[events], [artworks], [settings]] = await Promise.all([
      db.query(`${eventSelect} WHERE e.status='published' ORDER BY e.starts_at`),
      db.query("SELECT * FROM artworks WHERE status!='draft' ORDER BY id DESC"),
      db.query('SELECT * FROM settings WHERE id=1'),
    ]);
    res.json({
      events: events.map(presentEvent),
      artworks,
      settings: { ...settings[0], demo: !!settings[0].demo },
    });
  });
  app.get('/api/events/:id/photos', async (req, res) => {
    const [rows] = await db.execute(
      "SELECT p.id FROM photos p JOIN events e ON e.id=p.event_id WHERE e.id=? AND e.status='published' ORDER BY p.id",
      [idParam(req.params.id)],
    );
    res.json(rows.map((p) => ({ id: p.id, url: `/api/photos/${p.id}` })));
  });
  app.get('/api/photos/:id', async (req, res) => {
    const [rows] = await db.execute(
      'SELECT p.data,p.mime,e.status FROM photos p JOIN events e ON e.id=p.event_id WHERE p.id=?',
      [idParam(req.params.id)],
    );
    if (!rows.length) throw problem(404, 'Imaginea nu există.');
    if (rows[0].status !== 'published') {
      const [session] = await db.execute(
        'SELECT admin_id FROM sessions WHERE token_hash=? AND expires_at>UTC_TIMESTAMP()',
        [tokenHash(cookieToken(req))],
      );
      if (!session.length) throw problem(404, 'Imaginea nu există.');
    }
    res.type(rows[0].mime).send(rows[0].data);
  });
  app.get('/api/artwork-images/:id', async (req, res) => {
    const [rows] = await db.execute('SELECT data,mime FROM artwork_images WHERE id=?', [
      idParam(req.params.id),
    ]);
    if (!rows.length) throw problem(404, 'Imaginea nu există.');
    res.type(rows[0].mime).send(rows[0].data);
  });

  app.post('/api/events/:id/register', publicLimit, async (req, res) => {
    const eventId = idParam(req.params.id);
    const data = registrationSchema.parse(req.body);
    const result = await transaction(db, async (connection) => {
      const [events] = await connection.execute(
        "SELECT * FROM events WHERE id=? AND status='published' FOR UPDATE",
        [eventId],
      );
      const event = events[0];
      if (!event) throw problem(404, 'Evenimentul nu este disponibil.');
      if (event.category === 'exhibition')
        throw problem(400, 'Pentru expoziții nu se fac înscrieri.');
      if (new Date(event.starts_at.replace(' ', 'T') + 'Z') <= new Date())
        throw problem(409, 'Înscrierile pentru acest eveniment s-au încheiat.');
      const [[{ booked }]] = await connection.execute(
        "SELECT COALESCE(SUM(seats),0) AS booked FROM registrations WHERE event_id=? AND status='confirmed'",
        [eventId],
      );
      if (Number(booked) + data.seats > event.capacity)
        throw problem(409, 'Nu mai sunt suficiente locuri. Alege altă dată sau mai puține locuri.');
      const [existing] = await connection.execute(
        'SELECT id,status FROM registrations WHERE event_id=? AND phone=?',
        [eventId, data.phone],
      );
      if (existing[0]?.status === 'confirmed')
        throw problem(
          409,
          'Există deja o înscriere pentru acest telefon. Contactează atelierul pentru modificări.',
        );
      const reference = randomBytes(6).toString('hex').toUpperCase();
      if (existing.length)
        await connection.execute(
          "UPDATE registrations SET name=?,seats=?,status='confirmed',reference=? WHERE id=?",
          [data.name, data.seats, reference, existing[0].id],
        );
      else
        await connection.execute(
          'INSERT INTO registrations (event_id,name,phone,seats,reference) VALUES (?,?,?,?,?)',
          [eventId, data.name, data.phone, data.seats, reference],
        );
      return { reference, title: event.title, seats: data.seats };
    });
    res.status(201).json(result);
  });
  app.post('/api/artworks/:id/inquire', publicLimit, async (req, res) => {
    const data = contactSchema.parse(req.body);
    const id = idParam(req.params.id);
    await transaction(db, async (connection) => {
      const [rows] = await connection.execute(
        "SELECT id FROM artworks WHERE id=? AND status='available' FOR UPDATE",
        [id],
      );
      if (!rows.length) throw problem(409, 'Acest tablou nu mai este disponibil.');
      const [existing] = await connection.execute(
        "SELECT id FROM inquiries WHERE artwork_id=? AND phone=? AND status!='closed'",
        [id, data.phone],
      );
      if (existing.length) throw problem(409, 'Cererea ta există deja. Atelierul te va contacta.');
      await connection.execute('INSERT INTO inquiries (artwork_id,name,phone) VALUES (?,?,?)', [
        id,
        data.name,
        data.phone,
      ]);
    });
    res.status(201).json({ ok: true });
  });
  app.post('/api/admin/login', loginLimit, async (req, res) => {
    const { email, password } = z
      .object({ email: z.email().max(190), password: z.string().min(1).max(200) })
      .parse(req.body);
    const [admins] = await db.execute('SELECT * FROM admins WHERE email=?', [email.toLowerCase()]);
    // Always perform a password derivation, including unknown email addresses.
    const valid = verifyPassword(
      password,
      admins[0]?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`,
    );
    if (!admins.length || !valid) throw problem(401, 'Email sau parolă incorectă.');
    const token = randomBytes(32).toString('hex');
    await db.execute('DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()');
    await db.execute(
      'INSERT INTO sessions (token_hash,admin_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 12 HOUR))',
      [tokenHash(token), admins[0].id],
    );
    res.cookie('atelier_session', token, sessionOptions).json({ email: admins[0].email });
  });
  app.use('/api/admin', requireAdmin);
  app.get('/api/admin/me', (req, res) => res.json(req.admin));
  app.post('/api/admin/logout', async (req, res) => {
    await db.execute('DELETE FROM sessions WHERE token_hash=?', [tokenHash(cookieToken(req))]);
    res.clearCookie('atelier_session', { ...sessionOptions, maxAge: undefined }).json({ ok: true });
  });
  app.get('/api/admin/dashboard', async (_req, res) => {
    const [[events], [registrations], [artworks], [inquiries], [settings]] = await Promise.all([
      db.query(`${eventSelect} ORDER BY e.starts_at DESC`),
      db.query(
        'SELECT r.*,e.title,e.starts_at FROM registrations r JOIN events e ON e.id=r.event_id ORDER BY r.created_at DESC',
      ),
      db.query('SELECT * FROM artworks ORDER BY id DESC'),
      db.query(
        'SELECT i.*,a.title FROM inquiries i JOIN artworks a ON a.id=i.artwork_id ORDER BY i.created_at DESC',
      ),
      db.query('SELECT * FROM settings WHERE id=1'),
    ]);
    res.json({
      events: events.map(presentEvent),
      registrations,
      artworks,
      inquiries,
      settings: { ...settings[0], demo: !!settings[0].demo },
    });
  });
  app.post('/api/admin/events', async (req, res) => {
    // Explicit dates preserve the chosen local time across daylight-saving changes.
    const events = z.array(eventSchema).min(1).max(26).parse(req.body.events);
    const ids = await transaction(db, async (connection) => {
      const ids = [];
      for (const event of events) {
        const [result] = await connection.execute(
          `INSERT INTO events (${eventFields.join(',')}) VALUES (${eventFields.map(() => '?').join(',')})`,
          eventFields.map((key) => event[key]),
        );
        ids.push(result.insertId);
      }
      return ids;
    });
    res.status(201).json({ ids });
  });
  app.put('/api/admin/events/:id', async (req, res) => {
    const event = eventSchema.parse(req.body);
    const id = idParam(req.params.id);
    await transaction(db, async (connection) => {
      const [rows] = await connection.execute('SELECT id FROM events WHERE id=? FOR UPDATE', [id]);
      if (!rows.length) throw problem(404, 'Evenimentul nu există.');
      const [[{ booked }]] = await connection.execute(
        "SELECT COALESCE(SUM(seats),0) AS booked FROM registrations WHERE event_id=? AND status='confirmed'",
        [id],
      );
      if (event.capacity < Number(booked))
        throw problem(409, 'Capacitatea nu poate fi mai mică decât numărul de locuri rezervate.');
      if (event.category === 'exhibition' && Number(booked) > 0)
        throw problem(
          409,
          'Anulează înscrierile înainte de a transforma evenimentul în expoziție.',
        );
      await connection.execute(
        `UPDATE events SET ${eventFields.map((key) => `${key}=?`).join(',')} WHERE id=?`,
        [...eventFields.map((key) => event[key]), id],
      );
    });
    res.json({ ok: true });
  });
  app.patch('/api/admin/registrations/:id', async (req, res) => {
    const id = idParam(req.params.id);
    const { status } = z.object({ status: z.literal('cancelled') }).parse(req.body);
    await transaction(db, async (connection) => {
      const [rows] = await connection.execute('SELECT event_id FROM registrations WHERE id=?', [
        id,
      ]);
      if (!rows.length) throw problem(404, 'Înscrierea nu există.');
      await connection.execute('SELECT id FROM events WHERE id=? FOR UPDATE', [rows[0].event_id]);
      await connection.execute('UPDATE registrations SET status=? WHERE id=?', [status, id]);
    });
    res.json({ ok: true });
  });
  app.get('/api/admin/events/:id/photos', async (req, res) => {
    const [rows] = await db.execute('SELECT id FROM photos WHERE event_id=? ORDER BY id', [
      idParam(req.params.id),
    ]);
    res.json(rows.map((p) => ({ id: p.id, url: `/api/photos/${p.id}` })));
  });
  app.post('/api/admin/events/:id/photos', upload.array('photos', 10), async (req, res) => {
    const id = idParam(req.params.id);
    if (!req.files?.length)
      throw problem(400, 'Selectează imagini JPG, PNG sau WebP, maximum 5 MB fiecare.');
    const images = [];
    for (const file of req.files) images.push(await encodeImage(file));
    await transaction(db, async (connection) => {
      const [events] = await connection.execute('SELECT id FROM events WHERE id=? FOR UPDATE', [
        id,
      ]);
      if (!events.length) throw problem(404, 'Evenimentul nu există.');
      const [[{ count }]] = await connection.execute(
        'SELECT COUNT(*) AS count FROM photos WHERE event_id=?',
        [id],
      );
      if (Number(count) + images.length > 10)
        throw problem(409, 'Un eveniment poate avea maximum 10 fotografii.');
      for (const data of images)
        await connection.execute('INSERT INTO photos (event_id,data) VALUES (?,?)', [id, data]);
    });
    res.status(201).json({ ok: true });
  });
  app.delete('/api/admin/photos/:id', async (req, res) => {
    const id = idParam(req.params.id);
    await transaction(db, async (connection) => {
      const [photos] = await connection.execute('SELECT event_id FROM photos WHERE id=?', [id]);
      if (!photos.length) throw problem(404, 'Fotografia nu există.');
      await connection.execute('SELECT id FROM events WHERE id=? FOR UPDATE', [photos[0].event_id]);
      await connection.execute("UPDATE events SET cover='/images/workshop.jpg' WHERE cover=?", [
        `/api/photos/${id}`,
      ]);
      await connection.execute('DELETE FROM photos WHERE id=?', [id]);
    });
    res.json({ ok: true });
  });
  app.post('/api/admin/artwork-images', upload.single('photo'), async (req, res) => {
    if (!req.file) throw problem(400, 'Selectează o imagine JPG, PNG sau WebP.');
    const data = await encodeImage(req.file);
    const [result] = await db.execute('INSERT INTO artwork_images (data) VALUES (?)', [data]);
    res.status(201).json({ url: `/api/artwork-images/${result.insertId}` });
  });
  app.post('/api/admin/artworks', async (req, res) => {
    const data = artworkSchema.parse(req.body);
    const [result] = await db.execute(
      `INSERT INTO artworks (${artworkFields.join(',')}) VALUES (${artworkFields.map(() => '?').join(',')})`,
      artworkFields.map((k) => data[k]),
    );
    res.status(201).json({ id: result.insertId });
  });
  app.put('/api/admin/artworks/:id', async (req, res) => {
    const data = artworkSchema.parse(req.body);
    const [result] = await db.execute(
      `UPDATE artworks SET ${artworkFields.map((k) => `${k}=?`).join(',')} WHERE id=?`,
      [...artworkFields.map((k) => data[k]), idParam(req.params.id)],
    );
    if (!result.affectedRows) throw problem(404, 'Tabloul nu există.');
    res.json({ ok: true });
  });
  app.patch('/api/admin/inquiries/:id', async (req, res) => {
    const { status } = z.object({ status: z.enum(['new', 'contacted', 'closed']) }).parse(req.body);
    const [result] = await db.execute('UPDATE inquiries SET status=? WHERE id=?', [
      status,
      idParam(req.params.id),
    ]);
    if (!result.affectedRows) throw problem(404, 'Cererea nu există.');
    res.json({ ok: true });
  });
  app.put('/api/admin/settings', async (req, res) => {
    const data = settingsSchema.parse(req.body);
    await db.execute(
      'UPDATE settings SET artist=?,address=?,phone=?,instagram=?,demo=? WHERE id=1',
      [data.artist, data.address, data.phone, data.instagram, data.demo],
    );
    res.json({ ok: true });
  });
  app.use('/api', (_req, _res, next) => next(problem(404, 'Pagina nu există.')));
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
  }
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: 'Verifică datele introduse.', details: error.issues.map((i) => i.message) });
    if (error instanceof multer.MulterError)
      return res
        .status(400)
        .json({ error: 'Maximum 10 imagini JPG, PNG sau WebP, de cel mult 5 MB fiecare.' });
    if (error.type === 'entity.parse.failed')
      return res.status(400).json({ error: 'Cerere invalidă.' });
    if (error.type === 'entity.too.large')
      return res.status(413).json({ error: 'Cererea este prea mare.' });
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: 'A apărut o problemă. Încearcă din nou în câteva momente.' });
  });
  return app;
}
