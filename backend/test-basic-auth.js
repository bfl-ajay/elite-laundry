const { basicAuth } = require('./middleware/auth');
const User = require('./models/User');

// Mock request and response objects for testing
function createMockReq(username, password) {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    headers: {
      authorization: `Basic ${credentials}`
    }
  };
}

function createMockRes() {
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    }
  };
  return res;
}

async function testBasicAuth() {
  console.log('Testing Basic Authentication implementation...\n');

  try {
    // Test 1: Valid credentials
    console.log('Test 1: Valid credentials');
    const req1 = createMockReq('admin', 'admin123');
    const res1 = createMockRes();
    let nextCalled = false;

    await basicAuth(req1, res1, () => {
      nextCalled = true;
    });

    if (nextCalled && req1.user) {
      console.log('✅ PASS: Valid credentials accepted');
      console.log('   User:', req1.user.toJSON());
    } else {
      console.log('❌ FAIL: Valid credentials rejected');
      console.log('   Response:', res1.data);
    }

    // Test 2: Invalid credentials
    console.log('\nTest 2: Invalid credentials');
    const req2 = createMockReq('admin', 'wrongpassword');
    const res2 = createMockRes();
    nextCalled = false;

    await basicAuth(req2, res2, () => {
      nextCalled = true;
    });

    if (!nextCalled && res2.statusCode === 401) {
      console.log('✅ PASS: Invalid credentials rejected');
    } else {
      console.log('❌ FAIL: Invalid credentials accepted');
      console.log('   Response:', res2.data);
    }

    // Test 3: Missing authorization header
    console.log('\nTest 3: Missing authorization header');
    const req3 = { headers: {} };
    const res3 = createMockRes();
    nextCalled = false;

    await basicAuth(req3, res3, () => {
      nextCalled = true;
    });

    if (!nextCalled && res3.statusCode === 401) {
      console.log('✅ PASS: Missing auth header rejected');
    } else {
      console.log('❌ FAIL: Missing auth header accepted');
      console.log('   Response:', res3.data);
    }

    console.log('\n✅ Basic Authentication tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run tests
testBasicAuth().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});