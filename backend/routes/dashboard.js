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
// GET /api/dashboard/earnings-timeline — earnings over time
// ---------------------------------------------------------------------------
router.get('/earnings-timeline', async (req, res) => {
  try {
    const period = req.query.period || '1m';
    const currency = req.query.currency || 'RM';
    let interval = '1 month';
    if (period === '3m') interval = '3 months';
    if (period === '6m') interval = '6 months';

    // Fetch raw rows
    const rows = await queryAll(`
      SELECT 
        s.created_at,
        f.amount_from_student,
        f.agent_commission,
        f.university_payment,
        f.extra_incomes
      FROM students s
      JOIN financials f ON f.student_id = s.id
      WHERE s.user_id = $1 AND f.currency = $2
        AND s.created_at >= CURRENT_DATE - INTERVAL '${interval}'
      ORDER BY s.created_at ASC
    `, [req.userId, currency]);

    // Aggregate in Node.js
    const aggregatedMap = new Map();

    rows.forEach(row => {
      const d = new Date(row.created_at);
      let groupKey;
      if (period === '1m') {
        // Group by ISO week (e.g. Week 42)
        const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        dCopy.setUTCDate(dCopy.getUTCDate() + 4 - (dCopy.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
        const weekNo = Math.ceil(( ( (dCopy - yearStart) / 86400000) + 1)/7);
        groupKey = `Week ${weekNo}`;
      } else {
        // Group by month (e.g. "Jan", "Feb")
        groupKey = d.toLocaleString('en-US', { month: 'short' });
      }

      const fromStudent = parseFloat(row.amount_from_student) || 0;
      const agentComm = parseFloat(row.agent_commission) || 0;
      const uniPayment = parseFloat(row.university_payment) || 0;
      
      let extraIncomes = [];
      if (typeof row.extra_incomes === 'string') {
        try { extraIncomes = JSON.parse(row.extra_incomes); } catch(e){}
      } else if (Array.isArray(row.extra_incomes)) {
        extraIncomes = row.extra_incomes;
      }
      
      const totalExtraIncome = extraIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
      const rowTotal = (fromStudent - (agentComm + uniPayment)) + totalExtraIncome;

      aggregatedMap.set(groupKey, (aggregatedMap.get(groupKey) || 0) + rowTotal);
    });

    const timeline = [];
    for (const [date, total] of aggregatedMap.entries()) {
      timeline.push({ date, total });
    }

    res.json({ timeline });
  } catch (err) {
    console.error('Earnings error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
