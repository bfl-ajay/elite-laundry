import api from './api';

class ExpenseService {
  // Get all expenses with optional filtering
  async getExpenses(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.expenseType) params.append('expenseType', filters.expenseType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const response = await api.get(`/expenses?${params.toString()}`);
      return response.data.data || []; // Extract the data array from the response
    } catch (error) {
      console.error('Get expenses error:', error);
      throw error;
    }
  }

  // Get specific expense by ID
  async getExpenseById(id) {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Get expense error:', error);
      throw error;
    }
  }

  // Create new expense
  async createExpense(expenseData) {
    try {
      const formData = new FormData();
      
      formData.append('expenseType', expenseData.expenseType);
      formData.append('amount', expenseData.amount);
      formData.append('expenseDate', expenseData.expenseDate);
      
      if (expenseData.billAttachment) {
        formData.append('billAttachment', expenseData.billAttachment);
      }

      const response = await api.post('/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Create expense error:', error);
      throw error;
    }
  }

  // Upload attachment to existing expense
  async uploadAttachment(expenseId, file) {
    try {
      const formData = new FormData();
      formData.append('billAttachment', file);

      const response = await api.post(`/expenses/${expenseId}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Upload attachment error:', error);
      throw error;
    }
  }

  // Update expense details
  async updateExpense(id, expenseData) {
    try {
      const response = await api.put(`/expenses/${id}`, expenseData);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Update expense error:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Delete expense error:', error);
      throw error;
    }
  }

  // Get expense statistics
  async getExpenseStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.expenseType) params.append('expenseType', filters.expenseType);

      const response = await api.get(`/expenses/statistics?${params.toString()}`);
      return response.data.data; // Extract the data from the response
    } catch (error) {
      console.error('Get expense statistics error:', error);
      throw error;
    }
  }

  // Helper method to format expense data for API
  formatExpenseData(formData) {
    return {
      expenseType: formData.expenseType,
      amount: parseFloat(formData.amount),
      expenseDate: formData.expenseDate
    };
  }

  // Validate expense data
  validateExpenseData(expenseData) {
    const errors = [];

    if (!expenseData.expenseType?.trim()) {
      errors.push('Expense type is required');
    }

    if (!expenseData.amount || expenseData.amount <= 0) {
      errors.push('Valid amount is required');
    }

    if (!expenseData.expenseDate) {
      errors.push('Expense date is required');
    }

    return errors;
  }

  // Validate file for upload
  validateFile(file) {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!file) {
      return errors; // File is optional
    }

    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be an image (JPEG, PNG) or PDF');
    }

    return errors;
  }

  // Get file download URL
  getFileUrl(filename) {
    if (!filename) return null;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/bills/${filename}`;
  }

  // Format currency for display
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export default new ExpenseService();