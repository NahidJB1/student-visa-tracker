require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDb } = require('./config/db');

// Import route modules
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const financialRoutes = require('./routes/financials');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors()); // Allow all origins for Vercel deployment
app.use(express.json());
app.use(morgan('dev'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/students', financialRoutes);   // mounts /:id/financials under /api/students
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ---------------------------------------------------------------------------
// Start server (after DB initialization)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
