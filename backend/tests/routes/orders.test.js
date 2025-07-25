const request = require('supertest');
const app = require('../../server');
const Order = require('../../models/Order');

describe('Orders Routes', () => {
  let testUser;
  let authHeader;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      username: 'ordertest',
      password: 'testpassword'
    });
    authHeader = testUtils.generateBasicAuthHeader('ordertest', 'testpassword');
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create test orders
      await testUtils.createTestOrder({
        customerName: 'Customer A',
        contactNumber: '1111111111',
        orderDate: '2024-01-10'
      });

      const order2 = await testUtils.createTestOrder({
        customerName: 'Customer B',
        contactNumber: '2222222222',
        orderDate: '2024-01-15'
      });
      await order2.updateStatus('Completed');
    });

    it('should get all orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0]).toHaveProperty('orderNumber');
      expect(response.body.data[0]).toHaveProperty('customerName');
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=Pending')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(order => order.status === 'Pending')).toBe(true);
    });

    it('should filter orders by date range', async () => {
      const response = await request(app)
        .get('/api/orders?startDate=2024-01-12&endDate=2024-01-20')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(order => 
        order.orderDate >= '2024-01-12' && order.orderDate <= '2024-01-20'
      )).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/orders?limit=1')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      customerName: 'John Doe',
      contactNumber: '9876543210',
      orderDate: '2024-01-20',
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 5,
          unitCost: 12.00
        },
        {
          serviceType: 'ironing',
          clothType: 'saari',
          quantity: 3,
          unitCost: 15.00
        }
      ]
    };

    it('should create a new order', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.customerName).toBe(validOrderData.customerName);
      expect(response.body.data.totalAmount).toBe(105.00); // (5*12) + (3*15)
      expect(response.body.data.status).toBe('Pending');
      expect(response.body.data.services).toHaveLength(2);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate customer name', async () => {
      const invalidData = { ...validOrderData, customerName: '' };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate contact number', async () => {
      const invalidData = { ...validOrderData, contactNumber: '123' };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate services array', async () => {
      const invalidData = { ...validOrderData, services: [] };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate service types', async () => {
      const invalidData = {
        ...validOrderData,
        services: [{
          serviceType: 'invalid_service',
          clothType: 'normal',
          quantity: 1,
          unitCost: 10.00
        }]
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate cloth types', async () => {
      const invalidData = {
        ...validOrderData,
        services: [{
          serviceType: 'washing',
          clothType: 'invalid_cloth',
          quantity: 1,
          unitCost: 10.00
        }]
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testUtils.createTestOrder({
        customerName: 'Get Order Test',
        contactNumber: '5555555555'
      });
    });

    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrder.id);
      expect(response.body.data.customerName).toBe('Get Order Test');
      expect(response.body.data.services).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should validate order ID format', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testUtils.createTestOrder({
        customerName: 'Update Test',
        contactNumber: '1111111111'
      });
    });

    const updateData = {
      customerName: 'Updated Customer',
      contactNumber: '9999999999',
      orderDate: '2024-02-01',
      services: [
        {
          serviceType: 'dryclean',
          clothType: 'others',
          quantity: 2,
          unitCost: 25.00
        }
      ]
    };

    it('should update order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(updateData.customerName);
      expect(response.body.data.contactNumber).toBe(updateData.contactNumber);
      expect(response.body.data.totalAmount).toBe(50.00);
      expect(response.body.data.services).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .put('/api/orders/99999')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testUtils.createTestOrder({
        customerName: 'Status Test',
        contactNumber: '2222222222'
      });
    });

    it('should update order status to Completed', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', authHeader)
        .send({ status: 'Completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Completed');
    });

    it('should update order status to Pending', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', authHeader)
        .send({ status: 'Pending' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Pending');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', authHeader)
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require status field', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .patch('/api/orders/99999/status')
        .set('Authorization', authHeader)
        .send({ status: 'Completed' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/status`)
        .send({ status: 'Completed' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/orders/:id/payment', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testUtils.createTestOrder({
        customerName: 'Payment Test',
        contactNumber: '3333333333'
      });
      await testOrder.updateStatus('Completed');
    });

    it('should update payment status to Paid', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/payment`)
        .set('Authorization', authHeader)
        .send({ paymentStatus: 'Paid' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('Paid');
    });

    it('should update payment status to Unpaid', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/payment`)
        .set('Authorization', authHeader)
        .send({ paymentStatus: 'Unpaid' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('Unpaid');
    });

    it('should validate payment status values', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/payment`)
        .set('Authorization', authHeader)
        .send({ paymentStatus: 'InvalidStatus' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder.id}/payment`)
        .send({ paymentStatus: 'Paid' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id/bill', () => {
    let completedOrder;

    beforeEach(async () => {
      completedOrder = await testUtils.createTestOrder({
        customerName: 'Bill Test Customer',
        contactNumber: '4444444444'
      });
      await completedOrder.updateStatus('Completed');
    });

    it('should generate bill for completed order', async () => {
      const response = await request(app)
        .get(`/api/orders/${completedOrder.id}/bill`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('billNumber');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('customerName');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('totalAmount');
      expect(response.body.data.billNumber).toMatch(/^BILL-ORD\d+$/);
    });

    it('should not generate bill for pending order', async () => {
      const pendingOrder = await testUtils.createTestOrder({
        customerName: 'Pending Order',
        contactNumber: '5555555555'
      });

      const response = await request(app)
        .get(`/api/orders/${pendingOrder.id}/bill`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('completed orders');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${completedOrder.id}/bill`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testUtils.createTestOrder({
        customerName: 'Delete Test',
        contactNumber: '6666666666'
      });
    });

    it('should delete order', async () => {
      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order deleted successfully');

      // Verify order is deleted
      const deletedOrder = await Order.findById(testOrder.id);
      expect(deletedOrder).toBeNull();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .delete('/api/orders/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});