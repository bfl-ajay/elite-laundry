const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test basic connection
    const response = await axios.get('http://localhost:5000/api/auth/status', {
      withCredentials: true
    });
    
    console.log('API Status:', response.data);
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('Login Response:', loginResponse.data);
    
    // Test orders endpoint
    const ordersResponse = await axios.get('http://localhost:5000/api/orders', {
      withCredentials: true,
      headers: {
        'Authorization': `Basic ${Buffer.from('admin:admin123').toString('base64')}`
      }
    });
    
    console.log('Orders Response:', ordersResponse.data);
    
  } catch (error) {
    console.error('API Test Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testAPI();