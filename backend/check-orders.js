const pool = require('./config/database');

async function checkOrders() {
  try {
    console.log('Checking existing orders...');
    
    const result = await pool.query(`
      SELECT o.id, o.order_number, o.customer_name, o.created_by, u.username as created_by_username, o.created_at
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    console.log('Recent orders:');
    result.rows.forEach(order => {
      console.log(`- Order ${order.order_number}: created_by=${order.created_by}, username=${order.created_by_username || 'NULL'}`);
    });
    
    // Also check users table
    const users = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    console.log('\nAvailable users:');
    users.rows.forEach(user => {
      console.log(`- User ${user.id}: ${user.username} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrders();