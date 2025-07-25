const pool = require('./config/database');

async function createTestOrder() {
  try {
    console.log('Creating test order...');
    
    // Generate order number
    const orderNumber = `ORD${Date.now()}`;
    
    // Insert order
    const orderResult = await pool.query(`
      INSERT INTO orders (order_number, customer_name, contact_number, order_date, total_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderNumber, 'John Doe', '+1234567890', '2024-01-15', 25.00]);
    
    const orderId = orderResult.rows[0].id;
    console.log('Created order:', orderResult.rows[0]);
    
    // Insert services
    await pool.query(`
      INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
      VALUES ($1, $2, $3, $4, $5)
    `, [orderId, 'washing', 'normal', 5, 5.00]);
    
    console.log('Test order created successfully!');
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    process.exit(0);
  }
}

createTestOrder();