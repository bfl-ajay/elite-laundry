const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testUserRegistration() {
  console.log('Testing User Registration Endpoint...\n');

  try {
    // Test 1: Create a new user
    console.log('1. Testing user creation...');
    const timestamp = Date.now();
    const newUser = {
      username: `testuser${timestamp}`,
      password: 'TestPassword123'
    };

    const createResponse = await axios.post(`${API_BASE}/auth/register`, newUser);
    console.log('✅ User created successfully:', createResponse.data);
    console.log('Status:', createResponse.status);
    console.log('User ID:', createResponse.data.data.user.id);
    console.log('Username:', createResponse.data.data.user.username);
    console.log();

    // Test 2: Try to create user with same username (should fail)
    console.log('2. Testing duplicate username (should fail)...');
    try {
      await axios.post(`${API_BASE}/auth/register`, newUser);
      console.log('❌ Should have failed with duplicate username');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Correctly rejected duplicate username:', error.response.data.error.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log();

    // Test 3: Test login with new user
    console.log('3. Testing login with new user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: newUser.username,
      password: newUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.data.user.username);
    console.log();

    // Test 4: Test validation errors
    console.log('4. Testing validation errors...');
    
    // Short username
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'ab',
        password: 'TestPassword123'
      });
      console.log('❌ Should have failed with short username');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected short username');
      }
    }

    // Weak password
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'validuser',
        password: 'weak'
      });
      console.log('❌ Should have failed with weak password');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected weak password');
      }
    }

    // Invalid username characters
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'user@invalid',
        password: 'TestPassword123'
      });
      console.log('❌ Should have failed with invalid username characters');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid username characters');
      }
    }

    console.log('\n✅ All user registration tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testUserRegistration();