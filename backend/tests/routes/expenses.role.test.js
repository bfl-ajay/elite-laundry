const request = require('supertest');
const app = require('../../server');
const RoleTestData = require('../fixtures/roleTestData');

describe('Expenses API - Role-Based Access Control', () => {
  let testData;

  beforeAll(async () => {
    testData = new RoleTestData();
    await testData.createTestUsers();
    await testData.createTestExpenses();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('GET /api/expenses', () => {
    test('should allow employee to view expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should allow admin to view expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should allow super admin to view expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/expenses');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /api/expenses', () => {
    const validExpenseData = {
      expenseType: 'Test Expense',
      amount: 100.00,
      expenseDate: '2024-01-20'
    };

    test('should allow employee to create expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send(validExpenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe(validExpenseData.expenseType);
      expect(response.body.data.amount).toBe(validExpenseData.amount);
    });

    test('should allow admin to create expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          ...validExpenseData,
          expenseType: 'Admin Created Expense'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe('Admin Created Expense');
    });

    test('should allow super admin to create expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          ...validExpenseData,
          expenseType: 'Super Admin Created Expense'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe('Super Admin Created Expense');
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(validExpenseData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('PUT /api/expenses/:id', () => {
    const updateData = {
      expenseType: 'Updated Expense Type',
      amount: 150.00
    };

    test('should deny employee editing expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const expenseId = testData.expenses.utilities.id;

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXPENSE_EDIT_RESTRICTED');
    });

    test('should allow admin to edit expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const expenseId = testData.expenses.supplies.id;

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe(updateData.expenseType);
      expect(response.body.data.amount).toBe(updateData.amount);
    });

    test('should allow super admin to edit expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const expenseId = testData.expenses.maintenance.id;

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send({
          ...updateData,
          expenseType: 'Super Admin Updated Expense'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe('Super Admin Updated Expense');
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    test('should deny employee deleting expenses', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const expenseId = testData.expenses.utilities.id;

      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow admin to delete expenses', async () => {
      // Create a new expense for admin to delete
      const Expense = require('../../models/Expense');
      const newExpense = await Expense.create({
        expenseType: 'To Be Deleted',
        amount: 50.00,
        expenseDate: '2024-01-22'
      });

      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .delete(`/api/expenses/${newExpense.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should allow super admin to delete expenses', async () => {
      // Create a new expense for super admin to delete
      const Expense = require('../../models/Expense');
      const newExpense = await Expense.create({
        expenseType: 'To Be Deleted by Super Admin',
        amount: 75.00,
        expenseDate: '2024-01-23'
      });

      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .delete(`/api/expenses/${newExpense.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Role-Based Expense Management Scenarios', () => {
    test('employee can create but not edit their own expense', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      
      // Create expense as employee
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          expenseType: 'Employee Created Expense',
          amount: 25.00,
          expenseDate: '2024-01-24'
        });

      expect(createResponse.status).toBe(201);
      const expenseId = createResponse.body.data.id;

      // Try to edit the same expense as employee
      const editResponse = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', authHeader)
        .send({
          expenseType: 'Employee Trying to Edit',
          amount: 30.00
        });

      expect(editResponse.status).toBe(403);
      expect(editResponse.body.error.code).toBe('EXPENSE_EDIT_RESTRICTED');

      // Clean up
      const adminHeader = testData.getBasicAuthHeader('admin');
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', adminHeader);
    });

    test('admin can edit employee-created expense', async () => {
      const employeeHeader = testData.getBasicAuthHeader('employee');
      const adminHeader = testData.getBasicAuthHeader('admin');
      
      // Create expense as employee
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', employeeHeader)
        .send({
          expenseType: 'Employee Created for Admin Edit',
          amount: 40.00,
          expenseDate: '2024-01-25'
        });

      expect(createResponse.status).toBe(201);
      const expenseId = createResponse.body.data.id;

      // Edit the expense as admin
      const editResponse = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', adminHeader)
        .send({
          expenseType: 'Admin Edited Employee Expense',
          amount: 45.00
        });

      expect(editResponse.status).toBe(200);
      expect(editResponse.body.data.expenseType).toBe('Admin Edited Employee Expense');
      expect(editResponse.body.data.amount).toBe(45.00);

      // Clean up
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', adminHeader);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid expense ID', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/expenses/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle malformed request data', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({
          // Missing required fields
          expenseType: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', 'Basic invalid_credentials');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });
  });
});