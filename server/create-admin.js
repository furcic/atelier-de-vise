import { pool } from './db.js';
import { hashPassword } from './auth.js';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
try {
  if (
    !email?.includes('@') ||
    !password ||
    password.length < 12 ||
    password.startsWith('choose-a-')
  )
    throw new Error('Configurează ADMIN_EMAIL și ADMIN_PASSWORD (minimum 12 caractere) în .env.');
  await pool.execute(
    'INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    [email, hashPassword(password)],
  );
  await pool.execute(
    'DELETE s FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE a.email = ?',
    [email],
  );
  console.log(`Administrator pregătit: ${email}`);
} finally {
  await pool.end();
}
