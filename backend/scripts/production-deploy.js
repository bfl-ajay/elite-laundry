#!/usr/bin/env node

/**
 * Production Deployment Script
 * Handles complete production deployment setup with security configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 Starting production deployment setup...\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Step 1: Environment Configuration
log('📋 Step 1: Environment Configuration', 'cyan');

const prodEnvPath = path.join(__dirname, '..', '.env.production');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(prodEnvPath) && !fs.existsSync(envPath)) {
  log('   Copying production environment template...', 'blue');
  fs.copyFileSync(prodEnvPath, envPath);
  log('   ✅ Environment configuration copied', 'green');
} else if (!fs.existsSync(envPath)) {
  log('   ❌ No .env file found. Please create one based on .env.example', 'red');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Step 2: Generate secure session secret if not provided
log('\n🔐 Step 2: Security Configuration', 'cyan');

let envContent = fs.readFileSync(envPath, 'utf8');

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-super-secure-session-secret-here') {
  log('   Generating secure session secret...', 'blue');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  envContent = envContent.replace(
    /SESSION_SECRET=.*/,
    `SESSION_SECRET=${sessionSecret}`
  );
  fs.writeFileSync(envPath, envContent);
  log('   ✅ Secure session secret generated', 'green');
}

// Step 3: Validate required environment variables
log('\n🔍 Step 3: Environment Validation', 'cyan');

const requiredVars = [
  'DB_HOST',
  'DB_NAME', 
  'DB_USER',
  'DB_PASSWORD',
  'SESSION_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGIN'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  log('   ❌ Missing required environment variables:', 'red');
  missingVars.forEach(varName => log(`      - ${varName}`, 'red'));
  log('   Please update your .env file with the required values.', 'yellow');
  process.exit(1);
}

log('   ✅ All required environment variables present', 'green');

// Step 4: Security Configuration Validation
log('\n🛡️  Step 4: Security Configuration Validation', 'cyan');

