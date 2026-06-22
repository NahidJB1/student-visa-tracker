const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// In-memory cache for the universities data to avoid parsing the JSON file on every request
let universitiesCache = null;

const loadUniversities = () => {
  if (!universitiesCache) {
    try {
      const dataPath = path.join(__dirname, '../universities.json');
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      universitiesCache = JSON.parse(rawData);
    } catch (err) {
      console.error('Failed to load universities data:', err);
      universitiesCache = [];
    }
  }
  return universitiesCache;
};

// ---------------------------------------------------------------------------
// GET /api/universities
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const data = loadUniversities();
    res.json({ programs: data });
  } catch (err) {
    console.error('Get universities error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/universities/search
// ---------------------------------------------------------------------------
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    const data = loadUniversities();

    if (!q) {
      return res.json({ programs: data });
    }

    const lowerQ = q.toLowerCase();
    
    // Search across university name, program name, and level
    const filtered = data.filter(prog => 
      prog.university.toLowerCase().includes(lowerQ) ||
      prog.name.toLowerCase().includes(lowerQ) ||
      prog.level.toLowerCase().includes(lowerQ)
    );

    res.json({ programs: filtered });
  } catch (err) {
    console.error('Search universities error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
