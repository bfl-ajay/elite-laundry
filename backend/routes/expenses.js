const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requirePermission, canEditExpense } = require('../middleware/roleAuth');
const { expenseValidations, validateDateRange } = require('../middleware/validation');
const { billUpload, validateFileUpload, cleanupOnError } = require('../middleware/upload');
const { asyncHandler, NotFoundError, DatabaseError, FileUploadError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management operations
 */

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses with optional filtering
 *     description: Retrieve a list of expenses with optional filtering by date range and expense type
 *     tags: [Expenses]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses from this date (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses until this date (YYYY-MM-DD)
 *         example: 2024-12-31
 *       - in: query
 *         name: expenseType
 *         schema:
 *           type: string
 *         description: Filter expenses by type
 *         example: Utilities
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
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
 *                         $ref: '#/components/schemas/Expense'
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
router.get('/', expenseValidations.list, validateDateRange, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, expenseType } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      query += ` AND expense_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND expense_date <= $${paramCount}`;
      params.push(endDate);
    }

    if (expenseType) {
      paramCount++;
      query += ` AND expense_type ILIKE $${paramCount}`;
      params.push(`%${expenseType}%`);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve expenses', error);
  }
}));

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     description: Create a new expense record with optional bill attachment
 *     tags: [Expenses]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - expenseType
 *               - amount
 *               - expenseDate
 *             properties:
 *               expenseType:
 *                 type: string
 *                 description: Type of expense
 *                 example: Utilities
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Expense amount
 *                 example: 150.00
 *               expenseDate:
 *                 type: string
 *                 format: date
 *                 description: Date of expense
 *                 example: 2024-01-15
 *               billAttachment:
 *                 type: string
 *                 format: binary
 *                 description: Bill attachment file (PDF, JPG, PNG)
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expenseType
 *               - amount
 *               - expenseDate
 *             properties:
 *               expenseType:
 *                 type: string
 *                 example: Utilities
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 example: 150.00
 *               expenseDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Validation error or file upload error
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
 *       413:
 *         description: File too large
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
router.post('/', requirePermission('expenses:create'), cleanupOnError, billUpload, validateFileUpload(false), expenseValidations.create, asyncHandler(async (req, res) => {
  try {
    const { expenseType, amount, expenseDate } = req.body;
    const billAttachment = req.file ? req.file.filename : null;

    // Generate expense ID
    const expenseId = `EXP${Date.now()}`;

    const result = await pool.query(`
      INSERT INTO expenses (expense_id, expense_type, amount, bill_attachment, expense_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [expenseId, expenseType, parseFloat(amount), billAttachment, expenseDate, req.user.id]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    throw new DatabaseError('Failed to create expense', error);
  }
}));

// Get expense by ID
router.get('/:id', expenseValidations.getById, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Expense not found', 'expense');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve expense', error);
  }
}));

// Upload attachment to existing expense
router.post('/:id/attachment', cleanupOnError, billUpload, validateFileUpload(true), expenseValidations.uploadAttachment, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const billAttachment = req.file.filename;

    const result = await pool.query(`
      UPDATE expenses 
      SET bill_attachment = $1
      WHERE id = $2
      RETURNING *
    `, [billAttachment, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Expense not found', 'expense');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to upload attachment', error);
  }
}));

// Update expense (Admin and Super Admin only)
router.put('/:id', canEditExpense, expenseValidations.update, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseType, amount, expenseDate } = req.body;

    const result = await pool.query(`
      UPDATE expenses 
      SET expense_type = $1, amount = $2, expense_date = $3
      WHERE id = $4
      RETURNING *
    `, [expenseType, parseFloat(amount), expenseDate, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Expense not found', 'expense');
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Expense updated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update expense', error);
  }
}));

// Delete expense (Admin and Super Admin only)
router.delete('/:id', canEditExpense, expenseValidations.getById, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get expense details first to clean up file
    const expenseResult = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    
    if (expenseResult.rows.length === 0) {
      throw new NotFoundError('Expense not found', 'expense');
    }

    const expense = expenseResult.rows[0];

    // Delete from database
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);

    // Clean up file if exists
    if (expense.bill_attachment) {
      const filePath = path.join(__dirname, '../uploads/bills', expense.bill_attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete expense', error);
  }
}));

module.exports = router;