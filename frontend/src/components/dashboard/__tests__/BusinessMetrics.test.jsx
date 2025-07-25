import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BusinessMetrics from '../BusinessMetrics';

describe('BusinessMetrics', () => {
  const mockData = {
    totalOrders: 150,
    completedOrders: 120,
    pendingOrders: 30,
    totalRevenue: 7500.50,
    averageOrderValue: 50.00
  };

  test('renders all business metrics', () => {
    render(<BusinessMetrics data={mockData} loading={false} error={null} />);

    expect(screen.getByText('Business Overview')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Orders
    expect(screen.getByText('120')).toBeInTheDocument(); // Completed Orders
    expect(screen.getByText('30')).toBeInTheDocument(); // Pending Orders
    expect(screen.getByText('$7,500.50')).toBeInTheDocument(); // Total Revenue
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Average Order Value
  });

  test('displays metric labels correctly', () => {
    render(<BusinessMetrics data={mockData} loading={false} error={null} />);

    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<BusinessMetrics data={null} loading={true} error={null} />);

    expect(screen.getByText('Loading business metrics...')).toBeInTheDocument();
    expect(screen.queryByText('Business Overview')).not.toBeInTheDocument();
  });

  test('shows error state', () => {
    const error = 'Failed to load business metrics';
    render(<BusinessMetrics data={null} loading={false} error={error} />);

    expect(screen.getByText('Error loading business metrics')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.queryByText('Business Overview')).not.toBeInTheDocument();
  });

  test('handles zero values correctly', () => {
    const zeroData = {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    render(<BusinessMetrics data={zeroData} loading={false} error={null} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  test('formats currency values correctly', () => {
    const currencyData = {
      ...mockData,
      totalRevenue: 1234.56,
      averageOrderValue: 99.99
    };

    render(<BusinessMetrics data={currencyData} loading={false} error={null} />);

    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  test('calculates completion rate correctly', () => {
    render(<BusinessMetrics data={mockData} loading={false} error={null} />);

    // Completion rate should be 120/150 = 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('handles missing data gracefully', () => {
    const incompleteData = {
      totalOrders: 100,
      completedOrders: 80
      // Missing other fields
    };

    render(<BusinessMetrics data={incompleteData} loading={false} error={null} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    // Should handle missing fields without crashing
  });

  test('displays appropriate icons for each metric', () => {
    render(<BusinessMetrics data={mockData} loading={false} error={null} />);

    // Check for SVG icons (assuming they have specific test IDs or classes)
    const metricCards = screen.getAllByRole('article');
    expect(metricCards).toHaveLength(5); // 5 metrics
  });

  test('applies correct styling classes', () => {
    render(<BusinessMetrics data={mockData} loading={false} error={null} />);

    const container = screen.getByText('Business Overview').closest('div');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });
});