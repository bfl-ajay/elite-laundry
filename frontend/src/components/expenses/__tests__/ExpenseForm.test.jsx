import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorProvider } from '../../../contexts/ErrorContext';
import ExpenseForm from '../ExpenseForm';

// Mock the expense service
jest.mock('../../../services', () => ({
  expenseService: {
    createExpense: jest.fn(),
    uploadAttachment: jest.fn()
  }
}));

const { expenseService } = require('../../../services');

const renderWithProviders = (component) => {
  return render(
    <ErrorProvider>
      {component}
    </ErrorProvider>
  );
};

describe('ExpenseForm', () => {
  const mockOnExpenseCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all required fields', () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    expect(screen.getByText('Add New Expense')).toBeInTheDocument();
    expect(screen.getByLabelText(/expense type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expense date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bill attachment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expense type is required')).toBeInTheDocument();
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
      expect(screen.getByText('Expense date is required')).toBeInTheDocument();
    });

    expect(mockOnExpenseCreated).not.toHaveBeenCalled();
  });

  test('validates amount field', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const amountInput = screen.getByLabelText(/amount/i);
    
    // Test negative amount
    fireEvent.change(amountInput, { target: { value: '-10' } });
    fireEvent.blur(amountInput);

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });

    // Test zero amount
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.blur(amountInput);

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });

    // Test invalid format
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.blur(amountInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });
  });

  test('validates date field', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const dateInput = screen.getByLabelText(/expense date/i);
    
    // Test future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    fireEvent.change(dateInput, { target: { value: futureDateString } });
    fireEvent.blur(dateInput);

    await waitFor(() => {
      expect(screen.getByText('Expense date cannot be in the future')).toBeInTheDocument();
    });
  });

  test('validates file upload', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const fileInput = screen.getByLabelText(/bill attachment/i);
    
    // Create a large file (> 5MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
    });

    // Test invalid file type
    const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText('Only PDF, JPG, PNG files are allowed')).toBeInTheDocument();
    });
  });

  test('successfully submits form with valid data', async () => {
    const mockExpenseData = {
      id: 1,
      expenseId: 'EXP001',
      expenseType: 'Office Supplies',
      amount: 150.00,
      expenseDate: '2024-01-15'
    };

    expenseService.createExpense.mockResolvedValue({ data: mockExpenseData });

    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/expense type/i), {
      target: { value: 'Office Supplies' }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '150.00' }
    });
    fireEvent.change(screen.getByLabelText(/expense date/i), {
      target: { value: '2024-01-15' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnExpenseCreated).toHaveBeenCalledWith(mockExpenseData);
    });

    expect(expenseService.createExpense).toHaveBeenCalledWith({
      expenseType: 'Office Supplies',
      amount: 150.00,
      expenseDate: '2024-01-15'
    });
  });

  test('handles file upload with expense creation', async () => {
    const mockExpenseData = {
      id: 1,
      expenseId: 'EXP001',
      expenseType: 'Office Supplies',
      amount: 150.00,
      expenseDate: '2024-01-15'
    };

    expenseService.createExpense.mockResolvedValue({ data: mockExpenseData });
    expenseService.uploadAttachment.mockResolvedValue({ data: { filename: 'receipt.pdf' } });

    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/expense type/i), {
      target: { value: 'Office Supplies' }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '150.00' }
    });
    fireEvent.change(screen.getByLabelText(/expense date/i), {
      target: { value: '2024-01-15' }
    });

    // Add file
    const file = new File(['receipt content'], 'receipt.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/bill attachment/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(expenseService.createExpense).toHaveBeenCalled();
      expect(expenseService.uploadAttachment).toHaveBeenCalledWith(1, file);
      expect(mockOnExpenseCreated).toHaveBeenCalled();
    });
  });

  test('shows loading state during submission', async () => {
    let resolvePromise;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    expenseService.createExpense.mockReturnValue(mockPromise);

    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/expense type/i), {
      target: { value: 'Office Supplies' }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '150.00' }
    });
    fireEvent.change(screen.getByLabelText(/expense date/i), {
      target: { value: '2024-01-15' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve promise
    resolvePromise({ data: { id: 1 } });

    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const mockError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid expense data',
        details: [{ msg: 'Expense type is too short' }]
      }
    };

    expenseService.createExpense.mockRejectedValue(mockError);

    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/expense type/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '150.00' }
    });
    fireEvent.change(screen.getByLabelText(/expense date/i), {
      target: { value: '2024-01-15' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Expense type is too short/)).toBeInTheDocument();
    });

    expect(mockOnExpenseCreated).not.toHaveBeenCalled();
  });

  test('resets form after successful submission', async () => {
    expenseService.createExpense.mockResolvedValue({ data: { id: 1 } });

    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    // Fill form
    const typeInput = screen.getByLabelText(/expense type/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const dateInput = screen.getByLabelText(/expense date/i);

    fireEvent.change(typeInput, { target: { value: 'Office Supplies' } });
    fireEvent.change(amountInput, { target: { value: '150.00' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnExpenseCreated).toHaveBeenCalled();
    });

    // Form should be reset
    expect(typeInput.value).toBe('');
    expect(amountInput.value).toBe('');
    expect(dateInput.value).toBe('');
  });

  test('shows file preview when file is selected', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const file = new File(['receipt content'], 'receipt.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/bill attachment/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  test('allows file removal', async () => {
    renderWithProviders(<ExpenseForm onExpenseCreated={mockOnExpenseCreated} />);

    const file = new File(['receipt content'], 'receipt.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/bill attachment/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
    });

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('receipt.pdf')).not.toBeInTheDocument();
    });
  });
});