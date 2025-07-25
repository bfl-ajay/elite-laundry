const pool = require('../config/database');

class Expense {
  constructor(data) {
    this.id = data.id;
    this.expenseId = data.expense_id;
    this.expenseType = data.expense_type;
    this.amount = parseFloat(data.amount);
    this.billAttachment = data.bill_attachment;
    this.expenseDate = data.expense_date;
    this.createdAt = data.created_at;
  }

  // Create a new expense
  static async create(expenseData) {
    const { expenseType, amount, billAttachment, expenseDate } = expenseData;
    
    // Generate expense ID
    const expenseId = `EXP${Date.now()}`;
    
    const query = `
      INSERT INTO expenses (expense_id, expense_type, amount, bill_attachment, expense_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [expenseId, expenseType, amount, billAttachment, expenseDate]);
    return new Expense(result.rows[0]);
  }

  // Find expense by ID
  static async findById(id) {
    const query = 'SELECT * FROM expenses WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Expense(result.rows[0]);
  }

  // Find expense by expense ID
  static async findByExpenseId(expenseId) {
    const query = 'SELECT * FROM expenses WHERE expense_id = $1';
    const result = await pool.query(query, [expenseId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Expense(result.rows[0]);
  }

  // Find all expenses with optional filtering
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.expenseType) {
      paramCount++;
      query += ` AND expense_type ILIKE $${paramCount}`;
      params.push(`%${filters.expenseType}%`);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND expense_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND expense_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.minAmount) {
      paramCount++;
      query += ` AND amount >= $${paramCount}`;
      params.push(filters.minAmount);
    }

    if (filters.maxAmount) {
      paramCount++;
      query += ` AND amount <= $${paramCount}`;
      params.push(filters.maxAmount);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => new Expense(row));
  }

  // Update expense details
  async update(updateData) {
    const { expenseType, amount, expenseDate } = updateData;
    
    const query = `
      UPDATE expenses 
      SET expense_type = $1, amount = $2, expense_date = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [expenseType, amount, expenseDate, this.id]);
    const updatedExpense = new Expense(result.rows[0]);
    
    // Update current instance
    this.expenseType = updatedExpense.expenseType;
    this.amount = updatedExpense.amount;
    this.expenseDate = updatedExpense.expenseDate;
    
    return this;
  }

  // Update bill attachment
  async updateAttachment(billAttachment) {
    const query = `
      UPDATE expenses 
      SET bill_attachment = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [billAttachment, this.id]);
    const updatedExpense = new Expense(result.rows[0]);
    
    // Update current instance
    this.billAttachment = updatedExpense.billAttachment;
    
    return this;
  }

  // Delete expense
  async delete() {
    const query = 'DELETE FROM expenses WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Get expense statistics
  static async getStatistics(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_expense,
        COALESCE(MIN(amount), 0) as min_expense,
        COALESCE(MAX(amount), 0) as max_expense
      FROM expenses 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND expense_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND expense_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.expenseType) {
      paramCount++;
      query += ` AND expense_type ILIKE $${paramCount}`;
      params.push(`%${filters.expenseType}%`);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Get expense type breakdown
  static async getTypeBreakdown(filters = {}) {
    let query = `
      SELECT 
        expense_type,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM expenses 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND expense_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND expense_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    query += ' GROUP BY expense_type ORDER BY total_amount DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get monthly expense trends
  static async getMonthlyTrends(filters = {}) {
    let query = `
      SELECT 
        DATE_TRUNC('month', expense_date) as month,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND expense_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND expense_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    query += ' GROUP BY DATE_TRUNC(\'month\', expense_date) ORDER BY month DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      expenseId: this.expenseId,
      expenseType: this.expenseType,
      amount: this.amount,
      billAttachment: this.billAttachment,
      expenseDate: this.expenseDate,
      createdAt: this.createdAt
    };
  }
}

module.exports = Expense;