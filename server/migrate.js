import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
export async function migrate(db) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  for (const statement of schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean))
    await db.query(statement);
  // Columns added after the first release (MySQL 8 has no ADD COLUMN IF NOT EXISTS).
  const added = [
    ['facebook', 'instagram'],
    ['app_store', 'facebook'],
    ['play_store', 'app_store'],
  ];
  for (const [column, after] of added) {
    const [existing] = await db.query('SHOW COLUMNS FROM settings LIKE ?', [column]);
    if (!existing.length)
      await db.query(
        `ALTER TABLE settings ADD COLUMN ${column} VARCHAR(200) NOT NULL DEFAULT '' AFTER ${after}`,
      );
  }
}
if (process.argv[1]?.endsWith('/migrate.js')) {
  try {
    await migrate(pool);
    console.log('Schema MySQL este pregătită.');
  } finally {
    await pool.end();
  }
}
