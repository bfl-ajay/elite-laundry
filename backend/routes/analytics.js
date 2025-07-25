const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { analyticsValidations, validateDateRange } = require('../middleware/validation');
const { asyncHandler, DatabaseError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Business analytics and reporting
 */

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/business:
 *   get:
 *     summary: Get business analytics
 *     description: Retrieve business metrics including orders, revenue, and performance data
 *     tags: [Analytics]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period for analytics grouping
 *         example: monthly
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period (YYYY-MM-DD)
 *         example: 2024-12-31
 *     responses:
 *       200:
 *         description: Business analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BusinessMetrics'
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
router.get('/business', analyticsValidations.business, validateDateRange, asyncHandler(async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    let dateFilter = '';
    let groupBy = '';
    let dateFormat = '';
    
    // Determine date filtering and grouping based on period
    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(order_date)';
        break;
      case 'weekly':
        dateFormat = 'YYYY-"W"WW';
        groupBy = 'DATE_TRUNC(\'week\', order_date)';
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        groupBy = 'DATE_TRUNC(\'month\', order_date)';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(order_date)';
    }

    // Build date filter
    const params = [];
    let paramCount = 0;
    
    if (startDate) {
      paramCount++;
      dateFilter += ` AND order_date >= $${paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      dateFilter += ` AND order_date <= $${paramCount}`;
      params.push(endDate);
    }

    // Get overall metrics
    const overallQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'Completed' THEN total_amount END), 0) as average_order_value
      FROM orders 
      WHERE 1=1 ${dateFilter}
    `;

    const overallResult = await pool.query(overallQuery, params);
    const overall = overallResult.rows[0];

    // Get time-series data
    const timeSeriesQuery = `
      SELECT 
        TO_CHAR(${groupBy}, '${dateFormat}') as period,
        ${groupBy} as period_date,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) as revenue
      FROM orders 
      WHERE 1=1 ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period_date DESC
      LIMIT 30
    `;

    const timeSeriesResult = await pool.query(timeSeriesQuery, params);

    // Get service type breakdown
    const serviceBreakdownQuery = `
      SELECT 
        os.service_type,
        COUNT(*) as order_count,
        SUM(os.quantity) as total_quantity,
        SUM(os.total_cost) as total_revenue
      FROM order_services os
      JOIN orders o ON os.order_id = o.id
      WHERE o.status = 'Completed' ${dateFilter.replace('order_date', 'o.order_date')}
      GROUP BY os.service_type
      ORDER BY total_revenue DESC
    `;

    const serviceBreakdownResult = await pool.query(serviceBreakdownQuery, params);

    res.json({
      success: true,
      data: {
        period,
        overall: {
          totalOrders: parseInt(overall.total_orders),
          completedOrders: parseInt(overall.completed_orders),
          pendingOrders: parseInt(overall.pending_orders),
          totalRevenue: parseFloat(overall.total_revenue),
          averageOrderValue: parseFloat(overall.average_order_value)
        },
        timeSeries: timeSeriesResult.rows.map(row => ({
          period: row.period,
          totalOrders: parseInt(row.total_orders),
          completedOrders: parseInt(row.completed_orders),
          pendingOrders: parseInt(row.pending_orders),
          revenue: parseFloat(row.revenue)
        })),
        serviceBreakdown: serviceBreakdownResult.rows.map(row => ({
          serviceType: row.service_type,
          orderCount: parseInt(row.order_count),
          totalQuantity: parseInt(row.total_quantity),
          totalRevenue: parseFloat(row.total_revenue)
        }))
      }
    });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve business analytics', error);
  }
}));

// Get expense analytics
router.get('/expenses', analyticsValidations.expenses, validateDateRange, asyncHandler(async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    let dateFilter = '';
    let groupBy = '';
    let dateFormat = '';
    
    // Determine date filtering and grouping based on period
    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(expense_date)';
        break;
      case 'weekly':
        dateFormat = 'YYYY-"W"WW';
        groupBy = 'DATE_TRUNC(\'week\', expense_date)';
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        groupBy = 'DATE_TRUNC(\'month\', expense_date)';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(expense_date)';
    }

    // Build date filter
    const params = [];
    let paramCount = 0;
    
    if (startDate) {
      paramCount++;
      dateFilter += ` AND expense_date >= $${paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      dateFilter += ` AND expense_date <= $${paramCount}`;
      params.push(endDate);
    }

    // Get overall expense metrics
    const overallQuery = `
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_expense
      FROM expenses 
      WHERE 1=1 ${dateFilter}
    `;

    const overallResult = await pool.query(overallQuery, params);
    const overall = overallResult.rows[0];

    // Get time-series expense data
    const timeSeriesQuery = `
      SELECT 
        TO_CHAR(${groupBy}, '${dateFormat}') as period,
        ${groupBy} as period_date,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses 
      WHERE 1=1 ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period_date DESC
      LIMIT 30
    `;

    const timeSeriesResult = await pool.query(timeSeriesQuery, params);

    // Get expense type breakdown
    const typeBreakdownQuery = `
      SELECT 
        expense_type,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM expenses 
      WHERE 1=1 ${dateFilter}
      GROUP BY expense_type
      ORDER BY total_amount DESC
    `;

    const typeBreakdownResult = await pool.query(typeBreakdownQuery, params);

    res.json({
      success: true,
      data: {
        period,
        overall: {
          totalExpenses: parseInt(overall.total_expenses),
          totalAmount: parseFloat(overall.total_amount),
          averageExpense: parseFloat(overall.average_expense)
        },
        timeSeries: timeSeriesResult.rows.map(row => ({
          period: row.period,
          expenseCount: parseInt(row.expense_count),
          totalAmount: parseFloat(row.total_amount)
        })),
        typeBreakdown: typeBreakdownResult.rows.map(row => ({
          expenseType: row.expense_type,
          expenseCount: parseInt(row.expense_count),
          totalAmount: parseFloat(row.total_amount),
          averageAmount: parseFloat(row.average_amount)
        }))
      }
    });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve expense analytics', error);
  }
}));

module.exports = router;