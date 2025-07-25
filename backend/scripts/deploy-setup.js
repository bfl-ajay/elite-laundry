#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up production deployment...');

// Check if production environment file exists
const prodEnvPath = path.join(__dirname, '..', '.env.production');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(prodEnvPath) && !fs.existsSync(envPath)) {
  console.log('📋 Copying production environment configuration...');
  fs.copyFileSync(prodEnvPath, envPath);
  console.log('✅ Environment configuration copied');
} else if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Please create one based on .env.example');
  process.exit(1);
}

// Validate required environment variables
const requiredVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'SESSION_SECRET',
  'FRONTEND_URL'
];

require('dotenv').config();

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('Please update your .env file with the required values.');
  process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// Set proper permissions for uploads directory (Unix systems)
if (process.platform !== 'win32') {
  try {
    execSync(`chmod 755 ${uploadsDir}`);
    console.log('✅ Uploads directory permissions set');
  } catch (error) {
    console.log('⚠️  Could not set uploads directory permissions');
  }
}

// Test database connection
console.log('🔍 Testing database connection...');
try {
  const pool = require('../config/database');
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.log('❌ Database connection failed:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection successful');
      
      // Initialize database if needed
      console.log('🗄️  Initializing database...');
      try {
        execSync('node scripts/init-db.js', { stdio: 'inherit' });
        console.log('✅ Database initialized');
      } catch (error) {
        console.log('⚠️  Database initialization failed:', error.message);
      }
      
      pool.end();
      console.log('🎉 Production deployment setup complete!');
    }
  });
} catch (error) {
  console.log('❌ Database configuration error:', error.message);
  process.exit(1);
}