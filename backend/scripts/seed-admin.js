/**
 * Seed script — creates the initial admin user from .env variables.
 * Run with: node scripts/seed-admin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { initDb, queryOne, runQuery } = require('../config/db');

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME in .env');
  process.exit(1);
}

async function seed() {
  await initDb();

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);

  if (existing) {
    console.log(`Admin user already exists (email: ${ADMIN_EMAIL}). Skipping.`);
  } else {
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    await runQuery(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash, 'admin']
    );
    console.log(`Admin user created successfully (email: ${ADMIN_EMAIL}).`);
  }

  setTimeout(() => process.exit(0), 100);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
