const { Pool } = require('pg');
require('dotenv').config();

// Database configuration with production security settings
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'laundry_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  query_timeout: 60000,
  statement_timeout: 60000,
  idle_in_transaction_session_timeout: 60000
};

// Add SSL configuration for production (only if explicitly enabled)
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    // Add certificate paths if provided
    ...(process.env.DB_SSL_CERT && { cert: require('fs').readFileSync(process.env.DB_SSL_CERT) }),
    ...(process.env.DB_SSL_KEY && { key: require('fs').readFileSync(process.env.DB_SSL_KEY) }),
    ...(process.env.DB_SSL_CA && { ca: require('fs').readFileSync(process.env.DB_SSL_CA) })
  };
} else if (process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== 'database') {
  // Only enable SSL for remote production databases (not Docker containers)
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;