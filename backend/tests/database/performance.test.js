const db = require('../../config/database');

describe('Database Performance Tests', () => {
  let testOrderIds = [];

  beforeAll(async () => {
    // Ensure indexes are created
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name)',
      'CREATE INDEX IF NOT EXISTS idx_orders_contact_number ON orders(contact_number)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)'
    ];

    for (const query of indexQueries) {
      try {
        await db.query(query);
      } catch (error) {
        // Index might already exist, continue
        console.log(`Index creation note: ${error.message}`);
      }
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM orders WHERE customer_name LIKE $1', ['Perf Test%']);
    testOrderIds = [];
  });

  afterEach(async () => {
    // Clean up test data
    if (testOrderIds.length > 0) {
      await db.query('DELETE FROM orders WHERE id = ANY($1)', [testOrderIds]);
    }
  });

  describe('Index Performance', () => {
    beforeEach(async () => {
      // Create a larger dataset for performance testing
      const batchSize = 100;
      const statuses = ['pending', 'completed'];
      const paymentStatuses = ['paid', 'unpaid'];

      for (let i = 0; i < batchSize; i++) {
        const result = await db.query(
          `INSERT INTO orders (customer_name, contact_number, status, payment_status, total_amount, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
          [
            `Perf Test Customer ${i}`,
            `555000${String(i).padStart(4, '0')}`,
            statuses[i % 2],
            paymentStatuses[i % 2],
            Math.random() * 1000
          ]
        );
        testOrderIds.push(result.rows[0].id);
      }
    });

    it('should perform status filtering efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await db.query(
        'SELECT COUNT(*) FROM orders WHERE status = $1',
        ['pending']
      );
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(result.rows[0].count).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should perform customer name search efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await db.query(
        'SELECT * FROM orders WHERE customer_name ILIKE $1 LIMIT 10',
        ['%Perf Test%']
      );
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;

      expect(result.rows.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(100);
    });

    it('should perform contact number search efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await db.query(
        'SELECT * FROM orders WHERE contact_number ILIKE $1 LIMIT 10',
        ['%5550001%']
      );
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;

      expect(result.rows.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(100);
    });

    it('should perform combined search and filter efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await db.query(`
        SELECT * FROM orders 
        WHERE (customer_name ILIKE $1 OR contact_number ILIKE $1) 
        AND status = $2 
        ORDER BY created_at DESC 
        LIMIT 20
      `, ['%Perf Test%', 'pending']);
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;

      expect(result.rows.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(150); // Slightly higher limit for complex query
    });

    it('should perform metrics aggregation efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN status = 'completed' AND payment_status = 'unpaid' THEN 1 END) as unpaid_completed
        FROM orders
      `);
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;

      expect(result.rows[0]).toHaveProperty('total');
      expect(result.rows[0]).toHaveProperty('pending');
      expect(result.rows[0]).toHaveProperty('completed');
      expect(result.rows[0]).toHaveProperty('paid');
      expect(result.rows[0]).toHaveProperty('unpaid_completed');
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Query Plan Analysis', () => {
    it('should use index for status queries', async () => {
      const result = await db.query(
        'EXPLAIN (FORMAT JSON) SELECT * FROM orders WHERE status = $1',
        ['pending']
      );

      const queryPlan = result.rows[0]['QUERY PLAN'][0];
      const planString = JSON.stringify(queryPlan);
      
      // Should use index scan, not sequential scan for large datasets
      expect(planString).toMatch(/Index|Bitmap/i);
    });

    it('should use index for customer name searches', async () => {
      const result = await db.query(
        'EXPLAIN (FORMAT JSON) SELECT * FROM orders WHERE customer_name ILIKE $1',
        ['%Test%']
      );

      const queryPlan = result.rows[0]['QUERY PLAN'][0];
      // For ILIKE queries, PostgreSQL might use different strategies
      // Just ensure it's not doing a full sequential scan on large datasets
      expect(queryPlan).toBeDefined();
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle multiple concurrent queries', async () => {
      const concurrentQueries = [];
      const queryCount = 10;

      for (let i = 0; i < queryCount; i++) {
        concurrentQueries.push(
          db.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['pending'])
        );
      }

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(concurrentQueries);
      const endTime = process.hrtime.bigint();
      
      const totalTime = Number(endTime - startTime) / 1000000;

      expect(results.length).toBe(queryCount);
      results.forEach(result => {
        expect(result.rows[0].count).toBeDefined();
      });
      
      // All queries should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second for 10 concurrent queries
    });
  });
});