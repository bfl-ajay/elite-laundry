import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderMetricsBadges from '../OrderMetricsBadges';
import orderService from '../../../services/orderService';

// Mock the orderService
jest.mock('../../../services/orderService');

// Mock the laundry icons
jest.mock('../../../assets/icons/laundry-icons', () => ({
  ChartIcon: ({ className }) => <div data-testid="chart-icon" className={className} />,
  WashingMachineIcon: ({ className }) => <div data-testid="washing-machine-icon" className={className} />,
  CheckIcon: ({ className }) => <div data-testid="check-icon" className={className} />,
  MoneyIcon: ({ className }) => <div data-testid="money-icon" className={className} />,
  ClockIcon: ({ className }) => <div data-testid="clock-icon" className={className} />
}));

describe('OrderMetricsBadges', () => {
  const mockMetrics = {
    total: 150,
    pending: 45,
    completed: 85,
    paid: 70,
    unpaid_completed: 15
  };

  const mockProps = {
    onFilterChange: jest.fn(),
    activeFilter: 'pending',
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orderService.getOrderMetrics.mockResolvedValue(mockMetrics);
  });

  describe('Rendering', () => {
    it('renders all metric badges correctly', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByText('Unpaid Completed')).toBeInTheDocument();
      });
    });

    it('displays correct metric values', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // total
        expect(screen.getByText('45')).toBeInTheDocument();  // pending
        expect(screen.getByText('85')).toBeInTheDocument();  // completed
        expect(screen.getByText('70')).toBeInTheDocument();  // paid
        expect(screen.getByText('15')).toBeInTheDocument();  // unpaid_completed
      });
    });

    it('renders correct icons for each badge', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
        expect(screen.getByTestId('washing-machine-icon')).toBeInTheDocument();
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        expect(screen.getByTestId('money-icon')).toBeInTheDocument();
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      });
    });

    it('applies active filter styling correctly', async () => {
      render(<OrderMetricsBadges {...mockProps} activeFilter="pending" />);

      await waitFor(() => {
        const pendingBadge = screen.getByText('Pending').closest('button');
        expect(pendingBadge).toHaveClass('ring-2', 'ring-yellow-500');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when loading prop is true', () => {
      render(<OrderMetricsBadges {...mockProps} loading={true} />);

      const skeletons = screen.getAllByTestId('metric-skeleton');
      expect(skeletons).toHaveLength(5);
    });

    it('shows loading skeleton during data fetch', () => {
      orderService.getOrderMetrics.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockMetrics), 100))
      );

      render(<OrderMetricsBadges {...mockProps} />);

      const skeletons = screen.getAllByTestId('metric-skeleton');
      expect(skeletons).toHaveLength(5);
    });

    it('hides loading skeleton after data loads', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('metric-skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to fetch metrics';
      orderService.getOrderMetrics.mockRejectedValue(new Error(errorMessage));

      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading metrics/)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      orderService.getOrderMetrics.mockRejectedValue(new Error('API Error'));

      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries API call when retry button is clicked', async () => {
      orderService.getOrderMetrics
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockMetrics);

      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(orderService.getOrderMetrics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onFilterChange when badge is clicked', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Completed').closest('button'));

      expect(mockProps.onFilterChange).toHaveBeenCalledWith('completed');
    });

    it('calls onFilterChange with correct filter values', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
      });

      const testCases = [
        { text: 'Total Orders', filter: 'all' },
        { text: 'Pending', filter: 'pending' },
        { text: 'Completed', filter: 'completed' },
        { text: 'Paid', filter: 'paid' },
        { text: 'Unpaid Completed', filter: 'unpaid-completed' }
      ];

      for (const testCase of testCases) {
        fireEvent.click(screen.getByText(testCase.text).closest('button'));
        expect(mockProps.onFilterChange).toHaveBeenCalledWith(testCase.filter);
      }
    });

    it('provides keyboard accessibility', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('Pending').closest('button');
      
      // Test keyboard navigation
      pendingButton.focus();
      expect(pendingButton).toHaveFocus();

      // Test Enter key
      fireEvent.keyDown(pendingButton, { key: 'Enter', code: 'Enter' });
      expect(mockProps.onFilterChange).toHaveBeenCalledWith('pending');

      // Test Space key
      fireEvent.keyDown(pendingButton, { key: ' ', code: 'Space' });
      expect(mockProps.onFilterChange).toHaveBeenCalledWith('pending');
    });
  });

  describe('Data Refresh', () => {
    it('refetches data when component mounts', () => {
      render(<OrderMetricsBadges {...mockProps} />);
      expect(orderService.getOrderMetrics).toHaveBeenCalledTimes(1);
    });

    it('refetches data when activeFilter changes', async () => {
      const { rerender } = render(<OrderMetricsBadges {...mockProps} activeFilter="pending" />);
      
      await waitFor(() => {
        expect(orderService.getOrderMetrics).toHaveBeenCalledTimes(1);
      });

      rerender(<OrderMetricsBadges {...mockProps} activeFilter="completed" />);
      
      await waitFor(() => {
        expect(orderService.getOrderMetrics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        const container = screen.getByText('Total Orders').closest('div').parentElement;
        expect(container).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'lg:grid-cols-5');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<OrderMetricsBadges {...mockProps} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });

    it('indicates active filter to screen readers', async () => {
      render(<OrderMetricsBadges {...mockProps} activeFilter="pending" />);

      await waitFor(() => {
        const pendingButton = screen.getByText('Pending').closest('button');
        expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });
});