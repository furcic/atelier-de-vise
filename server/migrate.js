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
  const [facebook] = await db.query("SHOW COLUMNS FROM settings LIKE 'facebook'");
  if (!facebook.length)
    await db.query(
      "ALTER TABLE settings ADD COLUMN facebook VARCHAR(200) NOT NULL DEFAULT '' AFTER instagram",
    );
}
if (process.argv[1]?.endsWith('/migrate.js')) {
  try {
    await migrate(pool);
    console.log('Schema MySQL este pregătită.');
  } finally {
    await pool.end();
  }
}
