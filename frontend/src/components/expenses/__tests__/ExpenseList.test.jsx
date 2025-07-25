import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseList from '../ExpenseList';

describe('ExpenseList', () => {
  const mockExpenses = [
    {
      id: 1,
      expenseId: 'EXP001',
      expenseType: 'Office Supplies',
      amount: 150.75,
      expenseDate: '2024-01-15',
      billAttachment: 'receipt1.pdf',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      expenseId: 'EXP002',
      expenseType: 'Utilities',
      amount: 300.00,
      expenseDate: '2024-01-16',
      billAttachment: null,
      createdAt: '2024-01-16T14:20:00Z'
    },
    {
      id: 3,
      expenseId: 'EXP003',
      expenseType: 'Marketing',
      amount: 75.50,
      expenseDate: '2024-01-17',
      billAttachment: 'receipt3.jpg',
      createdAt: '2024-01-17T09:15:00Z'
    }
  ];

  const mockProps = {
    expenses: mockExpenses,
    loading: false,
    error: null,
    onExpenseEdit: jest.fn(),
    onExpenseDelete: jest.fn(),
    onViewAttachment: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders expense list with all expenses', () => {
    render(<ExpenseList {...mockProps} />);

    expect(screen.getByText('Expense History')).toBeInTheDocument();
    expect(screen.getByText('EXP001')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('$150.75')).toBeInTheDocument();
    
    expect(screen.getByText('EXP002')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    
    expect(screen.getByText('EXP003')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('$75.50')).toBeInTheDocument();
  });

  test('displays expense dates correctly', () => {
    render(<ExpenseList {...mockProps} />);

    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('2024-01-16')).toBeInTheDocument();
    expect(screen.getByText('2024-01-17')).toBeInTheDocument();
  });

  test('shows attachment indicators', () => {
    render(<ExpenseList {...mockProps} />);

    // Should show attachment icons for expenses with attachments
    const attachmentButtons = screen.getAllByText('View');
    expect(attachmentButtons).toHaveLength(2); // EXP001 and EXP003 have attachments

    // Should show "No attachment" for expenses without attachments
    expect(screen.getByText('No attachment')).toBeInTheDocument();
  });

  test('calls onViewAttachment when attachment button is clicked', () => {
    render(<ExpenseList {...mockProps} />);

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    expect(mockProps.onViewAttachment).toHaveBeenCalledWith(mockExpenses[0]);
  });

  test('calls onExpenseEdit when edit button is clicked', () => {
    render(<ExpenseList {...mockProps} />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockProps.onExpenseEdit).toHaveBeenCalledWith(mockExpenses[0]);
  });

  test('calls onExpenseDelete when delete button is clicked with confirmation', () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<ExpenseList {...mockProps} />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this expense?');
    expect(mockProps.onExpenseDelete).toHaveBeenCalledWith(mockExpenses[0].id);

    // Restore window.confirm
    window.confirm.mockRestore();
  });

  test('cancels deletion when user declines confirmation', () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<ExpenseList {...mockProps} />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockProps.onExpenseDelete).not.toHaveBeenCalled();

    // Restore window.confirm
    window.confirm.mockRestore();
  });

  test('shows loading state', () => {
    render(<ExpenseList {...mockProps} loading={true} />);

    expect(screen.getByText('Loading expenses...')).toBeInTheDocument();
    expect(screen.queryByText('EXP001')).not.toBeInTheDocument();
  });

  test('shows error state', () => {
    const error = 'Failed to load expenses';
    render(<ExpenseList {...mockProps} error={error} />);

    expect(screen.getByText('Error loading expenses')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.queryByText('EXP001')).not.toBeInTheDocument();
  });

  test('shows empty state when no expenses', () => {
    render(<ExpenseList {...mockProps} expenses={[]} />);

    expect(screen.getByText('No expenses found')).toBeInTheDocument();
    expect(screen.getByText('Add your first expense to get started')).toBeInTheDocument();
  });

  test('formats currency amounts correctly', () => {
    render(<ExpenseList {...mockProps} />);

    expect(screen.getByText('$150.75')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('$75.50')).toBeInTheDocument();
  });

  test('sorts expenses by date (newest first)', () => {
    render(<ExpenseList {...mockProps} />);

    const expenseCards = screen.getAllByTestId('expense-card');
    
    // First card should be the newest (EXP003 - 2024-01-17)
    expect(expenseCards[0]).toHaveTextContent('EXP003');
    expect(expenseCards[0]).toHaveTextContent('2024-01-17');
    
    // Last card should be the oldest (EXP001 - 2024-01-15)
    expect(expenseCards[2]).toHaveTextContent('EXP001');
    expect(expenseCards[2]).toHaveTextContent('2024-01-15');
  });

  test('displays expense type with appropriate styling', () => {
    render(<ExpenseList {...mockProps} />);

    const expenseTypes = screen.getAllByText(/Office Supplies|Utilities|Marketing/);
    
    expenseTypes.forEach(type => {
      expect(type).toHaveClass('font-medium');
    });
  });

  test('shows total expenses count', () => {
    render(<ExpenseList {...mockProps} />);

    expect(screen.getByText('Total: 3 expenses')).toBeInTheDocument();
  });

  test('calculates and displays total amount', () => {
    render(<ExpenseList {...mockProps} />);

    // Total should be 150.75 + 300.00 + 75.50 = 526.25
    expect(screen.getByText('Total Amount: $526.25')).toBeInTheDocument();
  });

  test('handles search/filter functionality', async () => {
    render(<ExpenseList {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search expenses...');
    
    // Search for "Office"
    fireEvent.change(searchInput, { target: { value: 'Office' } });

    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.queryByText('Utilities')).not.toBeInTheDocument();
      expect(screen.queryByText('Marketing')).not.toBeInTheDocument();
    });
  });

  test('handles date range filtering', async () => {
    render(<ExpenseList {...mockProps} />);

    const startDateInput = screen.getByLabelText('From:');
    const endDateInput = screen.getByLabelText('To:');

    // Filter for 2024-01-16 to 2024-01-17
    fireEvent.change(startDateInput, { target: { value: '2024-01-16' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-17' } });

    await waitFor(() => {
      expect(screen.getByText('EXP002')).toBeInTheDocument();
      expect(screen.getByText('EXP003')).toBeInTheDocument();
      expect(screen.queryByText('EXP001')).not.toBeInTheDocument();
    });
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<ExpenseList {...mockProps} />);

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Expense list');

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  test('handles keyboard navigation', () => {
    render(<ExpenseList {...mockProps} />);

    const firstExpenseCard = screen.getAllByTestId('expense-card')[0];
    
    // Test Enter key on edit button
    const editButton = screen.getAllByText('Edit')[0];
    fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' });
    expect(mockProps.onExpenseEdit).toHaveBeenCalled();

    // Test Space key on delete button
    const deleteButton = screen.getAllByText('Delete')[0];
    window.confirm = jest.fn(() => true);
    fireEvent.keyDown(deleteButton, { key: ' ', code: 'Space' });
    expect(mockProps.onExpenseDelete).toHaveBeenCalled();
    window.confirm.mockRestore();
  });

  test('displays attachment file types correctly', () => {
    render(<ExpenseList {...mockProps} />);

    // Should show different icons/indicators for different file types
    expect(screen.getByText('receipt1.pdf')).toBeInTheDocument();
    expect(screen.getByText('receipt3.jpg')).toBeInTheDocument();
  });

  test('handles long expense type names', () => {
    const longNameExpense = {
      ...mockExpenses[0],
      expenseType: 'Very Long Expense Type Name That Should Be Truncated'
    };

    render(<ExpenseList {...mockProps} expenses={[longNameExpense]} />);

    const expenseType = screen.getByText(/Very Long Expense Type Name/);
    expect(expenseType).toHaveClass('truncate');
  });
});