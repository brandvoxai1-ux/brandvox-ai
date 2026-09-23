// server/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' }); // Load configurations from parent directory

const authRouter = require('./routes/auth');
const generateRouter = require('./routes/generate');
const creditsRouter = require('./routes/credits');
const adminRouter = require('./routes/admin');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Helmet security policy headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows video player items loading from third-party storage links
}));

// Configure Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!process.env.CLIENT_URL) return callback(null, true);
    const clientClean = process.env.CLIENT_URL.replace(/\/$/, '');
    if (origin === clientClean || origin.includes('localhost') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));



// Global JSON request parser for other regular endpoints
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Middleware Mounts
app.use('/api/auth', authRouter);
app.use('/api/generate', generateRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);

// Models list endpoint (proxies to database using service credentials to avoid direct RLS/CORS issues)
app.get('/api/models', async (req, res) => {
  const supabase = require('./lib/supabase');
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('price_per_second', { ascending: true });

    if (error) throw error;
    res.json(models);
  } catch (err) {
    console.error('[models] Error fetching models:', err);
    res.status(500).json({ error: 'Failed to retrieve active video models.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'BrandVox AI',
    timestamp: new Date().toISOString(),
    ready: !!((process.env.REPLICATE_API_TOKEN || process.env.FAL_KEY) && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    ai_backend: process.env.REPLICATE_API_TOKEN ? 'replicate' : 'fal.ai'
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Send all non-API requests to the React app
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Route fallback for 404 (API routes)
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url} - Endpoint not found.` });
});

// Centralized error handler catches background errors
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler] Uncaught exception:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected exception occurred inside the Express engine.'
  });
});

// Only listen locally or on standard persistent servers (like Render)
// We check for NETLIFY, VERCEL, or AWS_LAMBDA to prevent crash on serverless
if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_VERSION && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log(` BRANDVOX AI — BACKEND SERVER BOOTED SUCCESSFULLY`);
    console.log(` Port:         ${PORT}`);
    console.log(` Target Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('==================================================');
  });
}

// Export the Express API for Serverless Functions
module.exports = app;
