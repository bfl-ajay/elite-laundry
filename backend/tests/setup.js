const pool = require('../config/database');

// Test database setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Create test tables if they don't exist
  await createTestTables();
});

afterAll(async () => {
  // Clean up test data
  await cleanupTestData();
  
  // Close database connection
  await pool.end();
});

beforeEach(async () => {
  // Clean up data before each test
  await cleanupTestData();
});

async function createTestTables() {
  const client = await pool.connect();
  try {
    // Create users table with role support
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'employee')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table with role-based enhancements
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(15) NOT NULL,
        customer_address TEXT,
        order_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
        total_amount DECIMAL(10,2) DEFAULT 0,
        payment_status VARCHAR(20) DEFAULT 'Unpaid',
        rejection_reason TEXT,
        rejected_at TIMESTAMP,
        rejected_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_services (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        service_type VARCHAR(50) NOT NULL,
        cloth_type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(8,2) NOT NULL,
        total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
      )
    `);

    // Create expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        expense_id VARCHAR(20) UNIQUE NOT NULL,
        expense_type VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        bill_attachment VARCHAR(255),
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create business_settings table
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

    // Insert default business settings if not exists
    await client.query(`
      INSERT INTO business_settings (business_name)
      SELECT 'Laundry Management System'
      WHERE NOT EXISTS (SELECT 1 FROM business_settings)
    `);
  } finally {
    client.release();
  }
}

async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM order_services');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM expenses');
    await client.query('DELETE FROM users');
    // Reset business_settings to default
    await client.query('DELETE FROM business_settings');
    await client.query(`INSERT INTO business_settings (business_name) VALUES ('Laundry Management System')`);
  } finally {
    client.release();
  }
}

// Test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultData = {
      username: 'testuser',
      password: 'testpassword'
    };
    return await User.create({ ...defaultData, ...userData });
  },

  createTestOrder: async (orderData = {}) => {
    const Order = require('../models/Order');
    const defaultData = {
      customerName: 'Test Customer',
      contactNumber: '1234567890',
      orderDate: '2024-01-01',
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 5,
          unitCost: 10.00
        }
      ]
    };
    return await Order.create({ ...defaultData, ...orderData });
  },

  createTestExpense: async (expenseData = {}) => {
    const Expense = require('../models/Expense');
    const defaultData = {
      expenseType: 'Test Expense',
      amount: 100.00,
      expenseDate: '2024-01-01'
    };
    return await Expense.create({ ...defaultData, ...expenseData });
  },

  generateBasicAuthHeader: (username, password) => {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
  }
};