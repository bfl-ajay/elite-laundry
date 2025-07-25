const Order = require('./models/Order');

async function testBillGeneration() {
  try {
    console.log('Testing bill generation...');
    
    // Find a completed order
    const orders = await Order.findAll({ status: 'Completed' });
    
    if (orders.length === 0) {
      console.log('No completed orders found. Creating a test order...');
      
      // Create a test order
      const testOrder = await Order.create({
        customerName: 'Test Customer',
        contactNumber: '1234567890',
        orderDate: new Date().toISOString().split('T')[0],
        services: [
          {
            serviceType: 'washing',
            clothType: 'normal',
            quantity: 5,
            unitCost: 10.00
          },
          {
            serviceType: 'ironing',
            clothType: 'saari',
            quantity: 3,
            unitCost: 15.00
          }
        ]
      });
      
      // Update status to completed
      await testOrder.updateStatus('Completed');
      
      console.log('Test order created:', testOrder.orderNumber);
      
      // Generate bill
      const bill = testOrder.generateBill();
      console.log('Generated bill:', JSON.stringify(bill, null, 2));
      
    } else {
      const order = orders[0];
      console.log('Using existing completed order:', order.orderNumber);
      
      // Generate bill
      const bill = order.generateBill();
      console.log('Generated bill:', JSON.stringify(bill, null, 2));
    }
    
    console.log('Bill generation test completed successfully!');
    
  } catch (error) {
    console.error('Error testing bill generation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBillGeneration();