import React, { useState, useEffect } from 'react';
import OrderMetricsBadges from './OrderMetricsBadges';
import SearchBar from './SearchBar';
import OrderTable from '../orders/OrderTable';
import TimeFilter from './TimeFilter';
import ScreenReaderAnnouncement from '../common/ScreenReaderAnnouncement';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending'); // Default to pending orders
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // Announce filter change to screen readers
    const filterNames = {
      'all': 'All Orders',
      'pending': 'Pending Orders',
      'completed': 'Completed Orders',
      'paid': 'Paid Orders',
      'unpaid-completed': 'Unpaid Completed Orders'
    };
    setAnnouncement(`Now showing ${filterNames[filter] || 'Orders'}`);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query) {
      setAnnouncement(`Searching for "${query}"`);
    }
  };

  // Handle loading states when filter or search changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // Brief loading state for better UX
    
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery]);

  // Get display name for current filter
  const getFilterDisplayName = () => {
    const filterNames = {
      'all': 'All Orders',
      'pending': 'Pending Orders',
      'completed': 'Completed Orders',
      'paid': 'Paid Orders',
      'unpaid-completed': 'Unpaid Completed Orders'
    };
    return filterNames[activeFilter] || 'Orders';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Screen Reader Announcements */}
        <ScreenReaderAnnouncement message={announcement} />
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your orders today.
          </p>
        </div>

        {/* Order Metrics Badges */}
        <OrderMetricsBadges 
          onFilterChange={handleFilterChange}
          activeFilter={activeFilter}
          loading={loading}
        />

        {/* Search Bar and Status */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
            <SearchBar 
              onSearchChange={handleSearchChange}
              searchQuery={searchQuery}
              loading={loading}
            />
            <button
              onClick={handleRefresh}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              aria-label="Refresh order data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Current Filter Status */}
          <div className="flex items-center space-x-4 text-sm text-gray-600" role="status" aria-live="polite">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Showing:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {getFilterDisplayName()}
              </span>
            </div>
            {searchQuery && (
              <div className="flex items-center space-x-2">
                <span>•</span>
                <span className="font-medium">Search:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  "{searchQuery}"
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <OrderTable 
            refreshTrigger={refreshTrigger} 
            onOrderSelect={setSelectedOrder}
            filter={activeFilter}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            defaultSort="created_at"
            sortOrder="desc"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quick-actions-grid">
            <button 
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Create new order"
            >
              <div className="text-blue-600 font-medium">New Order</div>
              <div className="text-sm text-gray-600 mt-1">Create order</div>
            </button>
            <button 
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Mark order as complete"
            >
              <div className="text-green-600 font-medium">Mark Complete</div>
              <div className="text-sm text-gray-600 mt-1">Update status</div>
            </button>
            <button 
              className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              aria-label="Record payment"
            >
              <div className="text-yellow-600 font-medium">Payment</div>
              <div className="text-sm text-gray-600 mt-1">Record payment</div>
            </button>
            <button 
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="View analytics reports"
            >
              <div className="text-purple-600 font-medium">Reports</div>
              <div className="text-sm text-gray-600 mt-1">View analytics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;