const Order = require('../../models/Order');

describe('Order Model', () => {
  describe('Order.create()', () => {
    it('should create a new order with services', async () => {
      const orderData = {
        customerName: 'John Doe',
        contactNumber: '1234567890',
        orderDate: '2024-01-15',
        services: [
          {
            serviceType: 'washing',
            clothType: 'normal',
            quantity: 5,
            unitCost: 10.00
          },
          {
            serviceType: 'ironing',
            clothType: 'saari',
            quantity: 3,
            unitCost: 15.00
          }
        ]
      };

      const order = await Order.create(orderData);

      expect(order).toBeInstanceOf(Order);
      expect(order.customerName).toBe(orderData.customerName);
      expect(order.contactNumber).toBe(orderData.contactNumber);
      expect(order.orderDate).toBe(orderData.orderDate);
      expect(order.status).toBe('Pending');
      expect(order.totalAmount).toBe(95.00); // (5*10) + (3*15)
      expect(order.orderNumber).toMatch(/^ORD\d+$/);
      expect(order.services).toHaveLength(2);
      expect(order.id).toBeDefined();
    });

    it('should generate unique order numbers', async () => {
      const orderData1 = {
        customerName: 'Customer 1',
        contactNumber: '1111111111',
        orderDate: '2024-01-15',
        services: [{ serviceType: 'washing', clothType: 'normal', quantity: 1, unitCost: 10.00 }]
      };

      const orderData2 = {
        customerName: 'Customer 2',
        contactNumber: '2222222222',
        orderDate: '2024-01-15',
        services: [{ serviceType: 'ironing', clothType: 'saari', quantity: 1, unitCost: 15.00 }]
      };

      const order1 = await Order.create(orderData1);
      const order2 = await Order.create(orderData2);

      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });

    it('should calculate total amount correctly', async () => {
      const orderData = {
        customerName: 'Test Customer',
        contactNumber: '1234567890',
        orderDate: '2024-01-15',
        services: [
          { serviceType: 'washing', clothType: 'normal', quantity: 2, unitCost: 12.50 },
          { serviceType: 'dryclean', clothType: 'others', quantity: 1, unitCost: 25.00 },
          { serviceType: 'stain_removal', clothType: 'saari', quantity: 3, unitCost: 8.00 }
        ]
      };

      const order = await Order.create(orderData);

      expect(order.totalAmount).toBe(74.00); // (2*12.50) + (1*25.00) + (3*8.00)
    });

    it('should throw error for missing required fields', async () => {
      await expect(Order.create({})).rejects.toThrow();
      await expect(Order.create({ customerName: 'Test' })).rejects.toThrow();
      await expect(Order.create({ 
        customerName: 'Test', 
        contactNumber: '123' 
      })).rejects.toThrow();
    });
  });

  describe('Order.findById()', () => {
    it('should find order by ID with services', async () => {
      const orderData = {
        customerName: 'Find Test',
        contactNumber: '9876543210',
        orderDate: '2024-01-20',
        services: [
          { serviceType: 'washing', clothType: 'normal', quantity: 2, unitCost: 10.00 }
        ]
      };

      const createdOrder = await Order.create(orderData);
      const foundOrder = await Order.findById(createdOrder.id);

      expect(foundOrder).toBeInstanceOf(Order);
      expect(foundOrder.id).toBe(createdOrder.id);
      expect(foundOrder.customerName).toBe(orderData.customerName);
      expect(foundOrder.services).toHaveLength(1);
      expect(foundOrder.services[0].service_type).toBe('washing');
    });

    it('should return null for non-existent ID', async () => {
      const order = await Order.findById(99999);
      expect(order).toBeNull();
    });
  });

  describe('Order.findByOrderNumber()', () => {
    it('should find order by order number', async () => {
      const orderData = {
        customerName: 'Order Number Test',
        contactNumber: '5555555555',
        orderDate: '2024-01-25',
        services: [
          { serviceType: 'ironing', clothType: 'saari', quantity: 1, unitCost: 20.00 }
        ]
      };

      const createdOrder = await Order.create(orderData);
      const foundOrder = await Order.findByOrderNumber(createdOrder.orderNumber);

      expect(foundOrder).toBeInstanceOf(Order);
      expect(foundOrder.orderNumber).toBe(createdOrder.orderNumber);
      expect(foundOrder.customerName).toBe(orderData.customerName);
    });

    it('should return null for non-existent order number', async () => {
      const order = await Order.findByOrderNumber('NONEXISTENT123');
      expect(order).toBeNull();
    });
  });

  describe('Order.findAll()', () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create({
        customerName: 'Customer A',
        contactNumber: '1111111111',
        orderDate: '2024-01-10',
        services: [{ serviceType: 'washing', clothType: 'normal', quantity: 1, unitCost: 10.00 }]
      });

      const order2 = await Order.create({
        customerName: 'Customer B',
        contactNumber: '2222222222',
        orderDate: '2024-01-15',
        services: [{ serviceType: 'ironing', clothType: 'saari', quantity: 1, unitCost: 15.00 }]
      });

      await order2.updateStatus('Completed');
    });

    it('should return all orders', async () => {
      const orders = await Order.findAll();

      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThanOrEqual(2);
      expect(orders[0]).toBeInstanceOf(Order);
    });

    it('should filter orders by status', async () => {
      const pendingOrders = await Order.findAll({ status: 'Pending' });
      const completedOrders = await Order.findAll({ status: 'Completed' });

      expect(pendingOrders.every(order => order.status === 'Pending')).toBe(true);
      expect(completedOrders.every(order => order.status === 'Completed')).toBe(true);
    });

    it('should filter orders by date range', async () => {
      const orders = await Order.findAll({
        startDate: '2024-01-12',
        endDate: '2024-01-20'
      });

      expect(orders.every(order => 
        order.orderDate >= '2024-01-12' && order.orderDate <= '2024-01-20'
      )).toBe(true);
    });

    it('should limit results', async () => {
      const orders = await Order.findAll({ limit: 1 });
      expect(orders.length).toBe(1);
    });
  });

  describe('order.updateStatus()', () => {
    it('should update order status', async () => {
      const order = await testUtils.createTestOrder();
      
      await order.updateStatus('Completed');

      expect(order.status).toBe('Completed');
      expect(order.updatedAt).toBeDefined();

      // Verify in database
      const updatedOrder = await Order.findById(order.id);
      expect(updatedOrder.status).toBe('Completed');
    });
  });

  describe('order.updatePaymentStatus()', () => {
    it('should update payment status', async () => {
      const order = await testUtils.createTestOrder();
      
      await order.updatePaymentStatus('Paid');

      expect(order.paymentStatus).toBe('Paid');

      // Verify in database
      const updatedOrder = await Order.findById(order.id);
      expect(updatedOrder.paymentStatus).toBe('Paid');
    });
  });

  describe('order.update()', () => {
    it('should update order details and services', async () => {
      const order = await testUtils.createTestOrder();
      
      const updateData = {
        customerName: 'Updated Customer',
        contactNumber: '9999999999',
        orderDate: '2024-02-01',
        services: [
          { serviceType: 'dryclean', clothType: 'others', quantity: 2, unitCost: 30.00 }
        ]
      };

      await order.update(updateData);

      expect(order.customerName).toBe(updateData.customerName);
      expect(order.contactNumber).toBe(updateData.contactNumber);
      expect(order.totalAmount).toBe(60.00);
      expect(order.services).toHaveLength(1);
    });
  });

  describe('order.delete()', () => {
    it('should delete order and cascade services', async () => {
      const order = await testUtils.createTestOrder();
      const orderId = order.id;

      const result = await order.delete();

      expect(result).toBe(true);

      const deletedOrder = await Order.findById(orderId);
      expect(deletedOrder).toBeNull();
    });
  });

  describe('Order.getStatistics()', () => {
    beforeEach(async () => {
      const order1 = await Order.create({
        customerName: 'Stats Customer 1',
        contactNumber: '1111111111',
        orderDate: '2024-01-10',
        services: [{ serviceType: 'washing', clothType: 'normal', quantity: 1, unitCost: 50.00 }]
      });
      await order1.updateStatus('Completed');

      await Order.create({
        customerName: 'Stats Customer 2',
        contactNumber: '2222222222',
        orderDate: '2024-01-15',
        services: [{ serviceType: 'ironing', clothType: 'saari', quantity: 1, unitCost: 30.00 }]
      });
    });

    it('should return order statistics', async () => {
      const stats = await Order.getStatistics();

      expect(stats).toHaveProperty('total_orders');
      expect(stats).toHaveProperty('completed_orders');
      expect(stats).toHaveProperty('pending_orders');
      expect(stats).toHaveProperty('total_revenue');
      expect(stats).toHaveProperty('average_order_value');

      expect(parseInt(stats.total_orders)).toBeGreaterThanOrEqual(2);
      expect(parseInt(stats.completed_orders)).toBeGreaterThanOrEqual(1);
      expect(parseInt(stats.pending_orders)).toBeGreaterThanOrEqual(1);
      expect(parseFloat(stats.total_revenue)).toBeGreaterThanOrEqual(50.00);
    });

    it('should filter statistics by date range', async () => {
      const stats = await Order.getStatistics({
        startDate: '2024-01-12',
        endDate: '2024-01-20'
      });

      expect(parseInt(stats.total_orders)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('order.generateBill()', () => {
    it('should generate bill for completed order', async () => {
      const order = await testUtils.createTestOrder();
      await order.updateStatus('Completed');

      const bill = order.generateBill();

      expect(bill).toHaveProperty('billNumber');
      expect(bill).toHaveProperty('orderNumber', order.orderNumber);
      expect(bill).toHaveProperty('customerName', order.customerName);
      expect(bill).toHaveProperty('services');
      expect(bill).toHaveProperty('totalAmount', order.totalAmount);
      expect(bill.billNumber).toMatch(/^BILL-ORD\d+$/);
      expect(Array.isArray(bill.services)).toBe(true);
    });

    it('should throw error for non-completed order', async () => {
      const order = await testUtils.createTestOrder();

      expect(() => order.generateBill()).toThrow('Bill can only be generated for completed orders');
    });
  });

  describe('order.toJSON()', () => {
    it('should return order data as JSON', async () => {
      const order = await testUtils.createTestOrder();
      const json = order.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('orderNumber');
      expect(json).toHaveProperty('customerName');
      expect(json).toHaveProperty('contactNumber');
      expect(json).toHaveProperty('orderDate');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('totalAmount');
      expect(json).toHaveProperty('services');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});