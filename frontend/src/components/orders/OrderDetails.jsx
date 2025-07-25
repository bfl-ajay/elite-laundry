import React, { useState, useEffect } from 'react';
import { CloseIcon, MoneyIcon } from '../../assets/icons/laundry-icons';
import { orderService } from '../../services';
import StatusUpdater from './StatusUpdater';
import BillDisplay from './BillDisplay';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetails = ({ order, onClose, onOrderUpdated }) => {
  const { user, canEditOrder, canRejectOrder } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBill, setShowBill] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (order) {
      fetchOrderDetails();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(order.id);
      setOrderDetails(response);
      setServices(response.services || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await orderService.updateOrderStatus(order.id, newStatus);
      setOrderDetails(prev => ({ ...prev, status: newStatus }));
      if (onOrderUpdated) onOrderUpdated();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentUpdate = async (paymentStatus) => {
    try {
      await orderService.updatePaymentStatus(order.id, paymentStatus);
      setOrderDetails(prev => ({ ...prev, payment_status: paymentStatus }));
      if (onOrderUpdated) onOrderUpdated();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const handleGenerateBill = () => {
    setShowBill(true);
  };

  const handleCloseBill = () => {
    setShowBill(false);
  };

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      await orderService.downloadPdfBill(orderDetails.id);
      // Success feedback could be added here
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBillPaymentUpdate = (paymentStatus) => {
    setOrderDetails(prev => ({ ...prev, payment_status: paymentStatus }));
    if (onOrderUpdated) onOrderUpdated();
  };

  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setRejecting(true);
      await orderService.rejectOrder(orderDetails.id, rejectionReason);
      setOrderDetails(prev => ({ 
        ...prev, 
        status: 'Rejected',
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString()
      }));
      setShowRejectModal(false);
      setRejectionReason('');
      if (onOrderUpdated) onOrderUpdated();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    } finally {
      setRejecting(false);
    }
  };

  const handleGenerateBillOld = async () => {
    try {
      const response = await orderService.generateBill(order.id);
      const billData = response.data;
      // Open bill in new window or download
      const billWindow = window.open('', '_blank');
      billWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${response.billNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .bill-info { margin-bottom: 20px; }
              .services-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .services-table th, .services-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .services-table th { background-color: #f2f2f2; }
              .total { text-align: right; font-size: 18px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Laundry Service Bill</h1>
              <p>Bill Number: ${billData.billNumber}</p>
            </div>
            <div class="bill-info">
              <p><strong>Customer:</strong> ${billData.customerName}</p>
              <p><strong>Contact:</strong> ${billData.contactNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(billData.orderDate).toLocaleDateString()}</p>
              <p><strong>Bill Date:</strong> ${new Date(billData.billDate).toLocaleDateString()}</p>
            </div>
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${billData.services.map(service => `
                  <tr>
                    <td>${service.description}</td>
                    <td>${service.quantity}</td>
                    <td>₹${service.unitCost.toFixed(2)}</td>
                    <td>₹${service.totalCost.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <p>Total Amount: ₹${billData.totalAmount.toFixed(2)}</p>
              <p>Payment Status: ${billData.paymentStatus}</p>
            </div>
          </body>
        </html>
      `);
      billWindow.document.close();
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    }
  };

  const calculateTotal = () => {
    return services.reduce((total, service) => total + (service.total_cost || 0), 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-surface rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform animate-slideIn shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            Order Details - {orderDetails.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {orderDetails.customer_name}</p>
                <p><span className="font-medium">Contact:</span> {orderDetails.contact_number}</p>
                {orderDetails.customer_address && (
                  <p><span className="font-medium">Address:</span> {orderDetails.customer_address}</p>
                )}
                <p><span className="font-medium">Order Date:</span> {new Date(orderDetails.order_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Created By:</span> {orderDetails.created_by_username || 'Unknown'}</p>
                <p><span className="font-medium">Created At:</span> {new Date(orderDetails.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Status</h3>
              <div className="space-y-3">
                {canEditOrder(orderDetails) ? (
                  <StatusUpdater 
                    currentStatus={orderDetails.status}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      orderDetails.status === 'Completed' ? 'bg-success-100 text-success-800' :
                      orderDetails.status === 'In Progress' ? 'bg-warning-100 text-warning-800' :
                      orderDetails.status === 'Rejected' ? 'bg-error-100 text-error-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {orderDetails.status}
                    </span>
                  </div>
                )}
                
                {orderDetails.status === 'Rejected' && orderDetails.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{orderDetails.rejection_reason}</p>
                    {orderDetails.rejected_at && (
                      <p className="text-xs text-red-600 mt-1">
                        Rejected on: {new Date(orderDetails.rejected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Status:</span>
                  {user?.role !== 'employee' || orderDetails.payment_status === 'Unpaid' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePaymentUpdate('Paid')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                          orderDetails.payment_status === 'Paid'
                            ? 'bg-success-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-success-100'
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => handlePaymentUpdate('Unpaid')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                          orderDetails.payment_status === 'Unpaid'
                            ? 'bg-error-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-error-100'
                        }`}
                      >
                        Unpaid
                      </button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      orderDetails.payment_status === 'Paid' ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                    }`}>
                      {orderDetails.payment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Services</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cloth Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {service.service_type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {service.cloth_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{parseFloat(service.unit_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{parseFloat(service.total_cost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MoneyIcon className="w-6 h-6 text-primary-500 mr-2" />
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
              </div>
              <span className="text-2xl font-bold text-primary-600">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {orderDetails.status === 'Completed' && (
                <>
                  <button
                    onClick={handleGenerateBill}
                    className="inline-flex items-center px-4 py-2 bg-success-500 text-white rounded-md hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                    </svg>
                    View Bill
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>
                </>
              )}
              
              {/* Reject Order Button - Only for Admin/Super Admin and non-rejected orders */}
              {canRejectOrder() && orderDetails.status !== 'Rejected' && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Reject Order
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Display Modal */}
      {showBill && (
        <BillDisplay
          orderId={orderDetails.id}
          onClose={handleCloseBill}
          onPaymentUpdate={handleBillPaymentUpdate}
        />
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this order. This action cannot be undone.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mb-4">
              {rejectionReason.length}/500 characters
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={rejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rejecting...
                  </>
                ) : (
                  'Reject Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;