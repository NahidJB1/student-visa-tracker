const { Pool } = require('pg');

let pool;

async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('DATABASE_URL is not set. Please set it in your .env file or environment variables.');
    throw new Error('DATABASE_URL missing');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Neon free tiers
  });

  try {
    // ---------------------------------------------------------------------------
    // Table creation
    // ---------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        passport_number TEXT NOT NULL,
        institute_name TEXT NOT NULL,
        course_program TEXT NOT NULL,
        processing_status TEXT DEFAULT 'Offer letter issued',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS financials (
        id SERIAL PRIMARY KEY,
        student_id INTEGER UNIQUE NOT NULL,
        referrer_name TEXT DEFAULT '',
        agent_commission REAL DEFAULT 0,
        university_payment REAL DEFAULT 0,
        amount_from_student REAL DEFAULT 0,
        extra_income_amount REAL DEFAULT 0,
        extra_income_remark TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );
    `);

    // ---------------------------------------------------------------------------
    // Indexes
    // ---------------------------------------------------------------------------
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_students_processing_status ON students(processing_status);`);

    console.log('PostgreSQL database initialized successfully.');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    throw error;
  }
}

/**
 * Helper: Run a query that returns rows (SELECT).
 */
async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * Helper: Run a query and return the first row as a plain object.
 * Returns null if no rows found.
 */
async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Helper: Run a write query (INSERT, UPDATE, DELETE).
 * Returns { changes, lastInsertRowid }.
 * NOTE: For PostgreSQL to return the inserted ID, the SQL must include 'RETURNING id'.
 */
async function runQuery(sql, params = []) {
  const result = await pool.query(sql, params);
  const changes = result.rowCount;
  const lastInsertRowid = result.rows.length > 0 ? result.rows[0].id : 0;
  return { changes, lastInsertRowid };
}

/**
 * Get the raw pg pool instance.
 */
function getDb() {
  return pool;
}

module.exports = {
  initDb,
  queryAll,
  queryOne,
  runQuery,
  getDb,
};
