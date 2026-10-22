require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const recipeRoutes = require('./routes/recipes');
const disposalRoutes = require('./routes/disposal');
const cronRoutes = require('./routes/cron');
const { apiLimiter } = require('./middleware/rateLimiter');
const { startExpiryChecker } = require('./utils/expiryChecker');

const app = express();

// Trust reverse proxy (Render, Vercel, Heroku, Cloudflare) for accurate client IP identification
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for API backend consumed by SPA
    crossOriginEmbedderPolicy: false,
  })
);

// Parse allowed CORS origins (support comma-separated list or fallback to localhost)
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Always ensure local development origins are permitted
if (!allowedOrigins.includes('http://localhost:3000')) {
  allowedOrigins.push('http://localhost:3000');
}
if (!allowedOrigins.includes('http://127.0.0.1:3000')) {
  allowedOrigins.push('http://127.0.0.1:3000');
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, external cron pingers)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// Apply general API rate limiting only in production or when not running tests
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', apiLimiter);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/disposal', disposalRoutes);
app.use('/api/cron', cronRoutes);

// Health check endpoint
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Only connect to DB and start listening if executed directly (not when imported in tests)
if (require.main === module) {
  // Startup environment validation
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    console.error(`\n❌ Startup Error: Missing required environment variable(s): ${missingEnv.join(', ')}`);
    console.error('Please configure them in server/.env before starting the server.\n');
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 16) {
    console.warn('\n⚠️ Warning: JWT_SECRET should be a strong random string of at least 16 characters.\n');
  }

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
        // Start the internal daily cron job (runs when the process is awake)
        startExpiryChecker();
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
