const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requirePermission, canEditOrder } = require('../middleware/roleAuth');
const { orderValidations, validateDateRange } = require('../middleware/validation');
const { asyncHandler, NotFoundError, DatabaseError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management operations
 */

// Apply auth middleware to all routes
router.use(authenticate);

// Middleware to load order for permission checking
const loadOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (id) {
    try {
      const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        req.order = result.rows[0];
      }
    } catch (error) {
      console.warn('Could not load order for permission check:', error);
    }
  }
  next();
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders with optional filtering
 *     description: Retrieve a list of orders with optional filtering by status and date range
 *     tags: [Orders]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *         description: Filter orders by status
 *         example: Pending
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date (YYYY-MM-DD)
 *         example: 2024-12-31
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', orderValidations.list, validateDateRange, asyncHandler(async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = `
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve orders', error);
  }
}));

// Get specific order by ID
router.get('/:id', orderValidations.getById, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve order', error);
  }
}));

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order with customer details and services
 *     tags: [Orders]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - contactNumber
 *               - orderDate
 *               - services
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Customer full name
 *                 example: John Doe
 *               contactNumber:
 *                 type: string
 *                 description: Customer contact number
 *                 example: +1234567890
 *               orderDate:
 *                 type: string
 *                 format: date
 *                 description: Order placement date
 *                 example: 2024-01-15
 *               services:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - serviceType
 *                     - clothType
 *                     - quantity
 *                     - unitCost
 *                   properties:
 *                     serviceType:
 *                       type: string
 *                       enum: [washing, ironing, dry_cleaning, stain_removal]
 *                       example: washing
 *                     clothType:
 *                       type: string
 *                       enum: [saari, normal, delicate, heavy]
 *                       example: normal
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 5
 *                     unitCost:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       example: 10.00
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requirePermission('orders:create'), orderValidations.create, asyncHandler(async (req, res) => {
  try {
    const { customerName, contactNumber, customerAddress, orderDate, services } = req.body;
    
    // Debug: Log user information
    console.log('Order creation - User info:', {
      userId: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      hasUser: !!req.user,
      userObject: req.user
    });
    
    if (!req.user?.id) {
      console.error('WARNING: req.user.id is not available for order creation!');
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate order number
      const orderNumber = `ORD${Date.now()}`;

      // Calculate total amount
      const totalAmount = services.reduce((sum, service) => 
        sum + (service.quantity * service.unitCost), 0
      );

      // Insert order
      const orderResult = await client.query(`
        INSERT INTO orders (order_number, customer_name, contact_number, customer_address, order_date, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [orderNumber, customerName, contactNumber, customerAddress, orderDate, totalAmount, req.user?.id]);

      const orderId = orderResult.rows[0].id;

      // Insert services
      for (const service of services) {
        await client.query(`
          INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
          VALUES ($1, $2, $3, $4, $5)
        `, [orderId, service.serviceType, service.clothType, service.quantity, service.unitCost]);
      }

      await client.query('COMMIT');

      // Fetch complete order with services
      const completeOrder = await pool.query(`
        SELECT o.*, 
               u.username as created_by_username,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', os.id,
                     'service_type', os.service_type,
                     'cloth_type', os.cloth_type,
                     'quantity', os.quantity,
                     'unit_cost', os.unit_cost,
                     'total_cost', os.total_cost
                   )
                 ) FILTER (WHERE os.id IS NOT NULL), 
                 '[]'
               ) as services
        FROM orders o
        LEFT JOIN order_services os ON o.id = os.order_id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = $1
        GROUP BY o.id, u.username
      `, [orderId]);

      res.status(201).json({
        success: true,
        data: completeOrder.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    throw new DatabaseError('Failed to create order', error);
  }
}));

// Update order status
router.patch('/:id/status', loadOrder, canEditOrder, orderValidations.updateStatus, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update order status', error);
  }
}));

// Update complete order details
router.put('/:id', loadOrder, canEditOrder, orderValidations.update, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, contactNumber, customerAddress, orderDate, services } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if order exists
      const existingOrder = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (existingOrder.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundError('Order not found', 'order');
      }

      // Calculate new total amount
      const totalAmount = services.reduce((sum, service) => 
        sum + (service.quantity * service.unitCost), 0
      );

      // Update order
      await client.query(`
        UPDATE orders 
        SET customer_name = $1, contact_number = $2, customer_address = $3, order_date = $4, total_amount = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [customerName, contactNumber, customerAddress, orderDate, totalAmount, id]);

      // Delete existing services
      await client.query('DELETE FROM order_services WHERE order_id = $1', [id]);

      // Insert new services
      for (const service of services) {
        await client.query(`
          INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, service.serviceType, service.clothType, service.quantity, service.unitCost]);
      }

      await client.query('COMMIT');

      // Fetch updated order with services
      const updatedOrder = await pool.query(`
        SELECT o.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', os.id,
                     'service_type', os.service_type,
                     'cloth_type', os.cloth_type,
                     'quantity', os.quantity,
                     'unit_cost', os.unit_cost,
                     'total_cost', os.total_cost
                   )
                 ) FILTER (WHERE os.id IS NOT NULL), 
                 '[]'
               ) as services
        FROM orders o
        LEFT JOIN order_services os ON o.id = os.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [id]);

      res.json({
        success: true,
        data: updatedOrder.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update order', error);
  }
}));

