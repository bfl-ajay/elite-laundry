import React, { useState, useEffect } from 'react';
import { CloseIcon, MoneyIcon, CheckIcon } from '../../assets/icons/laundry-icons';
import { orderService } from '../../services';

const BillDisplay = ({ orderId, onClose, onPaymentUpdate }) => {
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchBillData();
    }
  }, [orderId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.generateBill(orderId);
      setBillData(response.data);
    } catch (error) {
      console.error('Error fetching bill data:', error);
      setError('Failed to generate bill. Please ensure the order is completed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (paymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, paymentStatus);
      setBillData(prev => ({ ...prev, paymentStatus }));
      if (onPaymentUpdate) onPaymentUpdate(paymentStatus);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = document.getElementById('bill-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${billData.billNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              color: #1a202c;
              line-height: 1.6;
            }
            .bill-header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #0099CC;
              padding-bottom: 20px;
            }
            .bill-header h1 {
              color: #0099CC;
              margin: 0;
              font-size: 28px;
            }
            .bill-info { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px; 
            }
            .info-section h3 {
              color: #0099CC;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .services-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .services-table th { 
              background-color: #0099CC; 
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            .services-table td { 
              border: 1px solid #e2e8f0; 
              padding: 12px; 
              text-align: left; 
            }
            .services-table tr:nth-child(even) {
              background-color: #f7fafc;
            }
            .total-section { 
              text-align: right; 
              font-size: 18px; 
              font-weight: bold;
              background-color: #f7fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0099CC;
            }
            .payment-status {
              margin-top: 20px;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              font-weight: bold;
            }
            .payment-paid {
              background-color: #f0fff4;
              color: #38a169;
              border: 2px solid #38a169;
            }
            .payment-unpaid {
              background-color: #fef5e7;
              color: #d69e2e;
              border: 2px solid #d69e2e;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating bill...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-error-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!billData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header with actions */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 no-print">
          <h2 className="text-2xl font-semibold text-gray-900">Invoice</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14H4v-3h1v3zm6 0v2H7v-2h4zM15 11v3h-1v-3h1z" clipRule="evenodd"/>
              </svg>
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <CloseIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Bill content */}
        <div id="bill-content" className="p-8">
          {/* Bill header */}
          <div className="bill-header text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Laundry Service Invoice</h1>
            <p className="text-lg text-gray-600">Bill Number: {billData.billNumber}</p>
          </div>

          {/* Bill information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="info-section">
              <h3 className="text-lg font-semibold text-primary-600 mb-3 border-b border-primary-200 pb-1">
                Customer Information
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {billData.customerName}</p>
                <p><span className="font-medium">Contact:</span> {billData.contactNumber}</p>
                <p><span className="font-medium">Order Number:</span> {billData.orderNumber}</p>
              </div>
            </div>

            <div className="info-section">
              <h3 className="text-lg font-semibold text-primary-600 mb-3 border-b border-primary-200 pb-1">
                Bill Information
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Order Date:</span> {new Date(billData.orderDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Bill Date:</span> {new Date(billData.billDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    billData.paymentStatus === 'Paid' 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-warning-100 text-warning-800'
                  }`}>
                    {billData.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Services table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Provided</h3>
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className="services-table min-w-full">
                <thead>
                  <tr className="bg-primary-500 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Service Description
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billData.services.map((service, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">
                        {service.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">
                        {service.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        ₹{service.unitCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        ₹{service.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total section */}
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-primary-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MoneyIcon className="w-6 h-6 text-primary-500 mr-2" />
                <span className="text-lg font-medium text-gray-900">Subtotal:</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                ₹{billData.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ₹{billData.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment status and actions */}
          <div className="mt-8 no-print">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-700">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    billData.paymentStatus === 'Paid' 
                      ? 'bg-success-100 text-success-800 border border-success-200' 
                      : 'bg-warning-100 text-warning-800 border border-warning-200'
                  }`}>
                    {billData.paymentStatus === 'Paid' && <CheckIcon className="w-4 h-4 inline mr-1" />}
                    {billData.paymentStatus}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handlePaymentStatusUpdate('Paid')}
                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      billData.paymentStatus === 'Paid'
                        ? 'bg-success-500 text-white cursor-default'
                        : 'bg-success-100 text-success-700 hover:bg-success-200 focus:ring-success-500'
                    }`}
                    disabled={billData.paymentStatus === 'Paid'}
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => handlePaymentStatusUpdate('Unpaid')}
                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      billData.paymentStatus === 'Unpaid'
                        ? 'bg-warning-500 text-white cursor-default'
                        : 'bg-warning-100 text-warning-700 hover:bg-warning-200 focus:ring-warning-500'
                    }`}
                    disabled={billData.paymentStatus === 'Unpaid'}
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    Mark as Unpaid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment methods icons */}
          <div className="mt-6 text-center text-gray-500 no-print">
            <p className="text-sm mb-3">Accepted Payment Methods</p>
            <div className="flex justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span className="text-xs">Cash</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span className="text-xs">Card</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-xs">Digital</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDisplay;