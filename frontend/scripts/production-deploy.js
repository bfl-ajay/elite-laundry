#!/usr/bin/env node

/**
 * Frontend Production Deployment Script
 * Handles frontend production build and deployment setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting frontend production deployment setup...\n');

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
log('📋 Step 1: Frontend Environment Configuration', 'cyan');

const prodEnvPath = path.join(__dirname, '..', '.env.production');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(prodEnvPath) && !fs.existsSync(envPath)) {
  log('   Copying production environment template...', 'blue');
  fs.copyFileSync(prodEnvPath, envPath);
  log('   ✅ Environment configuration copied', 'green');
} else if (!fs.existsSync(envPath)) {
  log('   ❌ No .env file found. Please create one based on .env.production', 'red');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Step 2: Validate required environment variables
log('\n🔍 Step 2: Environment Validation', 'cyan');

const requiredVars = [
  'VITE_API_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  log('   ❌ Missing required environment variables:', 'red');
  missingVars.forEach(varName => log(`      - ${varName}`, 'red'));
  log('   Please update your .env file with the required values.', 'yellow');
  process.exit(1);
}

log('   ✅ All required environment variables present', 'green');

// Step 3: Production Configuration Validation
log('\n🛡️  Step 3: Production Configuration Validation', 'cyan');

let envContent = fs.readFileSync(envPath, 'utf8');

const productionChecks = [
  {
    name: 'NODE_ENV set to production',
    check: () => process.env.NODE_ENV === 'production',
    fix: () => {
      if (!envContent.includes('NODE_ENV=')) {
        envContent += '\nNODE_ENV=production';
      } else {
        envContent = envContent.replace(/NODE_ENV=.*/, 'NODE_ENV=production');
      }
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'DevTools disabled',
    check: () => process.env.VITE_ENABLE_DEVTOOLS === 'false',
    fix: () => {
      if (!envContent.includes('VITE_ENABLE_DEVTOOLS=')) {
        envContent += '\nVITE_ENABLE_DEVTOOLS=false';
      } else {
        envContent = envContent.replace(/VITE_ENABLE_DEVTOOLS=.*/, 'VITE_ENABLE_DEVTOOLS=false');
      }
      fs.writeFileSync(envPath, envContent);
    }
  },
  {
    name: 'API URL uses HTTPS',
    check: () => process.env.VITE_API_URL && process.env.VITE_API_URL.startsWith('https://'),
    fix: () => {
      log('   ⚠️  API URL should use HTTPS in production', 'yellow');
      log('   Please update VITE_API_URL in .env to use https://', 'yellow');
    }
  }
];

let configIssues = 0;
productionChecks.forEach(check => {
  if (!check.check()) {
    log(`   ⚠️  ${check.name} - fixing...`, 'yellow');
    check.fix();
    configIssues++;
  } else {
    log(`   ✅ ${check.name}`, 'green');
  }
});

if (configIssues > 0) {
  log(`   🔧 Fixed ${configIssues} configuration issues`, 'green');
  // Reload environment after fixes
  require('dotenv').config();
}

// Step 4: Clean previous builds
log('\n🧹 Step 4: Cleaning Previous Builds', 'cyan');

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  log('   Removing previous build...', 'blue');
  fs.rmSync(distDir, { recursive: true, force: true });
  log('   ✅ Previous build cleaned', 'green');
} else {
  log('   ✅ No previous build to clean', 'green');
}

// Step 5: Install production dependencies
log('\n📦 Step 5: Installing Dependencies', 'cyan');

try {
  log('   Installing dependencies...', 'blue');
  execSync('npm ci', { stdio: 'inherit' });
  log('   ✅ Dependencies installed', 'green');
} catch (error) {
  log('   ❌ Failed to install dependencies', 'red');
  process.exit(1);
}

// Step 6: Security audit
log('\n🔍 Step 6: Security Audit', 'cyan');

try {
  execSync('npm audit --audit-level=high', { stdio: 'pipe' });
  log('   ✅ No high-severity security vulnerabilities found', 'green');
} catch (error) {
  log('   ⚠️  Security vulnerabilities detected - run "npm audit fix"', 'yellow');
}

// Step 7: Build for production
log('\n🏗️  Step 7: Building for Production', 'cyan');

try {
  log('   Building production bundle...', 'blue');
  execSync('npm run build', { stdio: 'inherit' });
  log('   ✅ Production build completed', 'green');
} catch (error) {
  log('   ❌ Build failed', 'red');
  process.exit(1);
}

// Step 8: Analyze build output
log('\n📊 Step 8: Build Analysis', 'cyan');

if (fs.existsSync(distDir)) {
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  };
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const buildSize = getDirectorySize(distDir);
  log(`   📦 Build size: ${formatBytes(buildSize)}`, 'blue');
  
  // Check for common files
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    log('   ✅ index.html generated', 'green');
  }
  
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    log(`   ✅ ${assetFiles.length} asset files generated`, 'green');
  }
  
} else {
  log('   ❌ Build directory not found', 'red');
  process.exit(1);
}

// Step 9: Create deployment info
log('\n📋 Step 9: Creating Deployment Info', 'cyan');

const deploymentInfo = {
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'production',
  apiUrl: process.env.VITE_API_URL,
  buildSize: fs.existsSync(distDir) ? getDirectorySize(distDir) : 0,
  version: require('../package.json').version
};

const deploymentInfoPath = path.join(distDir, 'deployment-info.json');
fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
log('   ✅ Deployment info created', 'green');

// Step 10: Final summary
log('\n📋 Step 10: Frontend Deployment Summary', 'cyan');
log('   Frontend production build complete!', 'green');

log('\n   📦 Build Output:', 'magenta');
log(`      Location: ${distDir}`, 'blue');
log(`      Size: ${formatBytes(deploymentInfo.buildSize)}`, 'blue');
log(`      API URL: ${deploymentInfo.apiUrl}`, 'blue');

log('\n   🚀 Deployment Options:', 'magenta');
log('      • Static hosting (Netlify, Vercel, S3)', 'blue');
log('      • Web server (nginx, Apache)', 'blue');
log('      • CDN distribution', 'blue');

log('\n   📊 Next Steps:', 'magenta');
log('      1. Upload dist/ folder to your hosting provider', 'blue');
log('      2. Configure web server to serve index.html for all routes', 'blue');
log('      3. Set up HTTPS certificate', 'blue');
log('      4. Configure caching headers for assets', 'blue');
log('      5. Test the deployed application', 'blue');

log('\n   🔧 Web Server Configuration:', 'magenta');
log('      • Serve index.html for all non-asset routes (SPA routing)', 'blue');
log('      • Set cache headers for assets/ folder', 'blue');
log('      • Enable gzip compression', 'blue');
log('      • Configure security headers', 'blue');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}