// Update payment status
router.patch('/:id/payment', requirePermission('orders:update'), orderValidations.updatePayment, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const result = await pool.query(`
      UPDATE orders 
      SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [paymentStatus, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update payment status', error);
  }
}));

// Reject order (Admin and Super Admin only)
router.patch('/:id/reject', requirePermission('orders:reject'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required'
        }
      });
    }

    const result = await pool.query(`
      UPDATE orders 
      SET status = 'Rejected', 
          rejection_reason = $1, 
          rejected_at = CURRENT_TIMESTAMP,
          rejected_by = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [rejectionReason.trim(), req.user.id, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order rejected successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to reject order', error);
  }
}));

/**
 * @swagger
 * /api/orders/{id}/bill:
 *   get:
 *     summary: Generate bill for completed order
 *     description: Generate a detailed bill for a completed order with itemized services
 *     tags: [Orders]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Bill generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Bill'
 *       400:
 *         description: Order not completed or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/bill', orderValidations.getById, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      WHERE o.id = $1 AND o.status = 'Completed'
      GROUP BY o.id
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Completed order not found', 'order');
    }

    const order = result.rows[0];
    
    // Generate bill data
    const bill = {
      billNumber: `BILL-${order.order_number}`,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      contactNumber: order.contact_number,
      orderDate: order.order_date,
      billDate: new Date().toISOString().split('T')[0],
      services: order.services.map(service => ({
        description: `${service.service_type} - ${service.cloth_type}`,
        quantity: service.quantity,
        unitCost: parseFloat(service.unit_cost),
        totalCost: parseFloat(service.total_cost)
      })),
      subtotal: parseFloat(order.total_amount),
      totalAmount: parseFloat(order.total_amount),
      paymentStatus: order.payment_status || 'Unpaid'
    };

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to generate bill', error);
  }
}));

/**
 * @swagger
 * /api/orders/{id}/pdf:
 *   get:
 *     summary: Generate and download PDF bill for an order
 *     description: Generate a professional PDF bill for a completed order and download it
 *     tags: [Orders]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: PDF bill generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/pdf', orderValidations.getById, asyncHandler(async (req, res) => {
  const PDFBillService = require('../services/pdfService');
  const BusinessSettings = require('../models/BusinessSettings');
  
  try {
    const { id } = req.params;
    
    // Get order with services
    const result = await pool.query(`
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'rate', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    const order = result.rows[0];
    
    // Get business settings for branding
    const businessSettings = await BusinessSettings.getCurrent();
    
    // Prepare order data for PDF
    const orderData = {
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.contact_number,
      customer_address: order.customer_address,
      status: order.status,
      payment_status: order.payment_status || 'Pending',
      total_amount: parseFloat(order.total_amount),
      created_at: order.order_date,
      services: order.services.map(service => ({
        service_type: service.service_type,
        cloth_type: service.cloth_type,
        quantity: service.quantity,
        rate: parseFloat(service.rate || 0)
      }))
    };

    // Generate PDF
    const pdfService = new PDFBillService();
    const doc = await pdfService.generateBill(orderData, businessSettings);
    const pdfBuffer = await pdfService.createBuffer(doc);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-order-${order.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('PDF generation error:', error);
    throw new DatabaseError('Failed to generate PDF bill', error);
  }
}));

// Delete order
router.delete('/:id', requirePermission('orders:delete'), orderValidations.getById, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found', 'order');
    }

    res.json({
      success: true,
      message: 'Order deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete order', error);
  }
}));

module.exports = router;