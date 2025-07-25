const request = require('supertest');
const app = require('../../server');
const RoleTestData = require('../fixtures/roleTestData');

describe('Orders API - Role-Based Access Control', () => {
  let testData;

  beforeAll(async () => {
    testData = new RoleTestData();
    await testData.createTestUsers();
    await testData.createTestOrders();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('GET /api/orders', () => {
    test('should allow employee to view orders', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should allow admin to view orders', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should allow super admin to view orders', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      customerName: 'Test Customer',
      contactNumber: '1234567890',
      customerAddress: '123 Test St',
      orderDate: '2024-01-20',
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 5,
          unitCost: 10.00
        }
      ]
    };

    test('should allow employee to create orders', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(validOrderData.customerName);
    });

    test('should allow admin to create orders', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          ...validOrderData,
          customerName: 'Admin Created Order'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe('Admin Created Order');
    });

    test('should allow super admin to create orders', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          ...validOrderData,
          customerName: 'Super Admin Created Order'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe('Super Admin Created Order');
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('PUT /api/orders/:id', () => {
    const updateData = {
      customerName: 'Updated Customer Name',
      status: 'In Progress'
    };

    test('should allow employee to edit pending unpaid order', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const orderId = testData.orders.pendingUnpaid.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(updateData.customerName);
    });

    test('should deny employee editing completed order', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const orderId = testData.orders.completedUnpaid.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_EDIT_RESTRICTED');
    });

    test('should deny employee editing paid order', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const orderId = testData.orders.pendingPaid.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_EDIT_RESTRICTED');
    });

    test('should allow admin to edit any order', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const orderId = testData.orders.completedPaid.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(updateData.customerName);
    });

    test('should allow super admin to edit any order', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const orderId = testData.orders.completedPaid.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', authHeader)
        .send({
          ...updateData,
          customerName: 'Super Admin Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe('Super Admin Updated');
    });
  });

  describe('POST /api/orders/:id/reject', () => {
    const rejectionData = {
      rejectionReason: 'Test rejection reason'
    };

    test('should deny employee rejecting orders', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const orderId = testData.orders.pendingUnpaid.id;

      const response = await request(app)
        .post(`/api/orders/${orderId}/reject`)
        .set('Authorization', authHeader)
        .send(rejectionData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow admin to reject orders', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const orderId = testData.orders.inProgressUnpaid.id;

      const response = await request(app)
        .post(`/api/orders/${orderId}/reject`)
        .set('Authorization', authHeader)
        .send(rejectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Rejected');
      expect(response.body.data.rejectionReason).toBe(rejectionData.rejectionReason);
    });

    test('should allow super admin to reject orders', async () => {
      // Create a new order for super admin to reject
      const Order = require('../../models/Order');
      const newOrder = await Order.create({
        customerName: 'To Be Rejected',
        contactNumber: '1111111111',
        customerAddress: '123 Reject St',
        orderDate: '2024-01-21',
        services: [
          {
            serviceType: 'washing',
            clothType: 'normal',
            quantity: 1,
            unitCost: 10.00
          }
        ]
      });

      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post(`/api/orders/${newOrder.id}/reject`)
        .set('Authorization', authHeader)
        .send(rejectionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Rejected');
      expect(response.body.data.rejectionReason).toBe(rejectionData.rejectionReason);

      // Clean up
      await newOrder.delete();
    });
  });

  describe('DELETE /api/orders/:id', () => {
    test('should deny employee deleting orders', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const orderId = testData.orders.pendingUnpaid.id;

      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow admin to delete orders', async () => {
      // Create a new order for admin to delete
      const Order = require('../../models/Order');
      const newOrder = await Order.create({
        customerName: 'To Be Deleted',
        contactNumber: '2222222222',
        customerAddress: '123 Delete St',
        orderDate: '2024-01-22',
        services: [
          {
            serviceType: 'washing',
            clothType: 'normal',
            quantity: 1,
            unitCost: 10.00
          }
        ]
      });

      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .delete(`/api/orders/${newOrder.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should allow super admin to delete orders', async () => {
      // Create a new order for super admin to delete
      const Order = require('../../models/Order');
      const newOrder = await Order.create({
        customerName: 'To Be Deleted by Super Admin',
        contactNumber: '3333333333',
        customerAddress: '123 Super Delete St',
        orderDate: '2024-01-23',
        services: [
          {
            serviceType: 'washing',
            clothType: 'normal',
            quantity: 1,
            unitCost: 10.00
          }
        ]
      });

      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .delete(`/api/orders/${newOrder.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid order ID', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/orders/99999')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle malformed request data', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          // Missing required fields
          customerName: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Basic invalid_credentials');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });
  });
});