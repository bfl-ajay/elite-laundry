const { User } = require('../models/User');
const pool = require('../config/database');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Create admin user with password 'admin123'
    const user = await User.create({
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Test user created successfully:', user.toJSON());
    
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      console.log('Test user already exists');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUser();
}

module.exports = createTestUser;