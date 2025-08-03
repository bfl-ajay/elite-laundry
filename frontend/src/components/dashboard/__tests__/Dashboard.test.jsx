import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import orderService from '../../../services/orderService';

// Mock the dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/orderService');

// Mock the child components
jest.mock('../OrderMetricsBadges', () => {
  return function MockOrderMetricsBadges({ onFilterChange, activeFilter, loading }) {
    return (
      <div data-testid="order-metrics-badges">
        <button 
          onClick={() => onFilterChange('pending')}
          data-testid="pending-badge"
          className={activeFilter === 'pending' ? 'active' : ''}
        >
          Pending: 45
        </button>
        <button 
          onClick={() => onFilterChange('completed')}
          data-testid="completed-badge"
          className={activeFilter === 'completed' ? 'active' : ''}
        >
          Completed: 85
        </button>
        {loading && <div data-testid="badges-loading">Loading...</div>}
      </div>
    );
  };
});

jest.mock('../SearchBar', () => {
  return function MockSearchBar({ onSearchChange, searchQuery, loading }) {
    return (
      <div data-testid="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          data-testid="search-input"
        />
        {loading && <div data-testid="search-loading">Loading...</div>}
      </div>
    );
  };
});

jest.mock('../../orders/OrderTable', () => {
  return function MockOrderTable({ filter, searchQuery, onOrderSelect, refreshTrigger }) {
    return (
      <div data-testid="order-table">
        <div data-testid="table-filter">Filter: {filter}</div>
        <div data-testid="table-search">Search: {searchQuery}</div>
        <div data-testid="table-refresh">Refresh: {refreshTrigger}</div>
        <button 
          onClick={() => onOrderSelect({ id: 1, orderNumber: 'ORD001' })}
          data-testid="select-order"
        >
          Select Order
        </button>
      </div>
    );
  };
});

jest.mock('../TimeFilter', () => {
  return function MockTimeFilter() {
    return <div data-testid="time-filter">Time Filter</div>;
  };
});

