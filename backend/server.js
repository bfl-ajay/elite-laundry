const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import configuration
const { getCorsConfig } = require('./config/cors');
const {
  createRateLimiter,
  createAuthRateLimiter,
  getHelmetConfig,
  httpsRedirect,
  configureTrustProxy,
  getCompressionConfig,
  getMorganConfig
} = require('./config/security');

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const expenseRoutes = require('./routes/expenses');
const analyticsRoutes = require('./routes/analytics');
const businessSettingsRoutes = require('./routes/businessSettings');
const userRoutes = require('./routes/users');

// Import Swagger configuration
const { serve, setup } = require('./config/swagger');

// Import error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure trust proxy for production
configureTrustProxy(app);

// HTTPS redirect middleware (must be first)
if (process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true') {
  app.use(httpsRedirect);
}

// Security middleware
if (process.env.HELMET_ENABLED === 'true') {
  app.use(helmet(getHelmetConfig()));
}

// Compression middleware
if (process.env.COMPRESSION_ENABLED === 'true') {
  app.use(compression(getCompressionConfig()));
}

// Logging middleware
if (process.env.ACCESS_LOG_ENABLED === 'true') {
  const { format, options } = getMorganConfig();
  app.use(morgan(format, options));
}

// Rate limiting (disabled for development)
// const generalLimiter = createRateLimiter();
// const authLimiter = createAuthRateLimiter();

// app.use(generalLimiter);

// CORS configuration
app.use(cors(getCorsConfig()));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with enhanced security
app.use(session({
  secret: process.env.SESSION_SECRET || 'laundry-management-secret',
  name: process.env.SESSION_NAME || 'laundry_session',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Documentation
app.use('/api-docs', serve, setup);

// Routes with rate limiting (disabled for development)
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/business-settings', businessSettingsRoutes);
app.use('/api/users', userRoutes);

// Serve uploaded branding files
app.use('/uploads/branding', express.static(path.join(__dirname, 'uploads/branding')));

// Health check endpoint with comprehensive checks
app.get('/health', async (req, res) => {
  const health = {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };

  // Database health check
  try {
    const pool = require('./config/database');
    const result = await pool.query('SELECT NOW()');
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now(),
      connection: 'active'
    };
  } catch (error) {
    health.success = false;
    health.status = 'error';
    health.checks.database = {
      status: 'error',
      error: error.message
    };
  }

  // File system check
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
    fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
    health.checks.filesystem = {
      status: 'ok',
      uploadsDir: uploadsDir
    };
  } catch (error) {
    health.checks.filesystem = {
      status: 'warning',
      error: error.message
    };
  }

  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes