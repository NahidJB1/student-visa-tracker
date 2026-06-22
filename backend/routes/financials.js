const express = require('express');
const { queryOne, runQuery } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All financial routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// GET /api/students/:id/financials — get financial record for a student
// ---------------------------------------------------------------------------
router.get('/:id/financials', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify student exists and belongs to the logged-in user
    const student = await queryOne('SELECT * FROM students WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found or access denied.' });
    }

    const financial = await queryOne('SELECT * FROM financials WHERE student_id = $1', [id]);
    res.json({ financial: financial || null });
  } catch (err) {
    console.error('Get financials error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/students/:id/financials — upsert financial data
// ---------------------------------------------------------------------------
router.put('/:id/financials', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify student exists and belongs to the logged-in user
    const student = await queryOne('SELECT * FROM students WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found or access denied.' });
    }

    const {
      referrer_name = '',
      agent_commission = 0,
      university_payment = 0,
      amount_from_student = 0,
      extra_income_amount = 0,
      extra_income_remark = ''
    } = req.body;

    // Check if financial record exists
    const existing = await queryOne('SELECT id FROM financials WHERE student_id = $1', [id]);

    if (existing) {
      await runQuery(
        `UPDATE financials SET
          referrer_name = $1,
          agent_commission = $2,
          university_payment = $3,
          amount_from_student = $4,
          extra_income_amount = $5,
          extra_income_remark = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE student_id = $7`,
        [referrer_name, agent_commission, university_payment,
         amount_from_student, extra_income_amount, extra_income_remark, id]
      );
    } else {
      await runQuery(
        `INSERT INTO financials
          (student_id, referrer_name, agent_commission, university_payment,
           amount_from_student, extra_income_amount, extra_income_remark)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, referrer_name, agent_commission, university_payment,
         amount_from_student, extra_income_amount, extra_income_remark]
      );
    }

    const financial = await queryOne('SELECT * FROM financials WHERE student_id = $1', [id]);
    res.json({ financial });
  } catch (err) {
    console.error('Upsert financials error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
