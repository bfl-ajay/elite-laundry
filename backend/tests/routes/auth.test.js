const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Authentication Routes', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      username: 'authtest',
      password: 'testpassword'
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.username).toBe('authtest');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'testpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: 'testpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle logout without session', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return authenticated status for logged in user', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Check status
      const response = await request(app)
        .get('/api/auth/status')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(true);
      expect(response.body.data.user.username).toBe('authtest');
    });

    it('should return unauthenticated status for non-logged in user', async () => {
      const response = await request(app)
        .get('/api/auth/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(false);
      expect(response.body.data.user).toBeNull();
    });

    it('should work with Basic Auth header', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('authtest', 'testpassword');

      const response = await request(app)
        .get('/api/auth/status')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(true);
      expect(response.body.data.user.username).toBe('authtest');
    });

    it('should reject invalid Basic Auth credentials', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('authtest', 'wrongpassword');

      const response = await request(app)
        .get('/api/auth/status')
        .set('Authorization', authHeader);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Authentication Middleware', () => {
    it('should protect routes requiring authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow access with valid session', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Access protected route
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow access with valid Basic Auth', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('authtest', 'testpassword');

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid Basic Auth format', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Basic invalid-base64');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed Basic Auth header', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Make multiple requests with same session
      const response1 = await request(app)
        .get('/api/auth/status')
        .set('Cookie', cookies);

      const response2 = await request(app)
        .get('/api/orders')
        .set('Cookie', cookies);

      expect(response1.status).toBe(200);
      expect(response1.body.data.authenticated).toBe(true);
      expect(response2.status).toBe(200);
    });

    it('should clear session on logout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'authtest',
          password: 'testpassword'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      // Try to access protected route with old session
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', cookies);

      expect(response.status).toBe(401);
    });
  });
});