const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');
require('dotenv').config();

const relayRouter = require('./routes/relay');
const healthRouter = require('./routes/health');
const analyticsRouter = require('./routes/analytics');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per minute
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Routes
app.use('/api/v1/relay', relayRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'GaslessGameFi Relay Service',
    version: '1.0.0',
    documentation: 'https://github.com/thebunnygoyal/gaslessgamefi-relay',
    endpoints: {
      relay: '/api/v1/relay',
      health: '/api/v1/health',
      analytics: '/api/v1/analytics'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`GaslessGameFi Relay Service running on port ${PORT}`);
});

module.exports = app;