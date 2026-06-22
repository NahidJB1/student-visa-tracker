const express = require('express');
const { queryAll, queryOne, runQuery } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// Allowed processing statuses
const ALLOWED_STATUSES = [
  'Offer letter issued',
  'EMGS paid',
  'EMGS 5%',
  'EMGS 15%',
  'EMGS 32%',
  'EMGS 35%',
  'EMGS 70%',
  'Visa Approved',
  'Tuition fees paid',
  'Flight done',
  'EMGS Hold',
  'Visa Rejected'
];

// ---------------------------------------------------------------------------
// GET /api/students — list all students (with financials) for the logged-in user
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT
        s.id, s.user_id, s.name, s.passport_number,
        s.institute_name, s.course_program, s.processing_status,
        s.created_at, s.updated_at,
        f.id            AS financial_id,
        f.referrer_name,
        f.agent_commission,
        f.university_payment,
        f.amount_from_student,
        f.extra_incomes,
        f.currency
      FROM students s
      LEFT JOIN financials f ON f.student_id = s.id
      WHERE s.user_id = $1
    `;
    const params = [req.userId];

    if (status) {
      sql += ' AND s.processing_status = $2';
      params.push(status);
    }

    sql += ' ORDER BY s.created_at DESC';

    const students = await queryAll(sql, params);
    res.json({ students });
  } catch (err) {
    console.error('Get students error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/students — create a new student
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { name, passport_number, institute_name, course_program } = req.body;

    if (!name || !passport_number || !institute_name || !course_program) {
      return res.status(400).json({
        error: 'All fields are required: name, passport_number, institute_name, course_program.'
      });
    }

    const result = await runQuery(
      `INSERT INTO students (user_id, name, passport_number, institute_name, course_program)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.userId, name, passport_number, institute_name, course_program]
    );

    const student = await queryOne('SELECT * FROM students WHERE id = $1', [result.lastInsertRowid]);
    res.status(201).json({ student });
  } catch (err) {
    console.error('Create student error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/students/:id — update student basic info
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await queryOne('SELECT * FROM students WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found or access denied.' });
    }

    const { name, passport_number, institute_name, course_program } = req.body;

    await runQuery(
      `UPDATE students
       SET name = COALESCE($1, name),
           passport_number = COALESCE($2, passport_number),
           institute_name = COALESCE($3, institute_name),
           course_program = COALESCE($4, course_program),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name || null, passport_number || null, institute_name || null, course_program || null, id]
    );

    const updated = await queryOne('SELECT * FROM students WHERE id = $1', [id]);
    res.json({ student: updated });
  } catch (err) {
    console.error('Update student error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/students/:id/status — update processing status
// ---------------------------------------------------------------------------
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, processing_status } = req.body;
    const newStatus = status || processing_status;

    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        error: 'Invalid processing status.',
        allowed: ALLOWED_STATUSES
      });
    }

    const student = await queryOne('SELECT * FROM students WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found or access denied.' });
    }

    await runQuery(
      'UPDATE students SET processing_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    const updated = await queryOne('SELECT * FROM students WHERE id = $1', [id]);
    res.json({ student: updated });
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/students/:id — delete student and associated financials
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await queryOne('SELECT * FROM students WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found or access denied.' });
    }

    // Delete associated financial record first (FK constraint)
    await runQuery('DELETE FROM financials WHERE student_id = $1', [id]);
    await runQuery('DELETE FROM students WHERE id = $1', [id]);

    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
