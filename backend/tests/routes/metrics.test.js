const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Metrics API Endpoints', () => {
  let authToken;
  let testOrderIds = [];

  beforeAll(async () => {
    // Create test user and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: 'Test123'
      });
    
    authToken = 'Basic ' + Buffer.from('testadmin:Test123').toString('base64');
  });

  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM orders WHERE customer_name LIKE $1', ['Test Customer%']);
    testOrderIds = [];

    // Create test orders with different statuses
    const testOrders = [
      { customer_name: 'Test Customer 1', contact_number: '1234567890', status: 'pending', payment_status: 'unpaid' },
      { customer_name: 'Test Customer 2', contact_number: '1234567891', status: 'completed', payment_status: 'unpaid' },
      { customer_name: 'Test Customer 3', contact_number: '1234567892', status: 'completed', payment_status: 'paid' },
      { customer_name: 'Test Customer 4', contact_number: '1234567893', status: 'pending', payment_status: 'unpaid' },
    ];

    for (const order of testOrders) {
      const result = await db.query(
        `INSERT INTO orders (customer_name, contact_number, status, payment_status, total_amount, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
        [order.customer_name, order.contact_number, order.status, order.payment_status, 100.00]
      );
      testOrderIds.push(result.rows[0].id);
    }
  });

  afterEach(async () => {
    // Clean up test data
    if (testOrderIds.length > 0) {
      await db.query('DELETE FROM orders WHERE id = ANY($1)', [testOrderIds]);
    }
  });

  describe('GET /api/orders/metrics', () => {
    it('should return order metrics with correct counts', async () => {
      const response = await request(app)
        .get('/api/orders/metrics')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('paid');
      expect(response.body.data).toHaveProperty('unpaid_completed');

      // Verify counts match our test data
      expect(response.body.data.total).toBeGreaterThanOrEqual(4);
      expect(response.body.data.pending).toBeGreaterThanOrEqual(2);
      expect(response.body.data.completed).toBeGreaterThanOrEqual(2);
      expect(response.body.data.paid).toBeGreaterThanOrEqual(1);
      expect(response.body.data.unpaid_completed).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authentication required');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalQuery = db.query;
      db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/orders/metrics')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Failed to fetch order metrics');

      // Restore original function
      db.query = originalQuery;
    });

    it('should return metrics with zero counts when no orders exist', async () => {
      // Clean all orders
      await db.query('DELETE FROM orders');

      const response = await request(app)
        .get('/api/orders/metrics')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.pending).toBe(0);
      expect(response.body.data.completed).toBe(0);
      expect(response.body.data.paid).toBe(0);
      expect(response.body.data.unpaid_completed).toBe(0);
    });
  });
});