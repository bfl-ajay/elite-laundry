const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const AUTH_CREDENTIALS = Buffer.from('admin:admin123').toString('base64');

const axiosConfig = {
  headers: {
    'Authorization': `Basic ${AUTH_CREDENTIALS}`,
    'Content-Type': 'application/json'
  }
};

// Test data
const testOrder = {
  customerName: 'Test Customer',
  contactNumber: '1234567890',
  orderDate: '2025-01-22',
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
};

async function testOrderEndpoints() {
  console.log('Testing Order Management API Endpoints...\n');
  
  try {
    // Test 1: Create new order
    console.log('Test 1: Creating new order');
    const createResponse = await axios.post(`${BASE_URL}/orders`, testOrder, axiosConfig);
    
    if (createResponse.data.success) {
      console.log('✅ PASS: Order created successfully');
      console.log('   Order Number:', createResponse.data.data.order_number);
      console.log('   Total Amount:', createResponse.data.data.total_amount);
      
      const orderId = createResponse.data.data.id;
      
      // Test 2: Get all orders
      console.log('\nTest 2: Getting all orders');
      const getAllResponse = await axios.get(`${BASE_URL}/orders`, axiosConfig);
      
      if (getAllResponse.data.success && getAllResponse.data.data.length > 0) {
        console.log('✅ PASS: Orders retrieved successfully');
        console.log('   Total orders:', getAllResponse.data.data.length);
      } else {
        console.log('❌ FAIL: Failed to retrieve orders');
      }
      
      // Test 3: Get specific order
      console.log('\nTest 3: Getting specific order');
      const getOrderResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, axiosConfig);
      
      if (getOrderResponse.data.success) {
        console.log('✅ PASS: Order retrieved successfully');
        console.log('   Services count:', getOrderResponse.data.data.services.length);
      } else {
        console.log('❌ FAIL: Failed to retrieve specific order');
      }
      
      // Test 4: Update order status
      console.log('\nTest 4: Updating order status');
      const statusResponse = await axios.patch(`${BASE_URL}/orders/${orderId}/status`, 
        { status: 'Completed' }, axiosConfig);
      
      if (statusResponse.data.success) {
        console.log('✅ PASS: Order status updated successfully');
        console.log('   New status:', statusResponse.data.data.status);
        
        // Test 5: Generate bill
        console.log('\nTest 5: Generating bill for completed order');
        const billResponse = await axios.get(`${BASE_URL}/orders/${orderId}/bill`, axiosConfig);
        
        if (billResponse.data.success) {
          console.log('✅ PASS: Bill generated successfully');
          console.log('   Bill Number:', billResponse.data.data.billNumber);
          console.log('   Total Amount:', billResponse.data.data.totalAmount);
        } else {
          console.log('❌ FAIL: Failed to generate bill');
        }
      } else {
        console.log('❌ FAIL: Failed to update order status');
      }
      
      // Test 6: Update payment status
      console.log('\nTest 6: Updating payment status');
      const paymentResponse = await axios.patch(`${BASE_URL}/orders/${orderId}/payment`, 
        { paymentStatus: 'Paid' }, axiosConfig);
      
      if (paymentResponse.data.success) {
        console.log('✅ PASS: Payment status updated successfully');
        console.log('   Payment Status:', paymentResponse.data.data.payment_status);
      } else {
        console.log('❌ FAIL: Failed to update payment status');
      }
      
      // Test 7: Filter orders by status
      console.log('\nTest 7: Filtering orders by status');
      const filterResponse = await axios.get(`${BASE_URL}/orders?status=Completed`, axiosConfig);
      
      if (filterResponse.data.success) {
        console.log('✅ PASS: Orders filtered successfully');
        console.log('   Completed orders:', filterResponse.data.data.length);
      } else {
        console.log('❌ FAIL: Failed to filter orders');
      }
      
    } else {
      console.log('❌ FAIL: Failed to create order');
      console.log('   Error:', createResponse.data.error);
    }
    
    console.log('\n✅ Order API tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

// Run tests
console.log('Make sure the server is running on port 5000 before running tests...\n');
testOrderEndpoints().then(() => {
  console.log('\nTests finished. Check results above.');
}).catch(error => {
  console.error('Test suite failed:', error);
});