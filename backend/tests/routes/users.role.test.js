const request = require('supertest');
const app = require('../../server');
const RoleTestData = require('../fixtures/roleTestData');

describe('Users API - Role-Based Access Control', () => {
  let testData;

  beforeAll(async () => {
    testData = new RoleTestData();
    await testData.createTestUsers();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('GET /api/users', () => {
    test('should deny employee access to user list', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin access to user list', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin access to user list', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3); // At least our test users
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      username: 'newuser',
      password: 'newpassword',
      role: 'employee'
    };

    test('should deny employee creating users', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send(validUserData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin creating users', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send(validUserData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to create users', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(validUserData.username);
      expect(response.body.data.role).toBe(validUserData.role);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    test('should create user with different roles', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      // Create admin user
      const adminResponse = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'newadmin',
          password: 'adminpassword',
          role: 'admin'
        });

      expect(adminResponse.status).toBe(201);
      expect(adminResponse.body.data.role).toBe('admin');
      expect(adminResponse.body.data.roleDisplayName).toBe('Admin');

      // Create super admin user
      const superAdminResponse = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'newsuperadmin',
          password: 'superadminpassword',
          role: 'super_admin'
        });

      expect(superAdminResponse.status).toBe(201);
      expect(superAdminResponse.body.data.role).toBe('super_admin');
      expect(superAdminResponse.body.data.roleDisplayName).toBe('Super Admin');
    });

    test('should validate required fields', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'incomplete'
          // Missing password and role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should prevent duplicate usernames', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'employee_test', // Already exists
          password: 'password',
          role: 'employee'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('username');
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId;

    beforeAll(async () => {
      // Create a test user to update
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'updatetest',
          password: 'password',
          role: 'employee'
        });
      testUserId = response.body.data.id;
    });

    const updateData = {
      role: 'admin'
    };

    test('should deny employee updating users', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin updating users', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to update users', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(updateData.role);
      expect(response.body.data.roleDisplayName).toBe('Admin');
    });

    test('should validate role values', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', authHeader)
        .send({
          role: 'invalid_role'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('role');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      // Create a test user to delete
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: `deletetest_${Date.now()}`,
          password: 'password',
          role: 'employee'
        });
      testUserId = response.body.data.id;
    });

    test('should deny employee deleting users', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin deleting users', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to delete users', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should deny employee viewing specific user', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const userId = testData.users.admin.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin viewing specific user', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const userId = testData.users.employee.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to view specific user', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const userId = testData.users.employee.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.username).toBe('employee_test');
      expect(response.body.data.role).toBe('employee');
    });
  });

  describe('User Management Workflow', () => {
    test('super admin can perform complete user management workflow', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      // 1. Create a new user
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'workflow_test',
          password: 'password',
          role: 'employee'
        });

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.data.id;

      // 2. Get the user details
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.username).toBe('workflow_test');
      expect(getResponse.body.data.role).toBe('employee');

      // 3. Update the user role
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', authHeader)
        .send({
          role: 'admin'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.role).toBe('admin');

      // 4. Verify the update
      const verifyResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.role).toBe('admin');
      expect(verifyResponse.body.data.roleDisplayName).toBe('Admin');

      // 5. Delete the user
      const deleteResponse = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(deleteResponse.status).toBe(200);

      // 6. Verify deletion
      const deletedResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(deletedResponse.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid user ID', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .get('/api/users/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Basic invalid_credentials');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });

    test('should prevent self-deletion', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const userId = testData.users.superAdmin.id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('self');
    });
  });
});