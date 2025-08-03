const db = require('../config/database');

// Global test setup
beforeAll(async () => {
  // Ensure test database is ready
  try {
    await db.query('SELECT 1');
    console.log('✅ Database connection established for testing');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Create test user if it doesn't exist
  try {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test123', 10);
    
    await db.query(`
      INSERT INTO users (username, password, role) 
      VALUES ('testadmin', $1, 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);
    
    console.log('✅ Test user ensured');
  } catch (error) {
    console.log('Note: Test user setup:', error.message);
  }
});

// Global test teardown
afterAll(async () => {
  // Close database connections
  if (db && db.end) {
    await db.end();
  }
  console.log('✅ Database connections closed');
});

// Increase timeout for database operations
jest.setTimeout(30000);