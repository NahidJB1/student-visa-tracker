const express = require('express');
const { queryAll, queryOne } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// GET /api/dashboard/timeline — students added over time
// ---------------------------------------------------------------------------
router.get('/timeline', async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let sql;

    if (period === 'week') {
      // Last 7 days, grouped by day
      sql = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*) AS count
        FROM students
        WHERE user_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `;
    } else if (period === '6months') {
      // Last 6 months, grouped by month
      sql = `
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS date, COUNT(*) AS count
        FROM students
        WHERE user_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY date ASC
      `;
    } else {
      // Default: last 30 days, grouped by day
      sql = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*) AS count
        FROM students
        WHERE user_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `;
    }

    const timeline = await queryAll(sql, [req.userId]);
    // Ensure count is returned as a number (pg returns COUNT as string)
    const formattedTimeline = timeline.map(t => ({ date: t.date, count: parseInt(t.count, 10) }));
    
    res.json({ timeline: formattedTimeline });
  } catch (err) {
    console.error('Timeline error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/status-distribution — students grouped by status
// ---------------------------------------------------------------------------
router.get('/status-distribution', async (req, res) => {
  try {
    const distribution = await queryAll(`
      SELECT processing_status AS status, COUNT(*) AS count
      FROM students
      WHERE user_id = $1
      GROUP BY processing_status
      ORDER BY count DESC
    `, [req.userId]);

    // Ensure count is returned as a number
    const formattedDistribution = distribution.map(d => ({ status: d.status, count: parseInt(d.count, 10) }));

    res.json({ distribution: formattedDistribution });
  } catch (err) {
    console.error('Status distribution error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/earnings — earnings across periods
// Earnings = (amount_from_student - (agent_commission + university_payment))
//            + extra_income_amount
// ---------------------------------------------------------------------------
router.get('/earnings', async (req, res) => {
  try {
    const earningsQuery = async (monthsBack) => {
      const row = await queryOne(`
        SELECT COALESCE(SUM(
          (f.amount_from_student - (f.agent_commission + f.university_payment))
          + f.extra_income_amount
        ), 0) AS total
        FROM students s
        JOIN financials f ON f.student_id = s.id
        WHERE s.user_id = $1
          AND s.created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
      `, [req.userId]);
      return row ? parseFloat(row.total) : 0;
    };

    res.json({
      oneMonth: await earningsQuery(1),
      threeMonths: await earningsQuery(3),
      sixMonths: await earningsQuery(6),
      twelveMonths: await earningsQuery(12)
    });
  } catch (err) {
    console.error('Earnings error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