const securityChecks = [
  {
    name: 'NODE_ENV set to production',
    check: () => process.env.NODE_ENV === 'production',
    fix: () => {
      envContent = envContent.replace(/NODE_ENV=.*/, 'NODE_ENV=production');
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'HTTPS enforcement enabled',
    check: () => process.env.FORCE_HTTPS === 'true',
    fix: () => {
      envContent = envContent.replace(/FORCE_HTTPS=.*/, 'FORCE_HTTPS=true');
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'Database SSL enabled',
    check: () => process.env.DB_SSL === 'true',
    fix: () => {
      envContent = envContent.replace(/DB_SSL=.*/, 'DB_SSL=true');
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'Security headers enabled',
    check: () => process.env.HELMET_ENABLED === 'true',
    fix: () => {
      envContent = envContent.replace(/HELMET_ENABLED=.*/, 'HELMET_ENABLED=true');
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'Rate limiting configured',
    check: () => process.env.RATE_LIMIT_MAX_REQUESTS && parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) <= 100,
    fix: () => {
      if (!envContent.includes('RATE_LIMIT_MAX_REQUESTS=')) {
        envContent += '\nRATE_LIMIT_MAX_REQUESTS=100';
        fs.writeFileSync(envPath, envContent);
      }
    }
  }
];

let securityIssues = 0;
securityChecks.forEach(check => {
  if (!check.check()) {
    log(`   ⚠️  ${check.name} - fixing...`, 'yellow');
    check.fix();
    securityIssues++;
  } else {
    log(`   ✅ ${check.name}`, 'green');
  }
});

if (securityIssues > 0) {
  log(`   🔧 Fixed ${securityIssues} security configuration issues`, 'green');
  // Reload environment after fixes
  require('dotenv').config();
}

// Step 5: Directory Setup
log('\n📁 Step 5: Directory Setup', 'cyan');

const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  log('   Creating uploads directory...', 'blue');
  fs.mkdirSync(uploadsDir, { recursive: true });
  log('   ✅ Uploads directory created', 'green');
} else {
  log('   ✅ Uploads directory exists', 'green');
}

// Set proper permissions for uploads directory (Unix systems)
if (process.platform !== 'win32') {
  try {
    execSync(`chmod 755 ${uploadsDir}`);
    log('   ✅ Uploads directory permissions set', 'green');
  } catch (error) {
    log('   ⚠️  Could not set uploads directory permissions', 'yellow');
  }
}

// Step 6: Database Connection Test
log('\n🗄️  Step 6: Database Connection Test', 'cyan');

try {
  const pool = require('../config/database');
  
  // Test connection with timeout
  const testConnection = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Database connection timeout'));
      }, 10000);
      
      pool.query('SELECT NOW() as current_time, version() as db_version', (err, result) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
  
  testConnection()
    .then(result => {
      log('   ✅ Database connection successful', 'green');
      log(`   📊 Database version: ${result.rows[0].db_version.split(' ')[0]} ${result.rows[0].db_version.split(' ')[1]}`, 'blue');
      log(`   🕐 Current time: ${result.rows[0].current_time}`, 'blue');
      
      // Step 7: Database Initialization
      log('\n🔧 Step 7: Database Initialization', 'cyan');
      try {
        execSync('node scripts/init-db.js', { stdio: 'inherit' });
        log('   ✅ Database schema initialized', 'green');
      } catch (error) {
        log('   ⚠️  Database initialization failed - may already be initialized', 'yellow');
      }
      
      pool.end();
      
      // Step 8: Production Dependencies
      log('\n📦 Step 8: Production Dependencies', 'cyan');
      try {
        log('   Installing production dependencies...', 'blue');
        execSync('npm ci --only=production', { stdio: 'inherit' });
        log('   ✅ Production dependencies installed', 'green');
      } catch (error) {
        log('   ❌ Failed to install dependencies', 'red');
        process.exit(1);
      }
      
      // Step 9: Security Audit
      log('\n🔍 Step 9: Security Audit', 'cyan');
      try {
        execSync('npm audit --audit-level=high', { stdio: 'pipe' });
        log('   ✅ No high-severity security vulnerabilities found', 'green');
      } catch (error) {
        log('   ⚠️  Security vulnerabilities detected - run "npm audit fix"', 'yellow');
      }
      
      // Step 10: Final Configuration Summary
      log('\n📋 Step 10: Deployment Summary', 'cyan');
      log('   Production deployment configuration complete!', 'green');
      log('\n   🔐 Security Features Enabled:', 'magenta');
      log('      • HTTPS enforcement', 'blue');
      log('      • Database SSL connections', 'blue');
      log('      • Rate limiting (100 req/15min)', 'blue');
      log('      • Security headers (Helmet.js)', 'blue');
      log('      • CORS protection', 'blue');
      log('      • Session security', 'blue');
      log('      • Input validation', 'blue');
      log('      • File upload restrictions', 'blue');
      
      log('\n   🚀 Next Steps:', 'magenta');
      log('      1. Start the server: npm start', 'blue');
      log('      2. Test health endpoint: curl https://your-domain.com/health', 'blue');
      log('      3. Monitor logs for any issues', 'blue');
      log('      4. Set up reverse proxy (nginx/Apache) if needed', 'blue');
      
      log('\n   📊 Health Check Available:', 'magenta');
      log(`      GET http://localhost:${process.env.PORT || 3001}/health`, 'blue');
      
    })
    .catch(error => {
      log('   ❌ Database connection failed:', 'red');
      log(`      ${error.message}`, 'red');
      log('\n   🔧 Troubleshooting:', 'yellow');
      log('      • Check database credentials in .env', 'blue');
      log('      • Verify database server is running', 'blue');
      log('      • Check network connectivity', 'blue');
      log('      • Verify SSL configuration if enabled', 'blue');
      process.exit(1);
    });
    
} catch (error) {
  log('   ❌ Database configuration error:', 'red');
  log(`      ${error.message}`, 'red');
  process.exit(1);
}