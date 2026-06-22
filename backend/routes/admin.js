const express = require('express');
const { queryAll } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Require admin for all routes in this file
router.use(authenticate, requireAdmin);

// ---------------------------------------------------------------------------
// GET /api/admin/users
// ---------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const users = await queryAll(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    console.error('Admin get users error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