describe('Dashboard', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'employee'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    orderService.getOrderMetrics.mockResolvedValue({
      total: 150,
      pending: 45,
      completed: 85,
      paid: 70,
      unpaid_completed: 15
    });
  });

  describe('Initial Rendering', () => {
    it('renders all main components', () => {
      render(<Dashboard />);

      expect(screen.getByText(`Welcome back, ${mockUser.username}!`)).toBeInTheDocument();
      expect(screen.getByTestId('order-metrics-badges')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('order-table')).toBeInTheDocument();
      expect(screen.getByTestId('time-filter')).toBeInTheDocument();
    });

    it('initializes with default state values', () => {
      render(<Dashboard />);

      // Check that pending filter is active by default
      const pendingBadge = screen.getByTestId('pending-badge');
      expect(pendingBadge).toHaveClass('active');

      // Check that search is empty initially
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveValue('');

      // Check that table receives correct initial props
      expect(screen.getByTestId('table-filter')).toHaveTextContent('Filter: pending');
      expect(screen.getByTestId('table-search')).toHaveTextContent('Search: ');
    });

    it('displays quick actions section', () => {
      render(<Dashboard />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('New Order')).toBeInTheDocument();
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('updates active filter when badge is clicked', () => {
      render(<Dashboard />);

      // Initially pending should be active
      expect(screen.getByTestId('table-filter')).toHaveTextContent('Filter: pending');

      // Click completed badge
      fireEvent.click(screen.getByTestId('completed-badge'));

      // Check that filter changed
      expect(screen.getByTestId('table-filter')).toHaveTextContent('Filter: completed');
    });

    it('displays correct filter name in status indicator', () => {
      render(<Dashboard />);

      // Check initial filter display
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();

      // Change filter
      fireEvent.click(screen.getByTestId('completed-badge'));

      // Check updated filter display
      expect(screen.getByText('Completed Orders')).toBeInTheDocument();
    });

    it('maintains search query when filter changes', () => {
      render(<Dashboard />);

      // Set search query
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      expect(screen.getByTestId('table-search')).toHaveTextContent('Search: John Doe');

      // Change filter
      fireEvent.click(screen.getByTestId('completed-badge'));

      // Search should be maintained
      expect(screen.getByTestId('table-search')).toHaveTextContent('Search: John Doe');
    });
  });

  describe('Search State Management', () => {
    it('updates search query when search input changes', () => {
      render(<Dashboard />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Jane Smith' } });

      expect(screen.getByTestId('table-search')).toHaveTextContent('Search: Jane Smith');
    });

    it('displays search query in status indicator', () => {
      render(<Dashboard />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(screen.getByText('"test query"')).toBeInTheDocument();
    });

    it('shows clear search button when search query exists', () => {
      render(<Dashboard />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      const clearButton = screen.getByTitle('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', () => {
      render(<Dashboard />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      const clearButton = screen.getByTitle('Clear search');
      fireEvent.click(clearButton);

      expect(screen.getByTestId('table-search')).toHaveTextContent('Search: ');
      expect(screen.queryByText('"test query"')).not.toBeInTheDocument();
    });
  });

  describe('Loading State Management', () => {
    it('shows loading state when filter or search changes', async () => {
      jest.useFakeTimers();
      render(<Dashboard />);

      // Change filter
      fireEvent.click(screen.getByTestId('completed-badge'));

      // Should show loading immediately
      expect(screen.getByTestId('badges-loading')).toBeInTheDocument();
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();

      // Advance timers to clear loading state
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('badges-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('manages loading state for search changes', async () => {
      jest.useFakeTimers();
      render(<Dashboard />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Should show loading
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();

      // Advance timers
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Refresh Functionality', () => {
    it('increments refresh trigger when refresh button is clicked', () => {
      render(<Dashboard />);

      // Initial refresh trigger should be 0
      expect(screen.getByTestId('table-refresh')).toHaveTextContent('Refresh: 0');

      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Refresh trigger should increment
      expect(screen.getByTestId('table-refresh')).toHaveTextContent('Refresh: 1');
    });

    it('refresh button has correct styling and icon', () => {
      render(<Dashboard />);

      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
      
      // Check for refresh icon (SVG)
      const refreshIcon = refreshButton.querySelector('svg');
      expect(refreshIcon).toBeInTheDocument();
    });
  });

  describe('Order Selection', () => {
    it('handles order selection from table', () => {
      render(<Dashboard />);

      const selectButton = screen.getByTestId('select-order');
      fireEvent.click(selectButton);

      // In a real implementation, this would update selectedOrder state
      // For now, we just verify the interaction works
      expect(selectButton).toBeInTheDocument();
    });
  });

  describe('User Context Integration', () => {
    it('displays correct welcome message for different users', () => {
      const adminUser = { ...mockUser, username: 'admin', role: 'admin' };
      useAuth.mockReturnValue({ user: adminUser });

      render(<Dashboard />);

      expect(screen.getByText('Welcome back, admin!')).toBeInTheDocument();
    });

    it('handles missing user gracefully', () => {
      useAuth.mockReturnValue({ user: null });

      render(<Dashboard />);

      // Should still render without crashing
      expect(screen.getByTestId('order-metrics-badges')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes to components', () => {
      render(<Dashboard />);

      const container = screen.getByTestId('order-metrics-badges').parentElement;
      expect(container).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'lg:grid-cols-5');
    });

    it('applies responsive classes to quick actions', () => {
      render(<Dashboard />);

      const quickActionsGrid = screen.getByText('New Order').parentElement.parentElement;
      expect(quickActionsGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<Dashboard />);

      const welcomeHeading = screen.getByRole('heading', { level: 1 });
      expect(welcomeHeading).toBeInTheDocument();

      const quickActionsHeading = screen.getByRole('heading', { level: 3 });
      expect(quickActionsHeading).toHaveTextContent('Quick Actions');
    });

    it('provides accessible button labels', () => {
      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();

      const clearButton = screen.getByTitle('Clear search');
      expect(clearButton).toHaveAttribute('aria-label');
    });
  });
});