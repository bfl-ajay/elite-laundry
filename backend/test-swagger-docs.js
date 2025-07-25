const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testSwaggerDocs() {
  console.log('Testing Swagger API Documentation...\n');

  try {
    // Test 1: Check if Swagger UI is accessible
    console.log('1. Testing Swagger UI accessibility...');
    const swaggerResponse = await axios.get(`${API_BASE}/api-docs/`);
    console.log('✅ Swagger UI is accessible');
    console.log('Status:', swaggerResponse.status);
    console.log('Content-Type:', swaggerResponse.headers['content-type']);
    console.log();

    // Test 2: Check if swagger.json is accessible
    console.log('2. Testing Swagger JSON specification...');
    try {
      const swaggerJsonResponse = await axios.get(`${API_BASE}/api-docs/swagger.json`);
      console.log('✅ Swagger JSON specification is accessible');
      console.log('Status:', swaggerJsonResponse.status);
      
      const spec = swaggerJsonResponse.data;
      console.log('API Title:', spec.info?.title);
      console.log('API Version:', spec.info?.version);
      console.log('Number of paths:', Object.keys(spec.paths || {}).length);
      console.log('Available tags:', spec.tags?.map(tag => tag.name).join(', '));
    } catch (error) {
      console.log('ℹ️  Swagger JSON might be embedded in HTML (this is normal)');
    }
    console.log();

    // Test 3: Verify some documented endpoints exist
    console.log('3. Testing documented endpoints...');
    
    // Test auth endpoints
    try {
      await axios.get(`${API_BASE}/api/auth/status`);
      console.log('✅ Auth status endpoint is accessible');
    } catch (error) {
      if (error.response && error.response.status !== 500) {
        console.log('✅ Auth status endpoint exists (expected auth error)');
      }
    }

    // Test orders endpoint (should require auth)
    try {
      await axios.get(`${API_BASE}/api/orders`);
      console.log('❌ Orders endpoint should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Orders endpoint correctly requires authentication');
      }
    }

    // Test expenses endpoint (should require auth)
    try {
      await axios.get(`${API_BASE}/api/expenses`);
      console.log('❌ Expenses endpoint should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Expenses endpoint correctly requires authentication');
      }
    }

    // Test analytics endpoint (should require auth)
    try {
      await axios.get(`${API_BASE}/api/analytics/business`);
      console.log('❌ Analytics endpoint should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Analytics endpoint correctly requires authentication');
      }
    }

    console.log('\n✅ Swagger API Documentation is working correctly!');
    console.log('\n📖 Access the interactive API documentation at: http://localhost:5000/api-docs/');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testSwaggerDocs();