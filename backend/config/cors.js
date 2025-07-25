require('dotenv').config();

// CORS configuration for production
const getCorsConfig = () => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  return {
    origin: (origin, callback) => {
      // In production, be more strict about origin checking
      if (process.env.NODE_ENV === 'production') {
        // Only allow requests from allowed origins in production
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked request from origin: ${origin}`);
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      } else {
        // Allow requests with no origin in development (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',').map(m => m.trim()) : ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS
      ? process.env.CORS_ALLOWED_HEADERS.split(',').map(h => h.trim())
      : ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: process.env.NODE_ENV === 'production' ? 86400 : 300, // 24 hours in prod, 5 minutes in dev
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    preflightContinue: false // Pass control to next handler after successful preflight
  };
};

module.exports = {
  getCorsConfig
};