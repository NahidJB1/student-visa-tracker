const express = require('express');
const { queryAll, queryOne, runQuery } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/notes
router.get('/', async (req, res) => {
  try {
    const notes = await queryAll(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json({ notes });
  } catch (err) {
    console.error('Get notes error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/notes
router.post('/', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const result = await runQuery(
      'INSERT INTO notes (user_id, title, content, color) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.userId, title || '', content || '', color || 'default']
    );
    const note = await queryOne('SELECT * FROM notes WHERE id = $1', [result.lastInsertRowid]);
    res.status(201).json({ note });
  } catch (err) {
    console.error('Create note error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, color } = req.body;
    
    const existing = await queryOne('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (!existing) return res.status(404).json({ error: 'Note not found.' });

    await runQuery(
      `UPDATE notes 
       SET title = COALESCE($1, title), 
           content = COALESCE($2, content), 
           color = COALESCE($3, color), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [title, content, color, id]
    );

    const note = await queryOne('SELECT * FROM notes WHERE id = $1', [id]);
    res.json({ note });
  } catch (err) {
    console.error('Update note error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (!existing) return res.status(404).json({ error: 'Note not found.' });

    await runQuery('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error('Delete note error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
