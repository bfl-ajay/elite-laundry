const request = require('supertest');
const app = require('../../server');

describe('Analytics Routes', () => {
  let testUser;
  let authHeader;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      username: 'analyticstest',
      password: 'testpassword'
    });
    authHeader = testUtils.generateBasicAuthHeader('analyticstest', 'testpassword');

    // Create test data for analytics
    const order1 = await testUtils.createTestOrder({
      customerName: 'Analytics Customer 1',
      contactNumber: '1111111111',
      orderDate: '2024-01-10',
      services: [{ serviceType: 'washing', clothType: 'normal', quantity: 5, unitCost: 20.00 }]
    });
    await order1.updateStatus('Completed');

    const order2 = await testUtils.createTestOrder({
      customerName: 'Analytics Customer 2',
      contactNumber: '2222222222',
      orderDate: '2024-01-15',
      services: [{ serviceType: 'ironing', clothType: 'saari', quantity: 3, unitCost: 25.00 }]
    });
    await order2.updateStatus('Completed');

    await testUtils.createTestOrder({
      customerName: 'Analytics Customer 3',
      contactNumber: '3333333333',
      orderDate: '2024-01-20',
      services: [{ serviceType: 'dryclean', clothType: 'others', quantity: 2, unitCost: 30.00 }]
    });

    // Create test expenses
    await testUtils.createTestExpense({
      expenseType: 'Office Supplies',
      amount: 150.00,
      expenseDate: '2024-01-12'
    });

    await testUtils.createTestExpense({
      expenseType: 'Utilities',
      amount: 300.00,
      expenseDate: '2024-01-18'
    });
  });

  describe('GET /api/analytics/business', () => {
    it('should get business analytics without period filter', async () => {
      const response = await request(app)
        .get('/api/analytics/business')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('completedOrders');
      expect(response.body.data).toHaveProperty('pendingOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('averageOrderValue');

      expect(parseInt(response.body.data.totalOrders)).toBeGreaterThanOrEqual(3);
      expect(parseInt(response.body.data.completedOrders)).toBeGreaterThanOrEqual(2);
      expect(parseInt(response.body.data.pendingOrders)).toBeGreaterThanOrEqual(1);
      expect(parseFloat(response.body.data.totalRevenue)).toBeGreaterThanOrEqual(175.00); // 100 + 75
    });

    it('should get daily business analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/business?period=daily')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'daily');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    it('should get weekly business analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/business?period=weekly')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'weekly');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    it('should get monthly business analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/business?period=monthly')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'monthly');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    it('should filter business analytics by date range', async () => {
      const response = await request(app)
        .get('/api/analytics/business?startDate=2024-01-12&endDate=2024-01-18')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dateRange');
      expect(response.body.data.dateRange).toEqual({
        startDate: '2024-01-12',
        endDate: '2024-01-18'
      });
    });

    it('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/business?period=invalid')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/analytics/business?startDate=invalid-date')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/business');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/expenses', () => {
    it('should get expense analytics without period filter', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('totalAmount');
      expect(response.body.data).toHaveProperty('averageExpense');
      expect(response.body.data).toHaveProperty('minExpense');
      expect(response.body.data).toHaveProperty('maxExpense');

      expect(parseInt(response.body.data.totalExpenses)).toBeGreaterThanOrEqual(2);
      expect(parseFloat(response.body.data.totalAmount)).toBeGreaterThanOrEqual(450.00); // 150 + 300
    });

    it('should get daily expense analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses?period=daily')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'daily');
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('totalAmount');
    });

    it('should get weekly expense analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses?period=weekly')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'weekly');
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('totalAmount');
    });

    it('should get monthly expense analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses?period=monthly')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 'monthly');
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('totalAmount');
    });

    it('should filter expense analytics by date range', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses?startDate=2024-01-15&endDate=2024-01-20')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dateRange');
      expect(response.body.data.dateRange).toEqual({
        startDate: '2024-01-15',
        endDate: '2024-01-20'
      });
    });

    it('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses?period=invalid')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/expenses');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should get business trends', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businessTrends');
      expect(response.body.data).toHaveProperty('expenseTrends');
      expect(Array.isArray(response.body.data.businessTrends)).toBe(true);
      expect(Array.isArray(response.body.data.expenseTrends)).toBe(true);
    });

    it('should filter trends by date range', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dateRange');
    });

    it('should limit trend results', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?limit=5')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.businessTrends.length).toBeLessThanOrEqual(5);
      expect(response.body.data.expenseTrends.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/trends');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('business');
      expect(response.body.data).toHaveProperty('expenses');
      expect(response.body.data).toHaveProperty('profitLoss');

      expect(response.body.data.business).toHaveProperty('totalOrders');
      expect(response.body.data.business).toHaveProperty('totalRevenue');
      expect(response.body.data.expenses).toHaveProperty('totalExpenses');
      expect(response.body.data.expenses).toHaveProperty('totalAmount');
      expect(response.body.data.profitLoss).toHaveProperty('grossProfit');
      expect(response.body.data.profitLoss).toHaveProperty('netProfit');
    });

    it('should calculate profit/loss correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      const { business, expenses, profitLoss } = response.body.data;

      const expectedGrossProfit = parseFloat(business.totalRevenue);
      const expectedNetProfit = parseFloat(business.totalRevenue) - parseFloat(expenses.totalAmount);

      expect(parseFloat(profitLoss.grossProfit)).toBe(expectedGrossProfit);
      expect(parseFloat(profitLoss.netProfit)).toBe(expectedNetProfit);
    });

    it('should filter summary by date range', async () => {
      const response = await request(app)
        .get('/api/analytics/summary?startDate=2024-01-10&endDate=2024-01-20')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dateRange');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/summary');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Analytics Data Consistency', () => {
    it('should have consistent data across different endpoints', async () => {
      // Get business analytics
      const businessResponse = await request(app)
        .get('/api/analytics/business')
        .set('Authorization', authHeader);

      // Get expense analytics
      const expenseResponse = await request(app)
        .get('/api/analytics/expenses')
        .set('Authorization', authHeader);

      // Get summary
      const summaryResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', authHeader);

      expect(businessResponse.status).toBe(200);
      expect(expenseResponse.status).toBe(200);
      expect(summaryResponse.status).toBe(200);

      // Check data consistency
      const businessData = businessResponse.body.data;
      const expenseData = expenseResponse.body.data;
      const summaryData = summaryResponse.body.data;

      expect(summaryData.business.totalOrders).toBe(businessData.totalOrders);
      expect(summaryData.business.totalRevenue).toBe(businessData.totalRevenue);
      expect(summaryData.expenses.totalExpenses).toBe(expenseData.totalExpenses);
      expect(summaryData.expenses.totalAmount).toBe(expenseData.totalAmount);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we'll test with invalid parameters
      const response = await request(app)
        .get('/api/analytics/business?startDate=2024-13-01') // Invalid month
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle empty result sets', async () => {
      // Query for a date range with no data
      const response = await request(app)
        .get('/api/analytics/business?startDate=2025-01-01&endDate=2025-01-31')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseInt(response.body.data.totalOrders)).toBe(0);
      expect(parseFloat(response.body.data.totalRevenue)).toBe(0);
    });
  });
});