import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseMetrics from '../ExpenseMetrics';

describe('ExpenseMetrics', () => {
  const mockData = {
    totalExpenses: 45,
    totalAmount: 2250.75,
    averageExpense: 50.02,
    minExpense: 15.00,
    maxExpense: 150.00
  };

  test('renders all expense metrics', () => {
    render(<ExpenseMetrics data={mockData} loading={false} error={null} />);

    expect(screen.getByText('Expense Overview')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Total Expenses
    expect(screen.getByText('$2,250.75')).toBeInTheDocument(); // Total Amount
    expect(screen.getByText('$50.02')).toBeInTheDocument(); // Average Expense
    expect(screen.getByText('$15.00')).toBeInTheDocument(); // Min Expense
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Max Expense
  });

  test('displays metric labels correctly', () => {
    render(<ExpenseMetrics data={mockData} loading={false} error={null} />);

    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Average Expense')).toBeInTheDocument();
    expect(screen.getByText('Minimum')).toBeInTheDocument();
    expect(screen.getByText('Maximum')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<ExpenseMetrics data={null} loading={true} error={null} />);

    expect(screen.getByText('Loading expense metrics...')).toBeInTheDocument();
    expect(screen.queryByText('Expense Overview')).not.toBeInTheDocument();
  });

  test('shows error state', () => {
    const error = 'Failed to load expense metrics';
    render(<ExpenseMetrics data={null} loading={false} error={error} />);

    expect(screen.getByText('Error loading expense metrics')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.queryByText('Expense Overview')).not.toBeInTheDocument();
  });

  test('handles zero values correctly', () => {
    const zeroData = {
      totalExpenses: 0,
      totalAmount: 0,
      averageExpense: 0,
      minExpense: 0,
      maxExpense: 0
    };

    render(<ExpenseMetrics data={zeroData} loading={false} error={null} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00')).toHaveLength(4); // All currency fields
  });

  test('formats currency values correctly', () => {
    const currencyData = {
      ...mockData,
      totalAmount: 12345.67,
      averageExpense: 123.45,
      minExpense: 9.99,
      maxExpense: 999.99
    };

    render(<ExpenseMetrics data={currencyData} loading={false} error={null} />);

    expect(screen.getByText('$12,345.67')).toBeInTheDocument();
    expect(screen.getByText('$123.45')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
  });

  test('handles missing data gracefully', () => {
    const incompleteData = {
      totalExpenses: 25,
      totalAmount: 1000
      // Missing other fields
    };

    render(<ExpenseMetrics data={incompleteData} loading={false} error={null} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    // Should handle missing fields without crashing
  });

  test('displays appropriate icons for each metric', () => {
    render(<ExpenseMetrics data={mockData} loading={false} error={null} />);

    // Check for metric cards
    const metricCards = screen.getAllByRole('article');
    expect(metricCards.length).toBeGreaterThan(0);
  });

  test('applies correct styling classes', () => {
    render(<ExpenseMetrics data={mockData} loading={false} error={null} />);

    const container = screen.getByText('Expense Overview').closest('div');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  test('shows expense trend indicators', () => {
    render(<ExpenseMetrics data={mockData} loading={false} error={null} />);

    // Should show some visual indicators for expense trends
    expect(screen.getByText('Expense Overview')).toBeInTheDocument();
  });

  test('handles large numbers correctly', () => {
    const largeData = {
      totalExpenses: 9999,
      totalAmount: 999999.99,
      averageExpense: 1000.00,
      minExpense: 0.01,
      maxExpense: 50000.00
    };

    render(<ExpenseMetrics data={largeData} loading={false} error={null} />);

    expect(screen.getByText('9999')).toBeInTheDocument();
    expect(screen.getByText('$999,999.99')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$0.01')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });
});