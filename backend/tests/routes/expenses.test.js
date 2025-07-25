const request = require('supertest');
const app = require('../../server');
const Expense = require('../../models/Expense');
const path = require('path');
const fs = require('fs');

describe('Expenses Routes', () => {
  let testUser;
  let authHeader;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      username: 'expensetest',
      password: 'testpassword'
    });
    authHeader = testUtils.generateBasicAuthHeader('expensetest', 'testpassword');
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      await testUtils.createTestExpense({
        expenseType: 'Office Supplies',
        amount: 150.00,
        expenseDate: '2024-01-10'
      });

      await testUtils.createTestExpense({
        expenseType: 'Utilities',
        amount: 300.00,
        expenseDate: '2024-01-15'
      });

      await testUtils.createTestExpense({
        expenseType: 'Marketing',
        amount: 75.00,
        expenseDate: '2024-01-20'
      });
    });

    it('should get all expenses for authenticated user', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data[0]).toHaveProperty('expenseId');
      expect(response.body.data[0]).toHaveProperty('expenseType');
      expect(response.body.data[0]).toHaveProperty('amount');
    });

    it('should filter expenses by type', async () => {
      const response = await request(app)
        .get('/api/expenses?expenseType=Office')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(expense => 
        expense.expenseType.toLowerCase().includes('office')
      )).toBe(true);
    });

    it('should filter expenses by date range', async () => {
      const response = await request(app)
        .get('/api/expenses?startDate=2024-01-12&endDate=2024-01-18')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(expense => 
        expense.expenseDate >= '2024-01-12' && expense.expenseDate <= '2024-01-18'
      )).toBe(true);
    });

    it('should filter expenses by amount range', async () => {
      const response = await request(app)
        .get('/api/expenses?minAmount=100&maxAmount=200')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(expense => 
        expense.amount >= 100 && expense.amount <= 200
      )).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=2')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/expenses');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/expenses', () => {
    const validExpenseData = {
      expenseType: 'Test Expense',
      amount: 250.50,
      expenseDate: '2024-01-25'
    };

    it('should create a new expense', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send(validExpenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('expenseId');
      expect(response.body.data.expenseType).toBe(validExpenseData.expenseType);
      expect(response.body.data.amount).toBe(validExpenseData.amount);
      expect(response.body.data.expenseDate).toBe(validExpenseData.expenseDate);
      expect(response.body.data.expenseId).toMatch(/^EXP\d+$/);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate expense type', async () => {
      const invalidData = { ...validExpenseData, expenseType: '' };
      
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate amount', async () => {
      const invalidData = { ...validExpenseData, amount: -10 };
      
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate date format', async () => {
      const invalidData = { ...validExpenseData, expenseDate: 'invalid-date' };
      
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send(validExpenseData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/expenses/:id', () => {
    let testExpense;

    beforeEach(async () => {
      testExpense = await testUtils.createTestExpense({
        expenseType: 'Get Expense Test',
        amount: 125.00,
        expenseDate: '2024-01-30'
      });
    });

    it('should get expense by ID', async () => {
      const response = await request(app)
        .get(`/api/expenses/${testExpense.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testExpense.id);
      expect(response.body.data.expenseType).toBe('Get Expense Test');
      expect(response.body.data.amount).toBe(125.00);
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .get('/api/expenses/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXPENSE_NOT_FOUND');
    });

    it('should validate expense ID format', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid-id')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/expenses/${testExpense.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    let testExpense;

    beforeEach(async () => {
      testExpense = await testUtils.createTestExpense({
        expenseType: 'Update Test',
        amount: 100.00,
        expenseDate: '2024-01-15'
      });
    });

    const updateData = {
      expenseType: 'Updated Expense',
      amount: 200.00,
      expenseDate: '2024-02-01'
    };

    it('should update expense', async () => {
      const response = await request(app)
        .put(`/api/expenses/${testExpense.id}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenseType).toBe(updateData.expenseType);
      expect(response.body.data.amount).toBe(updateData.amount);
      expect(response.body.data.expenseDate).toBe(updateData.expenseDate);
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/99999')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/expenses/${testExpense.id}`)
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/expenses/${testExpense.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/expenses/:id/attachment', () => {
    let testExpense;
    let testFilePath;

    beforeEach(async () => {
      testExpense = await testUtils.createTestExpense({
        expenseType: 'Attachment Test',
        amount: 150.00,
        expenseDate: '2024-01-20'
      });

      // Create a test file
      testFilePath = path.join(__dirname, '../fixtures/test-receipt.txt');
      fs.writeFileSync(testFilePath, 'Test receipt content');
    });

    afterEach(() => {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should upload bill attachment', async () => {
      const response = await request(app)
        .post(`/api/expenses/${testExpense.id}/attachment`)
        .set('Authorization', authHeader)
        .attach('billAttachment', testFilePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billAttachment).toBeDefined();
      expect(response.body.data.billAttachment).toContain('test-receipt');
    });

    it('should validate file size', async () => {
      // Create a large test file (> 5MB)
      const largeFilePath = path.join(__dirname, '../fixtures/large-file.txt');
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      fs.writeFileSync(largeFilePath, largeContent);

      const response = await request(app)
        .post(`/api/expenses/${testExpense.id}/attachment`)
        .set('Authorization', authHeader)
        .attach('billAttachment', largeFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_UPLOAD_ERROR');

      // Clean up
      fs.unlinkSync(largeFilePath);
    });

    it('should validate file type', async () => {
      const invalidFilePath = path.join(__dirname, '../fixtures/test.exe');
      fs.writeFileSync(invalidFilePath, 'executable content');

      const response = await request(app)
        .post(`/api/expenses/${testExpense.id}/attachment`)
        .set('Authorization', authHeader)
        .attach('billAttachment', invalidFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Clean up
      fs.unlinkSync(invalidFilePath);
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .post('/api/expenses/99999/attachment')
        .set('Authorization', authHeader)
        .attach('billAttachment', testFilePath);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/expenses/${testExpense.id}/attachment`)
        .attach('billAttachment', testFilePath);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    let testExpense;

    beforeEach(async () => {
      testExpense = await testUtils.createTestExpense({
        expenseType: 'Delete Test',
        amount: 75.00,
        expenseDate: '2024-01-25'
      });
    });

    it('should delete expense', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${testExpense.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Expense deleted successfully');

      // Verify expense is deleted
      const deletedExpense = await Expense.findById(testExpense.id);
      expect(deletedExpense).toBeNull();
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${testExpense.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/expenses/statistics', () => {
    beforeEach(async () => {
      await testUtils.createTestExpense({
        expenseType: 'Stats Test 1',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await testUtils.createTestExpense({
        expenseType: 'Stats Test 2',
        amount: 200.00,
        expenseDate: '2024-01-15'
      });

      await testUtils.createTestExpense({
        expenseType: 'Stats Test 3',
        amount: 50.00,
        expenseDate: '2024-01-20'
      });
    });

    it('should get expense statistics', async () => {
      const response = await request(app)
        .get('/api/expenses/statistics')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_expenses');
      expect(response.body.data).toHaveProperty('total_amount');
      expect(response.body.data).toHaveProperty('average_expense');
      expect(response.body.data).toHaveProperty('min_expense');
      expect(response.body.data).toHaveProperty('max_expense');

      expect(parseInt(response.body.data.total_expenses)).toBeGreaterThanOrEqual(3);
      expect(parseFloat(response.body.data.total_amount)).toBeGreaterThanOrEqual(350.00);
    });

    it('should filter statistics by date range', async () => {
      const response = await request(app)
        .get('/api/expenses/statistics?startDate=2024-01-12&endDate=2024-01-18')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseInt(response.body.data.total_expenses)).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/expenses/statistics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/expenses/breakdown', () => {
    beforeEach(async () => {
      await testUtils.createTestExpense({
        expenseType: 'Office Supplies',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await testUtils.createTestExpense({
        expenseType: 'Office Supplies',
        amount: 150.00,
        expenseDate: '2024-01-12'
      });

      await testUtils.createTestExpense({
        expenseType: 'Utilities',
        amount: 300.00,
        expenseDate: '2024-01-15'
      });
    });

    it('should get expense type breakdown', async () => {
      const response = await request(app)
        .get('/api/expenses/breakdown')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const officeSupplies = response.body.data.find(item => item.expense_type === 'Office Supplies');
      expect(officeSupplies).toBeDefined();
      expect(parseInt(officeSupplies.expense_count)).toBe(2);
      expect(parseFloat(officeSupplies.total_amount)).toBe(250.00);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/expenses/breakdown');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});