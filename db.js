import postgresql from 'pg';
import os from 'os';

const { Pool } = postgresql;

// NOTE: PostgreSQL creates a superuser by default on localhost using the OS username.
const pool = new Pool({
  user: process.env.DATABSE_USER || 'postgres',
  database: process.env.DATABASE_NAME || 'mylocker_app',
  password: process.env.DATABASE_PASSWORD || '',
  host: process.env.DATABASE_HOST || 'localhost',
  port: 5432
});

pool.on('connect', () => {
  console.log('PostgreSQL database connected!');
}).on('error', (err) => {
  // ROLLBACK
  console.log('PostgreSQL database rollback');
  pool.query('ROLLBACK')
});

export default pool;