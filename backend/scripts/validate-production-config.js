#!/usr/bin/env node

/**
 * Production Configuration Validation Script
 * Validates that all required environment variables and security settings are properly configured
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  error(message) {
    this.errors.push(`❌ ERROR: ${message}`);
  }

  warning(message) {
    this.warnings.push(`⚠️  WARNING: ${message}`);
  }

  pass(message) {
    this.passed.push(`✅ PASS: ${message}`);
  }

  validateEnvironmentVariables() {
    console.log('\n🔍 Validating Environment Variables...\n');

    // Required environment variables
    const required = [
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'SESSION_SECRET',
      'FRONTEND_URL',
      'CORS_ORIGIN'
    ];

    required.forEach(envVar => {
      if (!process.env[envVar]) {
        this.error(`Missing required environment variable: ${envVar}`);
      } else {
        this.pass(`Environment variable ${envVar} is set`);
      }
    });

    // Validate NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      this.warning('NODE_ENV is not set to "production"');
    } else {
      this.pass('NODE_ENV is set to production');
    }

    // Validate session secret strength
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret) {
      if (sessionSecret.length < 32) {
        this.error('SESSION_SECRET should be at least 32 characters long');
      } else if (sessionSecret === 'your-super-secure-session-secret-here') {
        this.error('SESSION_SECRET is still using the default template value');
      } else {
        this.pass('SESSION_SECRET appears to be properly configured');
      }
    }

    // Validate database password strength
    const dbPassword = process.env.DB_PASSWORD;
    if (dbPassword) {
      if (dbPassword.length < 12) {
        this.warning('DB_PASSWORD should be at least 12 characters long');
      } else if (dbPassword === 'your-secure-database-password-here') {
        this.error('DB_PASSWORD is still using the default template value');
      } else {
        this.pass('DB_PASSWORD appears to be properly configured');
      }
    }

    // Validate URLs
    const frontendUrl = process.env.FRONTEND_URL;
    const corsOrigin = process.env.CORS_ORIGIN;
    
    if (frontendUrl && !frontendUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      this.warning('FRONTEND_URL should use HTTPS in production');
    }
    
    if (corsOrigin && !corsOrigin.startsWith('https://') && process.env.NODE_ENV === 'production') {
      this.warning('CORS_ORIGIN should use HTTPS in production');
    }
  }

  validateSecuritySettings() {
    console.log('\n🔒 Validating Security Settings...\n');

    // Check security flags
    const securityFlags = {
      'HELMET_ENABLED': 'Helmet security headers',
      'CSP_ENABLED': 'Content Security Policy',
      'HSTS_ENABLED': 'HTTP Strict Transport Security',
      'FORCE_HTTPS': 'HTTPS enforcement',
      'DB_SSL': 'Database SSL connection',
      'COMPRESSION_ENABLED': 'Response compression'
    };

    Object.entries(securityFlags).forEach(([flag, description]) => {
      if (process.env[flag] === 'true') {
        this.pass(`${description} is enabled`);
      } else {
        this.warning(`${description} is not enabled (${flag}=true)`);
      }
    });

    // Validate rate limiting
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    if (rateLimitMax > 1000) {
      this.warning('Rate limit seems high (>1000 requests per window)');
    } else {
      this.pass(`Rate limiting configured: ${rateLimitMax} requests per window`);
    }

    // Validate bcrypt rounds
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    if (bcryptRounds < 12) {
      this.warning('BCRYPT_ROUNDS should be at least 12 for production');
    } else {
      this.pass(`Bcrypt rounds properly configured: ${bcryptRounds}`);
    }

    // Check trust proxy setting
    if (process.env.TRUST_PROXY === 'true') {
      this.pass('Trust proxy is enabled for load balancer/reverse proxy');
    } else {
      this.warning('TRUST_PROXY not enabled - ensure this is correct for your deployment');
    }
  }

  validateFileSystem() {
    console.log('\n📁 Validating File System...\n');

    // Check uploads directory
    const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    try {
      fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      this.pass(`Uploads directory is accessible: ${uploadsDir}`);
    } catch (error) {
      this.error(`Uploads directory not accessible: ${uploadsDir} - ${error.message}`);
    }

    // Check file upload limits
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880;
    if (maxFileSize > 10 * 1024 * 1024) { // 10MB
      this.warning('MAX_FILE_SIZE is quite large (>10MB)');
    } else {
      this.pass(`File upload size limit: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }

    // Check allowed file types
    const allowedTypes = process.env.ALLOWED_FILE_TYPES;
    if (allowedTypes) {
      const types = allowedTypes.split(',');
      if (types.includes('*/*') || types.includes('*')) {
        this.error('File upload allows all file types - this is a security risk');
      } else {
        this.pass(`File upload restricted to: ${allowedTypes}`);
      }
    } else {
      this.warning('ALLOWED_FILE_TYPES not configured');
    }
  }

  async validateDatabaseConnection() {
    console.log('\n🗄️  Validating Database Connection...\n');

    try {
      const pool = require('../config/database');
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      this.pass(`Database connection successful`);
      this.pass(`Database version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      
      // Check SSL status
      const sslResult = await pool.query('SHOW ssl');
      if (sslResult.rows[0].ssl === 'on') {
        this.pass('Database SSL is enabled');
      } else if (process.env.NODE_ENV === 'production') {
        this.warning('Database SSL is not enabled in production');
      }
      
    } catch (error) {
      this.error(`Database connection failed: ${error.message}`);
    }
  }

  validateNginxConfig() {
    console.log('\n🌐 Validating Nginx Configuration...\n');

    const nginxConfigPath = path.join(__dirname, '../../deployment/nginx.conf');
    
    try {
      const nginxConfig = fs.readFileSync(nginxConfigPath, 'utf8');
      
      // Check for security headers
      const securityHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Content-Security-Policy'
      ];
      
      securityHeaders.forEach(header => {
        if (nginxConfig.includes(header)) {
          this.pass(`Nginx security header configured: ${header}`);
        } else {
          this.warning(`Nginx security header missing: ${header}`);
        }
      });
      
      // Check for rate limiting
      if (nginxConfig.includes('limit_req_zone')) {
        this.pass('Nginx rate limiting is configured');
      } else {
        this.warning('Nginx rate limiting not found in configuration');
      }
      
      // Check for SSL configuration
      if (nginxConfig.includes('ssl_certificate')) {
        this.pass('Nginx SSL configuration found');
      } else {
        this.warning('Nginx SSL configuration not found');
      }
      
      // Check for gzip compression
      if (nginxConfig.includes('gzip on')) {
        this.pass('Nginx gzip compression is enabled');
      } else {
        this.warning('Nginx gzip compression not enabled');
      }
      
    } catch (error) {
      this.warning(`Could not read Nginx configuration: ${error.message}`);
    }
  }

  async run() {
    console.log('🚀 Production Configuration Validation\n');
    console.log('=====================================');

    this.validateEnvironmentVariables();
    this.validateSecuritySettings();
    this.validateFileSystem();
    await this.validateDatabaseConnection();
    this.validateNginxConfig();

    // Print results
    console.log('\n📊 Validation Results\n');
    console.log('===================');

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.passed.forEach(msg => console.log(`  ${msg}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(msg => console.log(`  ${msg}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(msg => console.log(`  ${msg}`));
    }

    console.log('\n📈 SUMMARY:');
    console.log(`  ✅ Passed: ${this.passed.length}`);
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`  ❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL: Please fix all errors before deploying to production!');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  Please review warnings before deploying to production.');
      process.exit(0);
    } else {
      console.log('\n🎉 All checks passed! Configuration is ready for production.');
      process.exit(0);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionValidator;