const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function migrateToRoles() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration to role-based system...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Add role column to users table if it doesn't exist
    console.log('Adding role column to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'employee' 
      CHECK (role IN ('super_admin', 'admin', 'employee'))
    `);
    
    // 2. Add customer address and rejection fields to orders table
    console.log('Adding new columns to orders table...');
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS customer_address TEXT,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id)
    `);
    
    // 3. Update order status constraint to include 'Rejected'
    console.log('Updating order status constraints...');
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check
    `);
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected'))
    `);
    
    // 4. Add created_by column to expenses table
    console.log('Adding created_by column to expenses table...');
    await client.query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
    `);
    
    // 5. Create business_settings table
    console.log('Creating business_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id SERIAL PRIMARY KEY,
        logo_path VARCHAR(255),
        favicon_path VARCHAR(255),
        business_name VARCHAR(255) DEFAULT 'Laundry Management System',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 6. Create new indexes
    console.log('Creating new indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status_rejected ON orders(status) WHERE status = \'Rejected\'');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by)');
    
    // 7. Update existing admin user to super_admin role
    console.log('Updating existing admin user role...');
    await client.query(`
      UPDATE users 
      SET role = 'super_admin' 
      WHERE username = 'admin' AND role = 'employee'
    `);
    
    // 8. Insert default business settings if not exists
    console.log('Inserting default business settings...');
    const settingsResult = await client.query('SELECT COUNT(*) FROM business_settings');
    if (parseInt(settingsResult.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO business_settings (business_name) 
        VALUES ('Laundry Management System')
      `);
    }
    
    // 9. Create additional default users with proper password hashing
    console.log('Creating additional default users...');
    const saltRounds = 10;
    
    // Create super admin user
    const superAdminPassword = await bcrypt.hash('superadmin123', saltRounds);
    await client.query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('superadmin', $1, 'super_admin')
      ON CONFLICT (username) DO NOTHING
    `, [superAdminPassword]);
    
    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', saltRounds);
    await client.query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('employee', $1, 'employee')
      ON CONFLICT (username) DO NOTHING
    `, [employeePassword]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
    console.log('New features added:');
    console.log('- User roles: super_admin, admin, employee');
    console.log('- Order rejection functionality');
    console.log('- Customer address field');
    console.log('- Business settings table');
    console.log('- Enhanced indexes and constraints');
    console.log('');
    console.log('Default users created:');
    console.log('- superadmin / superadmin123 (Super Admin)');
    console.log('- admin / admin123 (Admin - existing user updated)');
    console.log('- employee / employee123 (Employee)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migrateToRoles()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToRoles;