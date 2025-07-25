import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderTable from '../OrderTable';

describe('OrderTable', () => {
  const mockOrders = [
    {
      id: 1,
      orderNumber: 'ORD001',
      customerName: 'John Doe',
      contactNumber: '1234567890',
      orderDate: '2024-01-15',
      status: 'Pending',
      totalAmount: 150.00,
      paymentStatus: 'Unpaid',
      services: [
        { serviceType: 'washing', clothType: 'normal', quantity: 5, unitCost: 10.00 }
      ]
    },
    {
      id: 2,
      orderNumber: 'ORD002',
      customerName: 'Jane Smith',
      contactNumber: '0987654321',
      orderDate: '2024-01-16',
      status: 'Completed',
      totalAmount: 200.00,
      paymentStatus: 'Paid',
      services: [
        { serviceType: 'ironing', clothType: 'saari', quantity: 4, unitCost: 25.00 }
      ]
    }
  ];

  const mockProps = {
    orders: mockOrders,
    loading: false,
    error: null,
    onOrderSelect: jest.fn(),
    onStatusUpdate: jest.fn(),
    onPaymentUpdate: jest.fn(),
    onOrderDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with order data', () => {
    render(<OrderTable {...mockProps} />);

    expect(screen.getByText('Order #')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    expect(screen.getByText('ORD001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays order status with correct styling', () => {
    render(<OrderTable {...mockProps} />);

    const pendingStatus = screen.getByText('Pending');
    const completedStatus = screen.getByText('Completed');

    expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
    expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('displays payment status correctly', () => {
    render(<OrderTable {...mockProps} />);

    expect(screen.getByText('Unpaid')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  test('formats currency amounts correctly', () => {
    render(<OrderTable {...mockProps} />);

    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  test('calls onOrderSelect when order row is clicked', () => {
    render(<OrderTable {...mockProps} />);

    const orderRow = screen.getByText('ORD001').closest('tr');
    fireEvent.click(orderRow);

    expect(mockProps.onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);
  });

  test('shows loading state', () => {
    render(<OrderTable {...mockProps} loading={true} />);

    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    expect(screen.queryByText('ORD001')).not.toBeInTheDocument();
  });

  test('shows error state', () => {
    const error = 'Failed to load orders';
    render(<OrderTable {...mockProps} error={error} />);

    expect(screen.getByText('Error loading orders')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('shows empty state when no orders', () => {
    render(<OrderTable {...mockProps} orders={[]} />);

    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Create your first order to get started')).toBeInTheDocument();
  });

  test('handles status update', async () => {
    render(<OrderTable {...mockProps} />);

    const statusButton = screen.getAllByText('Update Status')[0];
    fireEvent.click(statusButton);

    await waitFor(() => {
      expect(mockProps.onStatusUpdate).toHaveBeenCalledWith(mockOrders[0].id, expect.any(String));
    });
  });

  test('handles payment update', async () => {
    render(<OrderTable {...mockProps} />);

    const paymentButton = screen.getAllByText('Mark Paid')[0];
    fireEvent.click(paymentButton);

    await waitFor(() => {
      expect(mockProps.onPaymentUpdate).toHaveBeenCalledWith(mockOrders[0].id, 'Paid');
    });
  });

  test('handles order deletion with confirmation', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<OrderTable {...mockProps} />);

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this order?');
    expect(mockProps.onOrderDelete).toHaveBeenCalledWith(mockOrders[0].id);

    // Restore window.confirm
    window.confirm.mockRestore();
  });

  test('cancels deletion when user declines confirmation', () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<OrderTable {...mockProps} />);

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockProps.onOrderDelete).not.toHaveBeenCalled();

    // Restore window.confirm
    window.confirm.mockRestore();
  });

  test('displays service information in tooltip or expandable row', () => {
    render(<OrderTable {...mockProps} />);

    // Look for service information display
    expect(screen.getByText('washing')).toBeInTheDocument();
    expect(screen.getByText('ironing')).toBeInTheDocument();
  });

  test('sorts orders by date (newest first)', () => {
    const unsortedOrders = [
      { ...mockOrders[0], orderDate: '2024-01-10' },
      { ...mockOrders[1], orderDate: '2024-01-20' }
    ];

    render(<OrderTable {...mockProps} orders={unsortedOrders} />);

    const rows = screen.getAllByRole('row');
    // First row is header, second should be the newer order
    expect(rows[1]).toHaveTextContent('2024-01-20');
    expect(rows[2]).toHaveTextContent('2024-01-10');
  });

  test('applies hover effects on table rows', () => {
    render(<OrderTable {...mockProps} />);

    const orderRows = screen.getAllByRole('row').slice(1); // Skip header row
    
    orderRows.forEach(row => {
      expect(row).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
    });
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<OrderTable {...mockProps} />);

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Orders table');

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  test('handles keyboard navigation', () => {
    render(<OrderTable {...mockProps} />);

    const firstOrderRow = screen.getByText('ORD001').closest('tr');
    
    // Test Enter key
    fireEvent.keyDown(firstOrderRow, { key: 'Enter', code: 'Enter' });
    expect(mockProps.onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);

    // Test Space key
    fireEvent.keyDown(firstOrderRow, { key: ' ', code: 'Space' });
    expect(mockProps.onOrderSelect).toHaveBeenCalledTimes(2);
  });
});