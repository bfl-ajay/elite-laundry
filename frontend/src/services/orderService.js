import api from './api';

class OrderService {
  // Get all orders with optional filtering
  async getOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.customerName) params.append('customerName', filters.customerName);

      const response = await api.get(`/orders?${params.toString()}`);
      return response.data.data || []; // Extract the data array from the response
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  }

  // Get specific order by ID
  async getOrderById(id) {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  }

  // Create new order
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(id, status) {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(id, paymentStatus) {
    try {
      const response = await api.patch(`/orders/${id}/payment`, { paymentStatus });
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Update payment status error:', error);
      throw error;
    }
  }

  // Update order details
  async updateOrder(id, orderData) {
    try {
      const response = await api.put(`/orders/${id}`, orderData);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Update order error:', error);
      throw error;
    }
  }

  // Delete order
  async deleteOrder(id) {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Delete order error:', error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/orders/statistics?${params.toString()}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Get order statistics error:', error);
      throw error;
    }
  }

  // Helper method to format order data for API
  formatOrderData(formData) {
    return {
      customerName: formData.customerName,
      contactNumber: formData.contactNumber,
      customerAddress: formData.customerAddress || '',
      orderDate: formData.orderDate,
      services: formData.services.map(service => ({
        serviceType: service.serviceType,
        clothType: service.clothType,
        quantity: parseInt(service.quantity),
        unitCost: parseFloat(service.unitCost)
      }))
    };
  }

  // Generate bill for completed order
  async generateBill(id) {
    try {
      const response = await api.get(`/orders/${id}/bill`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Generate bill error:', error);
      throw error;
    }
  }

  // Download PDF bill for an order
  async downloadPdfBill(id) {
    try {
      const response = await api.get(`/orders/${id}/pdf`, {
        responseType: 'blob', // Important for binary data
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-order-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  // Helper method to calculate total amount
  calculateTotalAmount(services) {
    return services.reduce((total, service) => {
      return total + (service.quantity * service.unitCost);
    }, 0);
  }

  // Reject order with reason (Admin/Super Admin only)
  async rejectOrder(id, rejectionReason) {
    try {
      const response = await api.patch(`/orders/${id}/reject`, { rejectionReason });
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Reject order error:', error);
      throw error;
    }
  }

  // Validate order data
  validateOrderData(orderData) {
    const errors = [];

    if (!orderData.customerName?.trim()) {
      errors.push('Customer name is required');
    }

    if (!orderData.contactNumber?.trim()) {
      errors.push('Contact number is required');
    }

    if (!orderData.orderDate) {
      errors.push('Order date is required');
    }

    if (!orderData.services || orderData.services.length === 0) {
      errors.push('At least one service is required');
    }

    orderData.services?.forEach((service, index) => {
      if (!service.serviceType) {
        errors.push(`Service type is required for service ${index + 1}`);
      }
      if (!service.clothType) {
        errors.push(`Cloth type is required for service ${index + 1}`);
      }
      if (!service.quantity || service.quantity <= 0) {
        errors.push(`Valid quantity is required for service ${index + 1}`);
      }
      if (!service.unitCost || service.unitCost <= 0) {
        errors.push(`Valid unit cost is required for service ${index + 1}`);
      }
    });

    return errors;
  }
}

export default new OrderService();