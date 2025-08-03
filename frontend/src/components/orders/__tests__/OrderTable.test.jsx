import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderTable from '../OrderTable';
import orderService from '../../../services/orderService';

// Mock the orderService
jest.mock('../../../services/orderService');

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
    refreshTrigger: 0,
    onOrderSelect: jest.fn(),
    filter: 'pending',
    searchQuery: '',
    onSearchChange: jest.fn(),
    defaultSort: 'created_at',
    sortOrder: 'desc'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orderService.getOrders.mockResolvedValue(mockOrders);
  });

  describe('Rendering', () => {
    it('renders table headers correctly', async () => {
      render(<OrderTable {...mockProps} />);

      expect(screen.getByText('Order #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders order data after loading', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('calls orderService.getOrders with correct filter parameters', () => {
      render(<OrderTable {...mockProps} filter="completed" searchQuery="John" />);

      expect(orderService.getOrders).toHaveBeenCalledWith({
        status: 'completed',
        search: 'John'
      });
    });
  });

  describe('Data Display', () => {
    it('displays order status with correct styling', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        const pendingStatus = screen.getByText('Pending');
        const completedStatus = screen.getByText('Completed');

        expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
        expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('displays payment status correctly', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unpaid')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });

    it('formats currency amounts correctly', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('$150.00')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
      });
    });

    it('calls onOrderSelect when order row is clicked', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
      });

      const orderRow = screen.getByText('ORD001').closest('tr');
      fireEvent.click(orderRow);

      expect(mockProps.onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state initially', () => {
      orderService.getOrders.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockOrders), 100))
      );

      render(<OrderTable {...mockProps} />);

      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });

    it('shows error state when API call fails', async () => {
      const errorMessage = 'Failed to load orders';
      orderService.getOrders.mockRejectedValue(new Error(errorMessage));

      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading orders')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('shows empty state when no orders returned', async () => {
      orderService.getOrders.mockResolvedValue([]);

      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      orderService.getOrders.mockRejectedValue(new Error('API Error'));

      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries API call when retry button is clicked', async () => {
      orderService.getOrders
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockOrders);

      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
        expect(orderService.getOrders).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Filtering and Search', () => {
    it('refetches data when filter changes', async () => {
      const { rerender } = render(<OrderTable {...mockProps} filter="pending" />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledWith({ status: 'pending', search: '' });
      });

      rerender(<OrderTable {...mockProps} filter="completed" />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledWith({ status: 'completed', search: '' });
      });
    });

    it('refetches data when search query changes', async () => {
      const { rerender } = render(<OrderTable {...mockProps} searchQuery="" />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledWith({ status: 'pending', search: '' });
      });

      rerender(<OrderTable {...mockProps} searchQuery="John" />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledWith({ status: 'pending', search: 'John' });
      });
    });

    it('refetches data when refreshTrigger changes', async () => {
      const { rerender } = render(<OrderTable {...mockProps} refreshTrigger={0} />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledTimes(1);
      });

      rerender(<OrderTable {...mockProps} refreshTrigger={1} />);
      
      await waitFor(() => {
        expect(orderService.getOrders).toHaveBeenCalledTimes(2);
      });
    });

    it('handles special filter values correctly', () => {
      render(<OrderTable {...mockProps} filter="unpaid-completed" />);

      expect(orderService.getOrders).toHaveBeenCalledWith({ 
        status: 'completed', 
        paymentStatus: 'unpaid',
        search: '' 
      });
    });

    it('handles "all" filter correctly', () => {
      render(<OrderTable {...mockProps} filter="all" />);

      expect(orderService.getOrders).toHaveBeenCalledWith({ search: '' });
    });
  });

  describe('User Interactions', () => {
    it('calls onOrderSelect when order row is clicked', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
      });

      const orderRow = screen.getByText('ORD001').closest('tr');
      fireEvent.click(orderRow);

      expect(mockProps.onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);
    });

    it('handles keyboard navigation on table rows', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
      });

      const firstOrderRow = screen.getByText('ORD001').closest('tr');
      
      // Test Enter key
      fireEvent.keyDown(firstOrderRow, { key: 'Enter', code: 'Enter' });
      expect(mockProps.onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);

      // Test Space key
      fireEvent.keyDown(firstOrderRow, { key: ' ', code: 'Space' });
      expect(mockProps.onOrderSelect).toHaveBeenCalledTimes(2);
    });

    it('applies hover effects on table rows', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
      });

      const orderRows = screen.getAllByRole('row').slice(1); // Skip header row
      
      orderRows.forEach(row => {
        expect(row).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(<OrderTable {...mockProps} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Orders table');

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    it('provides proper row accessibility', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ORD001')).toBeInTheDocument();
      });

      const orderRows = screen.getAllByRole('row').slice(1); // Skip header row
      
      orderRows.forEach(row => {
        expect(row).toHaveAttribute('tabIndex', '0');
        expect(row).toHaveAttribute('role', 'button');
      });
    });
  });

  describe('Data Formatting', () => {
    it('formats dates correctly', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Jan 16, 2024')).toBeInTheDocument();
      });
    });

    it('displays service information', async () => {
      render(<OrderTable {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/washing/)).toBeInTheDocument();
        expect(screen.getByText(/ironing/)).toBeInTheDocument();
      });
    });
  });
});