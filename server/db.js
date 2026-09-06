import mysql from 'mysql2/promise';
export function createPool(database = process.env.DB_NAME || 'atelier_de_vise') {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'atelier',
    password: process.env.DB_PASSWORD || '',
    database,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: true,
  });
}
export const pool = createPool();
export async function transaction(db, work) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
