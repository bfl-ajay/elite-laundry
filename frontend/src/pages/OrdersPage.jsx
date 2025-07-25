import React, { useState } from 'react';
import { OrderForm, OrderTable, OrderDetails, Navigation } from '../components';
import { LaundryBasketIcon } from '../assets/icons/laundry-icons';

const OrdersPage = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderCreated = () => {
    setShowOrderForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOrderUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <LaundryBasketIcon className="w-12 h-12 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600">Manage customer orders and track progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowOrderForm(!showOrderForm)}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium"
          >
            {showOrderForm ? 'Cancel' : 'New Order'}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Order Form */}
          {showOrderForm && (
            <OrderForm
              onOrderCreated={handleOrderCreated}
              onCancel={() => setShowOrderForm(false)}
            />
          )}

          {/* Orders Table */}
          <OrderTable
            refreshTrigger={refreshTrigger}
            onOrderSelect={handleOrderSelect}
          />
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onOrderUpdated={handleOrderUpdated}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;