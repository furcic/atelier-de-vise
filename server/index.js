import { pool } from './db.js';
import { createApp } from './app.js';
await pool.query('SELECT 1');
const server = createApp(pool).listen(Number(process.env.PORT || 3101), '0.0.0.0', (error) => {
  if (error) {
    console.error('API-ul nu a putut porni:', error.message);
    void pool.end();
    process.exitCode = 1;
    return;
  }
  console.log(`Atelier API: http://localhost:${process.env.PORT || 3101}`);
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
