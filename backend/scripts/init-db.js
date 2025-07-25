const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('Database schema initialized successfully!');
    console.log('Tables created: users, orders, order_services, expenses');
    
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0].now);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;