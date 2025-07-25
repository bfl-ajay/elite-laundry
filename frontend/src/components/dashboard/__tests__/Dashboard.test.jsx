import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';

// Mock the services
jest.mock('../../../services', () => ({
  analyticsService: {
    getBusinessAnalytics: jest.fn(),
    getExpenseAnalytics: jest.fn()
  }
}));

// Mock child components
jest.mock('../BusinessMetrics', () => {
  return function MockBusinessMetrics({ data, loading, error }) {
    if (loading) return <div>Loading business metrics...</div>;
    if (error) return <div>Error loading business metrics</div>;
    return <div>Business Metrics Component</div>;
  };
});

jest.mock('../ExpenseMetrics', () => {
  return function MockExpenseMetrics({ data, loading, error }) {
    if (loading) return <div>Loading expense metrics...</div>;
    if (error) return <div>Error loading expense metrics</div>;
    return <div>Expense Metrics Component</div>;
  };
});

jest.mock('../TimeFilter', () => {
  return function MockTimeFilter({ selectedPeriod, onPeriodChange }) {
    return (
      <div>
        Time Filter Component
        <button onClick={() => onPeriodChange('daily')}>Daily</button>
        <button onClick={() => onPeriodChange('weekly')}>Weekly</button>
        <button onClick={() => onPeriodChange('monthly')}>Monthly</button>
      </div>
    );
  };
});

const { analyticsService } = require('../../../services');

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    analyticsService.getBusinessAnalytics.mockResolvedValue({
      data: {
        totalOrders: 100,
        completedOrders: 80,
        pendingOrders: 20,
        totalRevenue: 5000,
        averageOrderValue: 50
      }
    });
    
    analyticsService.getExpenseAnalytics.mockResolvedValue({
      data: {
        totalExpenses: 50,
        totalAmount: 2000,
        averageExpense: 40
      }
    });
  });

  test('renders dashboard with all components', async () => {
    render(<Dashboard />);

    expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Time Filter Component')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Business Metrics Component')).toBeInTheDocument();
      expect(screen.getByText('Expense Metrics Component')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(<Dashboard />);

    expect(screen.getByText('Loading business metrics...')).toBeInTheDocument();
    expect(screen.getByText('Loading expense metrics...')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    analyticsService.getBusinessAnalytics.mockRejectedValue(new Error('API Error'));
    analyticsService.getExpenseAnalytics.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading business metrics')).toBeInTheDocument();
      expect(screen.getByText('Error loading expense metrics')).toBeInTheDocument();
    });
  });

  test('fetches data on mount', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(analyticsService.getBusinessAnalytics).toHaveBeenCalledWith('monthly');
      expect(analyticsService.getExpenseAnalytics).toHaveBeenCalledWith('monthly');
    });
  });

  test('refetches data when time period changes', async () => {
    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(analyticsService.getBusinessAnalytics).toHaveBeenCalledWith('monthly');
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Simulate period change
    const dailyButton = screen.getByText('Daily');
    dailyButton.click();

    await waitFor(() => {
      expect(analyticsService.getBusinessAnalytics).toHaveBeenCalledWith('daily');
      expect(analyticsService.getExpenseAnalytics).toHaveBeenCalledWith('daily');
    });
  });

  test('handles partial API failures', async () => {
    analyticsService.getBusinessAnalytics.mockResolvedValue({
      data: { totalOrders: 100 }
    });
    analyticsService.getExpenseAnalytics.mockRejectedValue(new Error('Expense API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Business Metrics Component')).toBeInTheDocument();
      expect(screen.getByText('Error loading expense metrics')).toBeInTheDocument();
    });
  });
});