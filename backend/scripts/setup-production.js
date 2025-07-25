#!/usr/bin/env node

/**
 * Production Setup Script
 * Automates the setup of production environment with security configurations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class ProductionSetup {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.templatePath = path.join(__dirname, '../..', '.env.production.template');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecurePassword(length = 24) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async setupEnvironment() {
    this.log('Setting up production environment configuration...');

    // Check if .env already exists
    if (fs.existsSync(this.envPath)) {
      this.log('Production .env file already exists. Creating backup...', 'warning');
      const backupPath = `${this.envPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.envPath, backupPath);
      this.log(`Backup created: ${backupPath}`);
    }

    // Read template
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template file not found: ${this.templatePath}`);
    }

    let envContent = fs.readFileSync(this.templatePath, 'utf8');

    // Generate secure values
    const sessionSecret = this.generateSecureSecret(64);
    const dbPassword = this.generateSecurePassword(32);

    // Replace template values with secure generated ones
    envContent = envContent.replace(
      'your-super-secure-session-secret-here',
      sessionSecret
    );

    // Only replace if it's still the template value
    if (envContent.includes('your-secure-database-password-here')) {
      envContent = envContent.replace(
        'your-secure-database-password-here',
        dbPassword
      );
      this.log('Generated secure database password');
    }

    // Write the environment file
    fs.writeFileSync(this.envPath, envContent);
    this.log('Production environment file created', 'success');

    // Set secure file permissions
    try {
      fs.chmodSync(this.envPath, 0o600); // Read/write for owner only
      this.log('Set secure file permissions on .env file');
    } catch (error) {
      this.log('Could not set file permissions (Windows?)', 'warning');
    }

    return {
      sessionSecret,
      dbPassword: envContent.includes('your-secure-database-password-here') ? null : dbPassword
    };
  }

  setupUploadsDirectory() {
    this.log('Setting up uploads directory...');
    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      this.log('Created uploads directory', 'success');
    } else {
      this.log('Uploads directory already exists');
    }

    // Set secure permissions
    try {
      fs.chmodSync(uploadsDir, 0o755); // rwxr-xr-x
      this.log('Set secure permissions on uploads directory');
    } catch (error) {
      this.log('Could not set directory permissions (Windows?)', 'warning');
    }

    // Create .gitkeep file
    const gitkeepPath = path.join(uploadsDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
      this.log('Created .gitkeep in uploads directory');
    }
  }

  installProductionDependencies() {
    this.log('Installing production dependencies...');
    
    try {
      execSync('npm ci --only=production', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit' 
      });
      this.log('Production dependencies installed', 'success');
    } catch (error) {
      this.log('Failed to install dependencies', 'error');
      throw error;
    }
  }

  runSecurityAudit() {
    this.log('Running security audit...');
    
    try {
      execSync('npm audit --audit-level=high', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit' 
      });
      this.log('Security audit passed', 'success');
    } catch (error) {
      this.log('Security audit found issues - please review', 'warning');
      // Don't throw error as audit might fail due to dev dependencies
    }
  }

  async testDatabaseConnection() {
    this.log('Testing database connection...');
    
    try {
      // Load the new environment
      require('dotenv').config({ path: this.envPath });
      
      const pool = require('../config/database');
      const result = await pool.query('SELECT NOW()');
      this.log('Database connection successful', 'success');
      
      // Test SSL if enabled
      if (process.env.DB_SSL === 'true') {
        try {
          const sslResult = await pool.query('SHOW ssl');
          if (sslResult.rows[0].ssl === 'on') {
            this.log('Database SSL connection verified', 'success');
          }
        } catch (sslError) {
          this.log('Could not verify SSL status', 'warning');
        }
      }
      
      await pool.end();
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  createProductionChecklist() {
    const checklistPath = path.join(__dirname, '..', 'PRODUCTION_CHECKLIST.md');
    const checklist = `# Production Deployment Checklist

## Pre-Deployment
- [ ] Update domain names in .env file
- [ ] Configure SSL certificates
- [ ] Set up production database
- [ ] Configure DNS records
- [ ] Set up monitoring and logging

## Security Configuration
- [ ] Review and update CORS origins
- [ ] Verify rate limiting settings
- [ ] Check file upload restrictions
- [ ] Validate security headers
- [ ] Test HTTPS enforcement

## Database Setup
- [ ] Create production database
- [ ] Run database migrations
- [ ] Set up database backups
- [ ] Configure SSL connection
- [ ] Test connection pooling

## Infrastructure
- [ ] Configure reverse proxy (nginx)
- [ ] Set up load balancer (if needed)
- [ ] Configure firewall rules
- [ ] Set up health checks
- [ ] Configure log rotation

## Monitoring
- [ ] Set up application monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure alerts
- [ ] Test backup procedures

## Final Steps
- [ ] Run production validation script
- [ ] Perform security scan
- [ ] Test all critical user flows
- [ ] Verify backup and recovery procedures
- [ ] Document deployment process

## Generated Configuration
- Session secret: ✅ Generated
- Database password: ${fs.readFileSync(this.envPath, 'utf8').includes('your-secure-database-password-here') ? '⚠️ Update required' : '✅ Generated'}
- Environment file: ✅ Created
- Uploads directory: ✅ Created
- Dependencies: ✅ Installed

## Next Steps
1. Update domain names in .env file
2. Configure your production database
3. Set up SSL certificates
4. Run: \`npm run validate:production\`
5. Deploy to production environment

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(checklistPath, checklist);
    this.log('Production checklist created', 'success');
  }

  async run() {
    console.log('🚀 Production Setup for Laundry Management System\n');
    console.log('================================================\n');

    try {
      const secrets = await this.setupEnvironment();
      this.setupUploadsDirectory();
      this.installProductionDependencies();
      this.runSecurityAudit();
      await this.testDatabaseConnection();
      this.createProductionChecklist();

      console.log('\n🎉 Production setup completed successfully!\n');
      console.log('📋 Next steps:');
      console.log('1. Update domain names in .env file');
      console.log('2. Configure your production database');
      console.log('3. Set up SSL certificates');
      console.log('4. Run: npm run validate:production');
      console.log('5. Deploy to production environment\n');
      
      console.log('📄 Check PRODUCTION_CHECKLIST.md for detailed deployment steps');

      if (secrets.dbPassword) {
        console.log('\n🔐 IMPORTANT: Generated database password:');
        console.log(`   ${secrets.dbPassword}`);
        console.log('   Save this password securely and update your database configuration!');
      }

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ProductionSetup();
  setup.run();
}

module.exports = ProductionSetup;