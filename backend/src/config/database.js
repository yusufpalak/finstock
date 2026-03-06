import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00', // Always UTC
      decimalNumbers: true,
    });
  }
  return pool;
}

export async function testConnection() {
  const pool = getPool();
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  return true;
}
