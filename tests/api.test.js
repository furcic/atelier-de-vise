import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { createPool, pool } from '../server/db.js';
import { migrate } from '../server/migrate.js';
import { createApp } from '../server/app.js';
import { hashPassword } from '../server/auth.js';

// This suite can mutate ONLY the explicit, dedicated *_test schema.
const dbName = process.env.TEST_DB_NAME || 'atelier_de_vise_test';
if (!dbName.endsWith('_test') || dbName === process.env.DB_NAME)
  throw new Error('Tests require a separate *_test database.');
const db = createPool(dbName);
const app = createApp(db);
let admin;
let pixel;
const event = {
  category: 'wine',
  title: 'Test atelier concurență',
  description: 'Un atelier de test pentru verificarea înscrierilor.',
  starts_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  ends_at: new Date(Date.now() + 7 * 86400000 + 7200000).toISOString(),
  capacity: 2,
  price: 100,
  location: 'Atelier test',
  format: 'group',
  status: 'published',
  cover: '/images/workshop.jpg',
};
const contact = { name: 'Participant Test', phone: '0712345678', seats: 1, consent: true };
const createdEvents = [];
const createdArtworks = [];
async function createEvent(overrides = {}) {
  const response = await admin
    .post('/api/admin/events')
    .send({ events: [{ ...event, ...overrides }] });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const id = response.body.ids[0];
  createdEvents.push(id);
  return id;
}
before(async () => {
  await migrate(db);
  const email = `test-${Date.now()}@atelier.local`;
  await db.execute('INSERT INTO admins (email,password_hash) VALUES (?,?)', [
    email,
    hashPassword('IntegrationTest!2026'),
  ]);
  admin = request.agent(app);
  const result = await admin
    .post('/api/admin/login')
    .send({ email, password: 'IntegrationTest!2026' });
  assert.equal(result.status, 200);
  admin.testEmail = email;
  pixel = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#ff7020' } })
    .png()
    .toBuffer();
});
after(async () => {
  for (const id of createdEvents) {
    await db.execute('DELETE FROM photos WHERE event_id=?', [id]);
    await db.execute('DELETE FROM registrations WHERE event_id=?', [id]);
    await db.execute('DELETE FROM events WHERE id=?', [id]);
  }
  for (const id of createdArtworks) {
    await db.execute('DELETE FROM inquiries WHERE artwork_id=?', [id]);
    await db.execute('DELETE FROM artworks WHERE id=?', [id]);
  }
  if (admin?.testEmail) await db.execute('DELETE FROM admins WHERE email=?', [admin.testEmail]);
  await db.end();
  await pool.end();
});
test('administration requires authentication; public catalog never exposes contacts', async () => {
  assert.equal((await request(app).get('/api/admin/dashboard')).status, 401);
  assert.equal(
    (
      await request(app)
        .post('/api/admin/events')
        .send({ events: [event] })
    ).status,
    401,
  );
  const result = await request(app).get('/api/catalog');
  assert.equal(result.status, 200);
  assert.equal(result.body.registrations, undefined);
  assert.equal(result.body.inquiries, undefined);
  assert.equal(result.headers['cache-control'], 'no-store');
});
test('rejects cross-site writes and incorrect login', async () => {
  assert.equal(
    (
      await request(app)
        .post('/api/admin/login')
        .set('Origin', 'https://attacker.example')
        .send({ email: 'a@b.ro', password: 'foo' })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/admin/login')
        .send({ email: 'nobody@atelier.local', password: 'wrong' })
    ).status,
    401,
  );
});
test('competing registrations cannot oversell the last two seats', async () => {
  const id = await createEvent();
  const results = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, phone: `+40712345${String(600 + i).padStart(3, '0')}` }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 2);
  assert.equal(results.filter((r) => r.status === 409).length, 4);
  const [[{ seats }]] = await db.execute(
    "SELECT SUM(seats) AS seats FROM registrations WHERE event_id=? AND status='confirmed'",
    [id],
  );
  assert.equal(Number(seats), 2);
});
test('normalizes Romanian phone numbers, rejects duplicates and invalid data', async () => {
  const id = await createEvent({ capacity: 10 });
  assert.equal((await request(app).post(`/api/events/${id}/register`).send(contact)).status, 201);
  assert.equal(
    (
      await request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, phone: '+40 712 345 678' })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, phone: 'not a phone' })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, consent: false })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, seats: 0 })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/events/${id}/register`)
        .send({ ...contact, seats: 1.5 })
    ).status,
    400,
  );
});
test('cancelling releases seats and allows rebooking, capacity cannot be reduced below bookings', async () => {
  const id = await createEvent({ capacity: 2 });
  const result = await request(app)
    .post(`/api/events/${id}/register`)
    .send({ ...contact, seats: 2 });
  assert.equal(result.status, 201);
  assert.equal(
    (await admin.put(`/api/admin/events/${id}`).send({ ...event, capacity: 1 })).status,
    409,
  );
  const [[registration]] = await db.execute('SELECT id FROM registrations WHERE event_id=?', [id]);
  assert.equal(
    (await admin.patch(`/api/admin/registrations/${registration.id}`).send({ status: 'cancelled' }))
      .status,
    200,
  );
  const second = await request(app)
    .post(`/api/events/${id}/register`)
    .send({ ...contact, seats: 2 });
  assert.equal(second.status, 201);
  assert.notEqual(result.body.reference, second.body.reference);
});
test('closed, draft, past and exhibition events do not accept registrations', async () => {
  for (const overrides of [
    { status: 'draft' },
    { status: 'cancelled' },
    { starts_at: '2020-01-01T12:00:00Z', ends_at: '2020-01-01T14:00:00Z' },
    { category: 'exhibition', format: 'exhibition' },
  ]) {
    const id = await createEvent(overrides);
    const response = await request(app).post(`/api/events/${id}/register`).send(contact);
    assert.ok([400, 404, 409].includes(response.status));
  }
});
test('gallery persists images, strips to webp, caps at ten including concurrent uploads', async () => {
  const id = await createEvent();
  let upload = admin.post(`/api/admin/events/${id}/photos`);
  for (let i = 0; i < 9; i++)
    upload = upload.attach('photos', pixel, {
      filename: `test-${i}.png`,
      contentType: 'image/png',
    });
  assert.equal((await upload).status, 201);
  const results = await Promise.all(
    [0, 1].map((i) =>
      admin
        .post(`/api/admin/events/${id}/photos`)
        .attach('photos', pixel, { filename: `last-${i}.png`, contentType: 'image/png' }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const response = await request(app).get(`/api/events/${id}/photos`);
  assert.equal(response.body.length, 10);
  const photo = await request(app).get(response.body[0].url);
  assert.equal(photo.status, 200);
  assert.match(photo.headers['content-type'], /image\/webp/);
  const [rows] = await db.execute('SELECT COUNT(*) AS count FROM photos WHERE event_id=?', [id]);
  assert.equal(Number(rows[0].count), 10);
  assert.equal(
    (await request(app).post(`/api/admin/events/${id}/photos`).attach('photos', pixel, 'x.png'))
      .status,
    401,
  );
  const photoId = response.body[0].id;
  assert.equal(
    (await admin.put(`/api/admin/events/${id}`).send({ ...event, cover: `/api/photos/${photoId}` }))
      .status,
    200,
  );
  assert.equal((await admin.delete(`/api/admin/photos/${photoId}`).send({})).status, 200);
  const [[updated]] = await db.execute('SELECT cover FROM events WHERE id=?', [id]);
  assert.equal(updated.cover, '/images/workshop.jpg');
});
test('rejects invalid image content and hides photos of unpublished events', async () => {
  const id = await createEvent({ status: 'draft' });
  assert.equal(
    (
      await admin
        .post(`/api/admin/events/${id}/photos`)
        .attach('photos', Buffer.from('not a photo'), {
          filename: 'invalid.png',
          contentType: 'image/png',
        })
    ).status,
    400,
  );
  assert.equal(
    (await admin.post(`/api/admin/events/${id}/photos`).attach('photos', pixel, 'valid.png'))
      .status,
    201,
  );
  const result = await admin.get(`/api/admin/events/${id}/photos`);
  const path = result.body[0].url;
  assert.equal((await request(app).get(path)).status, 404);
  assert.equal((await admin.get(path)).status, 200);
});
test('artwork inquiry saves contact but does not reserve; sold works reject requests', async () => {
  const data = {
    title: 'Test lucrare',
    description: 'O lucrare pentru testarea cererilor.',
    price: 200,
    dimensions: '20 × 30 cm',
    medium: 'Acrilic',
    image: '/images/artwork.jpg',
    status: 'available',
  };
  const response = await admin.post('/api/admin/artworks').send(data);
  assert.equal(response.status, 201);
  const id = response.body.id;
  createdArtworks.push(id);
  assert.equal((await request(app).post(`/api/artworks/${id}/inquire`).send(contact)).status, 201);
  assert.equal((await request(app).post(`/api/artworks/${id}/inquire`).send(contact)).status, 409);
  const [[artwork]] = await db.execute('SELECT status FROM artworks WHERE id=?', [id]);
  assert.equal(artwork.status, 'available');
  const [[inquiry]] = await db.execute('SELECT id FROM inquiries WHERE artwork_id=?', [id]);
  assert.equal(
    (await admin.patch(`/api/admin/inquiries/${inquiry.id}`).send({ status: 'contacted' })).status,
    200,
  );
  assert.equal(
    (await admin.put(`/api/admin/artworks/${id}`).send({ ...data, status: 'sold' })).status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/artworks/${id}/inquire`)
        .send({ ...contact, phone: '+40712345679' })
    ).status,
    409,
  );
});
test('weekly dates are distinct and invalid events never partially commit', async () => {
  const response = await admin
    .post('/api/admin/events')
    .send({
      events: [
        event,
        { ...event, starts_at: '2030-01-01T15:00:00Z', ends_at: '2030-01-01T17:00:00Z' },
      ],
    });
  assert.equal(response.status, 201);
  createdEvents.push(...response.body.ids);
  assert.equal(new Set(response.body.ids).size, 2);
  const [[before]] = await db.query('SELECT COUNT(*) AS count FROM events');
  assert.equal(
    (
      await admin
        .post('/api/admin/events')
        .send({ events: [event, { ...event, ends_at: '2000-01-01T00:00:00Z' }] })
    ).status,
    400,
  );
  const [[after]] = await db.query('SELECT COUNT(*) AS count FROM events');
  assert.equal(before.count, after.count);
  assert.equal(
    (
      await admin
        .post('/api/admin/events')
        .send({ events: [{ ...event, format: 'private', capacity: 2 }] })
    ).status,
    400,
  );
});
test('logout invalidates the session and removes administrative access', async () => {
  assert.equal((await admin.post('/api/admin/logout').send({})).status, 200);
  assert.equal((await admin.get('/api/admin/dashboard')).status, 401);
});
