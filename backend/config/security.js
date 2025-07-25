const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Rate limiting configuration with enhanced production settings
const createRateLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
    // Enhanced production settings
    keyGenerator: (req) => {
      // Use X-Forwarded-For header if behind proxy, otherwise use IP
      const forwarded = req.headers['x-forwarded-for'];
      const realIp = req.headers['x-real-ip'];
      return forwarded ? forwarded.split(',')[0].trim() : realIp || req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
      const retryAfter = Math.round(req.rateLimit.resetTime / 1000);
      res.set('Retry-After', retryAfter);
      
      // Log rate limit exceeded
      const clientIp = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.get('User-Agent') || 'Unknown';
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] Rate limit exceeded - IP: ${clientIp}, User-Agent: ${userAgent}, Path: ${req.path}`);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: retryAfter,
          limit: req.rateLimit.limit,
          remaining: req.rateLimit.remaining,
          resetTime: new Date(req.rateLimit.resetTime).toISOString()
        }
      });
    },
    // Skip rate limiting for health checks
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

// Authentication rate limiter (more restrictive)
const createAuthRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      const realIp = req.headers['x-real-ip'];
      return forwarded ? forwarded.split(',')[0].trim() : realIp || req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
      const retryAfter = Math.round(req.rateLimit.resetTime / 1000);
      res.set('Retry-After', retryAfter);
      
      // Log auth rate limit exceeded
      const clientIp = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.get('User-Agent') || 'Unknown';
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] AUTH RATE LIMIT EXCEEDED - IP: ${clientIp}, User-Agent: ${userAgent}, Path: ${req.path}`);
      
      // Log potential brute force attack
      if (process.env.NODE_ENV === 'production') {
        console.error(`[SECURITY ALERT] Potential brute force attack detected from IP: ${clientIp}`);
      }
      
      res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts from this IP. Please try again later.',
          retryAfter: retryAfter,
          resetTime: new Date(req.rateLimit.resetTime).toISOString()
        }
      });
    }
  });
};

// Helmet security configuration
const getHelmetConfig = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const config = {
    contentSecurityPolicy: process.env.CSP_ENABLED === 'true' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Note: Consider removing unsafe-inline in production
        connectSrc: ["'self'", frontendUrl],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      },
      reportOnly: process.env.NODE_ENV !== 'production' // Only report in development
    } : false,
    crossOriginEmbedderPolicy: false, // Disable for file uploads
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: process.env.HSTS_ENABLED === 'true' ? {
      maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  };

  return config;
};

// HTTPS redirect middleware
const httpsRedirect = (req, res, next) => {
  if (process.env.FORCE_HTTPS === 'true') {
    // Check various headers that indicate HTTP vs HTTPS
    const isHttps = req.secure || 
                   req.header('x-forwarded-proto') === 'https' ||
                   req.header('x-forwarded-ssl') === 'on' ||
                   req.header('x-forwarded-scheme') === 'https';
    
    if (!isHttps) {
      const host = req.header('host') || req.hostname;
      return res.redirect(301, `https://${host}${req.url}`);
    }
  }
  next();
};

// Trust proxy configuration
const configureTrustProxy = (app) => {
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }
};

// Compression configuration
const getCompressionConfig = () => {
  return {
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024 // Only compress responses larger than 1KB
  };
};

// Morgan logging configuration
const getMorganConfig = () => {
  const format = process.env.LOG_FORMAT || 'combined';
  const options = {};
  
  if (process.env.NODE_ENV === 'production') {
    options.skip = (req, res) => res.statusCode < 400; // Only log errors in production
  }
  
  return { format, options };
};

module.exports = {
  createRateLimiter,
  createAuthRateLimiter,
  getHelmetConfig,
  httpsRedirect,
  configureTrustProxy,
  getCompressionConfig,
  getMorganConfig
};