const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Orders API Search Functionality', () => {
  let authToken;
  let testOrderIds = [];

  beforeAll(async () => {
    // Create test user and get auth token
    authToken = 'Basic ' + Buffer.from('testadmin:Test123').toString('base64');
  });

  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM orders WHERE customer_name LIKE $1', ['Search Test%']);
    testOrderIds = [];

    // Create test orders for search testing
    const testOrders = [
      { customer_name: 'Search Test John Doe', contact_number: '9876543210', status: 'pending' },
      { customer_name: 'Search Test Jane Smith', contact_number: '9876543211', status: 'completed' },
      { customer_name: 'Search Test Bob Johnson', contact_number: '5551234567', status: 'pending' },
      { customer_name: 'Another Customer', contact_number: '9876543210', status: 'completed' }, // Same number as first
    ];

    for (const order of testOrders) {
      const result = await db.query(
        `INSERT INTO orders (customer_name, contact_number, status, payment_status, total_amount, created_at) 
         VALUES ($1, $2, $3, 'unpaid', 100.00, NOW()) RETURNING id`,
        [order.customer_name, order.contact_number, order.status]
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

  describe('GET /api/orders with search parameter', () => {
    it('should search by customer name (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/orders?search=john')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const foundOrder = response.body.data.find(order => 
        order.customer_name.toLowerCase().includes('john')
      );
      expect(foundOrder).toBeDefined();
      expect(foundOrder.customer_name).toBe('Search Test John Doe');
    });

    it('should search by contact number', async () => {
      const response = await request(app)
        .get('/api/orders?search=9876543210')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Two orders with same number
      
      const foundOrders = response.body.data.filter(order => 
        order.contact_number === '9876543210'
      );
      expect(foundOrders.length).toBe(2);
    });

    it('should search by partial contact number', async () => {
      const response = await request(app)
        .get('/api/orders?search=555')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const foundOrder = response.body.data.find(order => 
        order.contact_number.includes('555')
      );
      expect(foundOrder).toBeDefined();
      expect(foundOrder.customer_name).toBe('Search Test Bob Johnson');
    });

    it('should return empty array for non-matching search', async () => {
      const response = await request(app)
        .get('/api/orders?search=nonexistentcustomer')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should combine search with status filter', async () => {
      const response = await request(app)
        .get('/api/orders?search=Search Test&status=pending')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      response.body.data.forEach(order => {
        expect(order.status).toBe('pending');
        expect(order.customer_name).toContain('Search Test');
      });
    });

    it('should handle special characters in search query', async () => {
      // Create order with special characters
      const specialOrder = await db.query(
        `INSERT INTO orders (customer_name, contact_number, status, payment_status, total_amount, created_at) 
         VALUES ($1, $2, 'pending', 'unpaid', 100.00, NOW()) RETURNING id`,
        ['Search Test O\'Connor', '123-456-7890']
      );
      testOrderIds.push(specialOrder.rows[0].id);

      const response = await request(app)
        .get('/api/orders?search=O\'Connor')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const foundOrder = response.body.data.find(order => 
        order.customer_name.includes('O\'Connor')
      );
      expect(foundOrder).toBeDefined();
    });

    it('should handle empty search parameter', async () => {
      const response = await request(app)
        .get('/api/orders?search=')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4); // Should return all orders
    });

    it('should sanitize search input to prevent SQL injection', async () => {
      const maliciousSearch = "'; DROP TABLE orders; --";
      
      const response = await request(app)
        .get(`/api/orders?search=${encodeURIComponent(maliciousSearch)}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return empty results, not cause an error
      expect(response.body.data).toEqual([]);
      
      // Verify table still exists by making another request
      const verifyResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', authToken)
        .expect(200);
      
      expect(verifyResponse.body.success).toBe(true);
    });

    it('should perform case-insensitive search', async () => {
      const testCases = ['JANE', 'jane', 'Jane', 'jAnE'];
      
      for (const searchTerm of testCases) {
        const response = await request(app)
          .get(`/api/orders?search=${searchTerm}`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        
        const foundOrder = response.body.data.find(order => 
          order.customer_name.toLowerCase().includes('jane')
        );
        expect(foundOrder).toBeDefined();
      }
    });
  });

  describe('Search Performance', () => {
    it('should handle large search queries efficiently', async () => {
      const longSearchTerm = 'a'.repeat(1000); // Very long search term
      
      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/orders?search=${longSearchTerm}`)
        .set('Authorization', authToken)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent search requests', async () => {
      const searchPromises = [];
      const searchTerms = ['John', 'Jane', 'Bob', '987', '555'];
      
      for (const term of searchTerms) {
        searchPromises.push(
          request(app)
            .get(`/api/orders?search=${term}`)
            .set('Authorization', authToken)
        );
      }

      const responses = await Promise.all(searchPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});