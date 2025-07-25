const Expense = require('../../models/Expense');

describe('Expense Model', () => {
  describe('Expense.create()', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        expenseType: 'Office Supplies',
        amount: 150.75,
        expenseDate: '2024-01-15',
        billAttachment: 'receipt.pdf'
      };

      const expense = await Expense.create(expenseData);

      expect(expense).toBeInstanceOf(Expense);
      expect(expense.expenseType).toBe(expenseData.expenseType);
      expect(expense.amount).toBe(expenseData.amount);
      expect(expense.expenseDate).toBe(expenseData.expenseDate);
      expect(expense.billAttachment).toBe(expenseData.billAttachment);
      expect(expense.expenseId).toMatch(/^EXP\d+$/);
      expect(expense.id).toBeDefined();
      expect(expense.createdAt).toBeDefined();
    });

    it('should generate unique expense IDs', async () => {
      const expenseData1 = {
        expenseType: 'Expense 1',
        amount: 100.00,
        expenseDate: '2024-01-15'
      };

      const expenseData2 = {
        expenseType: 'Expense 2',
        amount: 200.00,
        expenseDate: '2024-01-15'
      };

      const expense1 = await Expense.create(expenseData1);
      const expense2 = await Expense.create(expenseData2);

      expect(expense1.expenseId).not.toBe(expense2.expenseId);
    });

    it('should handle expense without bill attachment', async () => {
      const expenseData = {
        expenseType: 'Cash Expense',
        amount: 50.00,
        expenseDate: '2024-01-15'
      };

      const expense = await Expense.create(expenseData);

      expect(expense.billAttachment).toBeNull();
    });

    it('should throw error for missing required fields', async () => {
      await expect(Expense.create({})).rejects.toThrow();
      await expect(Expense.create({ expenseType: 'Test' })).rejects.toThrow();
      await expect(Expense.create({ 
        expenseType: 'Test', 
        amount: 100 
      })).rejects.toThrow();
    });
  });

  describe('Expense.findById()', () => {
    it('should find expense by ID', async () => {
      const expenseData = {
        expenseType: 'Find Test',
        amount: 75.50,
        expenseDate: '2024-01-20'
      };

      const createdExpense = await Expense.create(expenseData);
      const foundExpense = await Expense.findById(createdExpense.id);

      expect(foundExpense).toBeInstanceOf(Expense);
      expect(foundExpense.id).toBe(createdExpense.id);
      expect(foundExpense.expenseType).toBe(expenseData.expenseType);
      expect(foundExpense.amount).toBe(expenseData.amount);
    });

    it('should return null for non-existent ID', async () => {
      const expense = await Expense.findById(99999);
      expect(expense).toBeNull();
    });
  });

  describe('Expense.findByExpenseId()', () => {
    it('should find expense by expense ID', async () => {
      const expenseData = {
        expenseType: 'Expense ID Test',
        amount: 125.00,
        expenseDate: '2024-01-25'
      };

      const createdExpense = await Expense.create(expenseData);
      const foundExpense = await Expense.findByExpenseId(createdExpense.expenseId);

      expect(foundExpense).toBeInstanceOf(Expense);
      expect(foundExpense.expenseId).toBe(createdExpense.expenseId);
      expect(foundExpense.expenseType).toBe(expenseData.expenseType);
    });

    it('should return null for non-existent expense ID', async () => {
      const expense = await Expense.findByExpenseId('NONEXISTENT123');
      expect(expense).toBeNull();
    });
  });

  describe('Expense.findAll()', () => {
    beforeEach(async () => {
      await Expense.create({
        expenseType: 'Office Supplies',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await Expense.create({
        expenseType: 'Utilities',
        amount: 250.00,
        expenseDate: '2024-01-15'
      });

      await Expense.create({
        expenseType: 'Marketing',
        amount: 75.00,
        expenseDate: '2024-01-20'
      });
    });

    it('should return all expenses', async () => {
      const expenses = await Expense.findAll();

      expect(Array.isArray(expenses)).toBe(true);
      expect(expenses.length).toBeGreaterThanOrEqual(3);
      expect(expenses[0]).toBeInstanceOf(Expense);
    });

    it('should filter expenses by type', async () => {
      const expenses = await Expense.findAll({ expenseType: 'Office' });

      expect(expenses.every(expense => 
        expense.expenseType.toLowerCase().includes('office')
      )).toBe(true);
    });

    it('should filter expenses by date range', async () => {
      const expenses = await Expense.findAll({
        startDate: '2024-01-12',
        endDate: '2024-01-18'
      });

      expect(expenses.every(expense => 
        expense.expenseDate >= '2024-01-12' && expense.expenseDate <= '2024-01-18'
      )).toBe(true);
    });

    it('should filter expenses by amount range', async () => {
      const expenses = await Expense.findAll({
        minAmount: 80.00,
        maxAmount: 200.00
      });

      expect(expenses.every(expense => 
        expense.amount >= 80.00 && expense.amount <= 200.00
      )).toBe(true);
    });

    it('should limit results', async () => {
      const expenses = await Expense.findAll({ limit: 2 });
      expect(expenses.length).toBe(2);
    });
  });

  describe('expense.update()', () => {
    it('should update expense details', async () => {
      const expense = await testUtils.createTestExpense();
      
      const updateData = {
        expenseType: 'Updated Expense Type',
        amount: 999.99,
        expenseDate: '2024-02-01'
      };

      await expense.update(updateData);

      expect(expense.expenseType).toBe(updateData.expenseType);
      expect(expense.amount).toBe(updateData.amount);
      expect(expense.expenseDate).toBe(updateData.expenseDate);

      // Verify in database
      const updatedExpense = await Expense.findById(expense.id);
      expect(updatedExpense.expenseType).toBe(updateData.expenseType);
      expect(updatedExpense.amount).toBe(updateData.amount);
    });
  });

  describe('expense.updateAttachment()', () => {
    it('should update bill attachment', async () => {
      const expense = await testUtils.createTestExpense();
      
      await expense.updateAttachment('new-receipt.pdf');

      expect(expense.billAttachment).toBe('new-receipt.pdf');

      // Verify in database
      const updatedExpense = await Expense.findById(expense.id);
      expect(updatedExpense.billAttachment).toBe('new-receipt.pdf');
    });

    it('should handle null attachment', async () => {
      const expense = await testUtils.createTestExpense();
      
      await expense.updateAttachment(null);

      expect(expense.billAttachment).toBeNull();
    });
  });

  describe('expense.delete()', () => {
    it('should delete expense', async () => {
      const expense = await testUtils.createTestExpense();
      const expenseId = expense.id;

      const result = await expense.delete();

      expect(result).toBe(true);

      const deletedExpense = await Expense.findById(expenseId);
      expect(deletedExpense).toBeNull();
    });
  });

  describe('Expense.getStatistics()', () => {
    beforeEach(async () => {
      await Expense.create({
        expenseType: 'Stats Test 1',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await Expense.create({
        expenseType: 'Stats Test 2',
        amount: 200.00,
        expenseDate: '2024-01-15'
      });

      await Expense.create({
        expenseType: 'Stats Test 3',
        amount: 50.00,
        expenseDate: '2024-01-20'
      });
    });

    it('should return expense statistics', async () => {
      const stats = await Expense.getStatistics();

      expect(stats).toHaveProperty('total_expenses');
      expect(stats).toHaveProperty('total_amount');
      expect(stats).toHaveProperty('average_expense');
      expect(stats).toHaveProperty('min_expense');
      expect(stats).toHaveProperty('max_expense');

      expect(parseInt(stats.total_expenses)).toBeGreaterThanOrEqual(3);
      expect(parseFloat(stats.total_amount)).toBeGreaterThanOrEqual(350.00);
      expect(parseFloat(stats.min_expense)).toBeGreaterThanOrEqual(50.00);
      expect(parseFloat(stats.max_expense)).toBeGreaterThanOrEqual(200.00);
    });

    it('should filter statistics by date range', async () => {
      const stats = await Expense.getStatistics({
        startDate: '2024-01-12',
        endDate: '2024-01-18'
      });

      expect(parseInt(stats.total_expenses)).toBeGreaterThanOrEqual(1);
      expect(parseFloat(stats.total_amount)).toBeGreaterThanOrEqual(200.00);
    });
  });

  describe('Expense.getTypeBreakdown()', () => {
    beforeEach(async () => {
      await Expense.create({
        expenseType: 'Office Supplies',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await Expense.create({
        expenseType: 'Office Supplies',
        amount: 150.00,
        expenseDate: '2024-01-12'
      });

      await Expense.create({
        expenseType: 'Utilities',
        amount: 300.00,
        expenseDate: '2024-01-15'
      });
    });

    it('should return expense type breakdown', async () => {
      const breakdown = await Expense.getTypeBreakdown();

      expect(Array.isArray(breakdown)).toBe(true);
      expect(breakdown.length).toBeGreaterThanOrEqual(2);

      const officeSupplies = breakdown.find(item => item.expense_type === 'Office Supplies');
      expect(officeSupplies).toBeDefined();
      expect(parseInt(officeSupplies.expense_count)).toBe(2);
      expect(parseFloat(officeSupplies.total_amount)).toBe(250.00);
    });
  });

  describe('Expense.getMonthlyTrends()', () => {
    beforeEach(async () => {
      await Expense.create({
        expenseType: 'January Expense 1',
        amount: 100.00,
        expenseDate: '2024-01-10'
      });

      await Expense.create({
        expenseType: 'January Expense 2',
        amount: 200.00,
        expenseDate: '2024-01-20'
      });

      await Expense.create({
        expenseType: 'February Expense',
        amount: 150.00,
        expenseDate: '2024-02-05'
      });
    });

    it('should return monthly expense trends', async () => {
      const trends = await Expense.getMonthlyTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThanOrEqual(2);

      const januaryTrend = trends.find(trend => 
        trend.month.toISOString().startsWith('2024-01')
      );
      expect(januaryTrend).toBeDefined();
      expect(parseInt(januaryTrend.expense_count)).toBe(2);
      expect(parseFloat(januaryTrend.total_amount)).toBe(300.00);
    });

    it('should limit monthly trends', async () => {
      const trends = await Expense.getMonthlyTrends({ limit: 1 });
      expect(trends.length).toBe(1);
    });
  });

  describe('expense.toJSON()', () => {
    it('should return expense data as JSON', async () => {
      const expense = await testUtils.createTestExpense();
      const json = expense.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('expenseId');
      expect(json).toHaveProperty('expenseType');
      expect(json).toHaveProperty('amount');
      expect(json).toHaveProperty('billAttachment');
      expect(json).toHaveProperty('expenseDate');
      expect(json).toHaveProperty('createdAt');
    });
  });
});