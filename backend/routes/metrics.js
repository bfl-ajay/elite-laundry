const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, DatabaseError } = require('../middleware/errorHandler');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Metrics route is working!' });
});

/**
 * @swagger
 * /api/metrics/orders:
 *   get:
 *     summary: Get order metrics for dashboard
 *     description: Retrieve order counts by status and payment status for dashboard display
 *     tags: [Metrics]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Order metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 150
 *                     pendingOrders:
 *                       type: integer
 *                       example: 25
 *                     completedOrders:
 *                       type: integer
 *                       example: 125
 *                     paidOrders:
 *                       type: integer
 *                       example: 100
 *                     unpaidCompletedOrders:
 *                       type: integer
 *                       example: 25
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/orders', asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'Completed' AND payment_status = 'Paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN status = 'Completed' AND (payment_status IS NULL OR payment_status != 'Paid') THEN 1 END) as unpaid_completed_orders
      FROM orders
    `);

    const metrics = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalOrders: parseInt(metrics.total_orders),
        pendingOrders: parseInt(metrics.pending_orders),
        completedOrders: parseInt(metrics.completed_orders),
        paidOrders: parseInt(metrics.paid_orders),
        unpaidCompletedOrders: parseInt(metrics.unpaid_completed_orders)
      }
    });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve order metrics', error);
  }
}));

module.exports = router;