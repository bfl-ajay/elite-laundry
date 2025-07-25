const request = require('supertest');
const app = require('../../server');
const RoleTestData = require('../fixtures/roleTestData');

describe('End-to-End Role-Based Workflow Tests', () => {
  let testData;

  beforeAll(async () => {
    testData = new RoleTestData();
    await testData.createTestUsers();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('Employee Daily Workflow', () => {
    test('employee can perform daily tasks within role restrictions', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      // 1. Employee can view orders
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(ordersResponse.status).toBe(200);

      // 2. Employee can create a new order
      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          customerName: 'Employee Customer',
          contactNumber: '1234567890',
          customerAddress: '123 Employee St',
          orderDate: '2024-01-25',
          services: [
            {
              serviceType: 'washing',
              clothType: 'normal',
              quantity: 3,
              unitCost: 10.00
            }
          ]
        });

      expect(createOrderResponse.status).toBe(201);
      const orderId = createOrderResponse.body.data.id;

      // 3. Employee can edit the pending order
      const editOrderResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send({
          customerName: 'Updated Employee Customer',
          status: 'In Progress'
        });

      expect(editOrderResponse.status).toBe(200);

      // 4. Employee can create an expense
      const createExpenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          expenseType: 'Employee Expense',
          amount: 50.00,
          expenseDate: '2024-01-25'
        });

      expect(createExpenseResponse.status).toBe(201);
      const expenseId = createExpenseResponse.body.data.id;

      // 5. Employee cannot edit the expense they just created
      const editExpenseResponse = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send({
          amount: 60.00
        });

      expect(editExpenseResponse.status).toBe(403);
      expect(editExpenseResponse.body.error.code).toBe('EXPENSE_EDIT_RESTRICTED');

      // 6. Employee cannot access business settings
      const businessSettingsResponse = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(businessSettingsResponse.status).toBe(403);

      // 7. Employee cannot access user management
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(usersResponse.status).toBe(403);

      // 8. Employee cannot reject orders
      const rejectOrderResponse = await request(app)
        .post(`/api/orders/${orderId}/reject`)
        .set('Authorization', authHeader)
        .send({
          rejectionReason: 'Test rejection'
        });

      expect(rejectOrderResponse.status).toBe(403);

      // Clean up - admin deletes the created items
      const adminHeader = testData.getBasicAuthHeader('admin');
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', adminHeader);
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', adminHeader);
    });
  });

  describe('Admin Management Workflow', () => {
    test('admin can perform management tasks within role restrictions', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      // 1. Admin can view and manage orders
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(ordersResponse.status).toBe(200);

      // 2. Admin can create orders
      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          customerName: 'Admin Customer',
          contactNumber: '2345678901',
          customerAddress: '456 Admin Ave',
          orderDate: '2024-01-25',
          services: [
            {
              serviceType: 'dry_cleaning',
              clothType: 'saari',
              quantity: 2,
              unitCost: 25.00
            }
          ]
        });

      expect(createOrderResponse.status).toBe(201);
      const orderId = createOrderResponse.body.data.id;

      // 3. Admin can edit any order (even completed/paid)
      const editOrderResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send({
          status: 'Completed',
          paymentStatus: 'Paid'
        });

      expect(editOrderResponse.status).toBe(200);

      // 4. Admin can still edit completed/paid orders
      const editCompletedOrderResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send({
          customerName: 'Admin Updated Completed Order'
        });

      expect(editCompletedOrderResponse.status).toBe(200);

      // 5. Admin can reject orders
      const rejectOrderResponse = await request(app)
        .post(`/api/orders/${orderId}/reject`)
        .set('Authorization', authHeader)
        .send({
          rejectionReason: 'Admin rejected for testing'
        });

      expect(rejectOrderResponse.status).toBe(200);
      expect(rejectOrderResponse.body.data.status).toBe('Rejected');

      // 6. Admin can manage expenses
      const createExpenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          expenseType: 'Admin Expense',
          amount: 100.00,
          expenseDate: '2024-01-25'
        });

      expect(createExpenseResponse.status).toBe(201);
      const expenseId = createExpenseResponse.body.data.id;

      // 7. Admin can edit expenses
      const editExpenseResponse = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send({
          amount: 120.00
        });

      expect(editExpenseResponse.status).toBe(200);

      // 8. Admin cannot access business settings
      const businessSettingsResponse = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(businessSettingsResponse.status).toBe(403);

      // 9. Admin cannot access user management
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(usersResponse.status).toBe(403);

      // Clean up
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', authHeader);
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader);
    });
  });

  describe('Super Admin Complete Workflow', () => {
    test('super admin can perform all system operations', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      // 1. Super admin can access business settings
      const businessSettingsResponse = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(businessSettingsResponse.status).toBe(200);

      // 2. Super admin can update business settings
      const updateBusinessResponse = await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send({
          businessName: 'Super Admin Test Business'
        });

      expect(updateBusinessResponse.status).toBe(200);

      // 3. Super admin can manage users
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader);

      expect(usersResponse.status).toBe(200);

      // 4. Super admin can create users
      const createUserResponse = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader)
        .send({
          username: 'superadmin_created',
          password: 'password',
          role: 'admin'
        });

      expect(createUserResponse.status).toBe(201);
      const userId = createUserResponse.body.data.id;

      // 5. Super admin can update user roles
      const updateUserResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', authHeader)
        .send({
          role: 'employee'
        });

      expect(updateUserResponse.status).toBe(200);

      // 6. Super admin can manage orders like admin
      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          customerName: 'Super Admin Customer',
          contactNumber: '3456789012',
          customerAddress: '789 Super Admin Blvd',
          orderDate: '2024-01-25',
          services: [
            {
              serviceType: 'stain_removal',
              clothType: 'normal',
              quantity: 1,
              unitCost: 30.00
            }
          ]
        });

      expect(createOrderResponse.status).toBe(201);
      const orderId = createOrderResponse.body.data.id;

      // 7. Super admin can reject orders
      const rejectOrderResponse = await request(app)
        .post(`/api/orders/${orderId}/reject`)
        .set('Authorization', authHeader)
        .send({
          rejectionReason: 'Super admin test rejection'
        });

      expect(rejectOrderResponse.status).toBe(200);

      // 8. Super admin can manage expenses like admin
      const createExpenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          expenseType: 'Super Admin Expense',
          amount: 200.00,
          expenseDate: '2024-01-25'
        });

      expect(createExpenseResponse.status).toBe(201);
      const expenseId = createExpenseResponse.body.data.id;

      // Clean up
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', authHeader);
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', authHeader);
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader);

      // Restore original business name
      await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send({
          businessName: 'Laundry Management System'
        });
    });
  });

  describe('Cross-Role Interaction Scenarios', () => {
    test('employee creates order, admin manages it, super admin oversees', async () => {
      const employeeHeader = testData.getBasicAuthHeader('employee');
      const adminHeader = testData.getBasicAuthHeader('admin');
      const superAdminHeader = testData.getBasicAuthHeader('superAdmin');

      // 1. Employee creates order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', employeeHeader)
        .send({
          customerName: 'Cross-Role Customer',
          contactNumber: '4567890123',
          customerAddress: '321 Cross-Role St',
          orderDate: '2024-01-25',
          services: [
            {
              serviceType: 'washing',
              clothType: 'normal',
              quantity: 5,
              unitCost: 12.00
            }
          ]
        });

      expect(createResponse.status).toBe(201);
      const orderId = createResponse.body.data.id;

      // 2. Employee can edit while pending
      const employeeEditResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', employeeHeader)
        .send({
          status: 'In Progress'
        });

      expect(employeeEditResponse.status).toBe(200);

      // 3. Admin completes the order
      const adminCompleteResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', adminHeader)
        .send({
          status: 'Completed',
          paymentStatus: 'Paid'
        });

      expect(adminCompleteResponse.status).toBe(200);

      // 4. Employee can no longer edit completed/paid order
      const employeeEditFailResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', employeeHeader)
        .send({
          customerName: 'Employee Cannot Edit This'
        });

      expect(employeeEditFailResponse.status).toBe(403);

      // 5. Admin can still edit completed/paid order
      const adminEditResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', adminHeader)
        .send({
          customerName: 'Admin Can Edit Completed Order'
        });

      expect(adminEditResponse.status).toBe(200);

      // 6. Super admin can also edit and has oversight
      const superAdminEditResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', superAdminHeader)
        .send({
          customerName: 'Super Admin Final Edit'
        });

      expect(superAdminEditResponse.status).toBe(200);

      // Clean up
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', superAdminHeader);
    });

    test('expense creation and management across roles', async () => {
      const employeeHeader = testData.getBasicAuthHeader('employee');
      const adminHeader = testData.getBasicAuthHeader('admin');
      const superAdminHeader = testData.getBasicAuthHeader('superAdmin');

      // 1. Employee creates expense
      const employeeExpenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', employeeHeader)
        .send({
          expenseType: 'Employee Created Expense',
          amount: 75.00,
          expenseDate: '2024-01-25'
        });

      expect(employeeExpenseResponse.status).toBe(201);
      const employeeExpenseId = employeeExpenseResponse.body.data.id;

      // 2. Admin creates expense
      const adminExpenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', adminHeader)
        .send({
          expenseType: 'Admin Created Expense',
          amount: 100.00,
          expenseDate: '2024-01-25'
        });

      expect(adminExpenseResponse.status).toBe(201);
      const adminExpenseId = adminExpenseResponse.body.data.id;

      // 3. Employee cannot edit their own expense
      const employeeEditFailResponse = await request(app)
        .put(`/api/expenses/${employeeExpenseId}`)
        .set('Authorization', employeeHeader)
        .send({
          amount: 80.00
        });

      expect(employeeEditFailResponse.status).toBe(403);

      // 4. Admin can edit employee's expense
      const adminEditEmployeeExpenseResponse = await request(app)
        .put(`/api/expenses/${employeeExpenseId}`)
        .set('Authorization', adminHeader)
        .send({
          amount: 85.00,
          expenseType: 'Admin Edited Employee Expense'
        });

      expect(adminEditEmployeeExpenseResponse.status).toBe(200);

      // 5. Admin can edit their own expense
      const adminEditOwnExpenseResponse = await request(app)
        .put(`/api/expenses/${adminExpenseId}`)
        .set('Authorization', adminHeader)
        .send({
          amount: 110.00
        });

      expect(adminEditOwnExpenseResponse.status).toBe(200);

      // 6. Super admin can edit any expense
      const superAdminEditResponse = await request(app)
        .put(`/api/expenses/${employeeExpenseId}`)
        .set('Authorization', superAdminHeader)
        .send({
          amount: 90.00,
          expenseType: 'Super Admin Final Edit'
        });

      expect(superAdminEditResponse.status).toBe(200);

      // Clean up
      await request(app)
        .delete(`/api/expenses/${employeeExpenseId}`)
        .set('Authorization', superAdminHeader);
      await request(app)
        .delete(`/api/expenses/${adminExpenseId}`)
        .set('Authorization', superAdminHeader);
    });
  });

  describe('Security and Access Control Validation', () => {
    test('role escalation prevention', async () => {
      const employeeHeader = testData.getBasicAuthHeader('employee');

      // Employee cannot access admin-only endpoints
      const adminEndpoints = [
        '/api/orders/1/reject',
        '/api/business-settings',
        '/api/users'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', employeeHeader);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });

    test('authentication requirement enforcement', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/orders' },
        { method: 'post', path: '/api/orders' },
        { method: 'get', path: '/api/expenses' },
        { method: 'post', path: '/api/expenses' },
        { method: 'get', path: '/api/business-settings' },
        { method: 'get', path: '/api/users' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
      }
    });

    test('invalid authentication handling', async () => {
      const invalidHeaders = [
        'Basic invalid_base64',
        'Bearer invalid_token',
        'Basic ' + Buffer.from('invalid:credentials').toString('base64')
      ];

      for (const header of invalidHeaders) {
        const response = await request(app)
          .get('/api/orders')
          .set('Authorization', header);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
      }
    });
  });
});