import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
export async function migrate(db) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  for (const statement of schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean))
    await db.query(statement);
}
if (process.argv[1]?.endsWith('/migrate.js')) {
  try {
    await migrate(pool);
    console.log('Schema MySQL este pregătită.');
  } finally {
    await pool.end();
  }
}
