import mysql from 'mysql2/promise.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sheets_sync',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const getConnection = async () => {
  return pool.getConnection();
};

export const executeQuery = async (sql, values = []) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

export const executeUpdate = async (sql, values = []) => {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    connection.release();
  }
};

export default pool;
