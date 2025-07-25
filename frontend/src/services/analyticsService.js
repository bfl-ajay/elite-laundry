import api from './api';

class AnalyticsService {
  // Get business metrics
  async getBusinessMetrics(period = 'monthly') {
    try {
      const params = new URLSearchParams();
      params.append('period', period);

      const response = await api.get(`/analytics/business?${params.toString()}`);
      const data = response.data.data;
      
      return {
        totalRevenue: data.overall?.totalRevenue || 0,
        totalOrders: data.overall?.totalOrders || 0,
        completedOrders: data.overall?.completedOrders || 0,
        pendingOrders: data.overall?.pendingOrders || 0,
        averageOrderValue: data.overall?.averageOrderValue || 0
      };
    } catch (error) {
      console.error('Get business metrics error:', error);
      // Return default values on error
      return {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0
      };
    }
  }

  // Get expense metrics
  async getExpenseMetrics() {
    try {
      const response = await api.get('/analytics/expenses');
      const data = response.data.data;
      
      // Calculate daily, weekly, monthly from time series data
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return {
        totalExpenses: data.overall?.totalAmount || 0,
        dailyExpenses: data.overall?.totalAmount || 0, // Simplified for now
        weeklyExpenses: data.overall?.totalAmount || 0,
        monthlyExpenses: data.overall?.totalAmount || 0
      };
    } catch (error) {
      console.error('Get expense metrics error:', error);
      // Return default values on error
      return {
        totalExpenses: 0,
        dailyExpenses: 0,
        weeklyExpenses: 0,
        monthlyExpenses: 0
      };
    }
  }

  // Get business analytics (legacy method)
  async getBusinessAnalytics(filters = {}) {
    return this.getBusinessMetrics(filters.period);
  }

  // Get expense analytics (legacy method)
  async getExpenseAnalytics(filters = {}) {
    return this.getExpenseMetrics();
  }

  // Get combined dashboard data
  async getDashboardData(filters = {}) {
    try {
      const [businessData, expenseData] = await Promise.all([
        this.getBusinessAnalytics(filters),
        this.getExpenseAnalytics(filters)
      ]);

      return {
        success: true,
        data: {
          business: businessData.data,
          expenses: expenseData.data
        }
      };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw error;
    }
  }

  // Helper method to calculate growth percentage
  calculateGrowth(current, previous) {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  // Helper method to format percentage
  formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
  }

  // Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Helper method to format large numbers
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Get date range for period
  getDateRangeForPeriod(period) {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 84); // Last 12 weeks
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  // Process time series data for charts
  processTimeSeriesData(timeSeries, period) {
    if (!timeSeries || timeSeries.length === 0) {
      return [];
    }

    return timeSeries.map(item => ({
      ...item,
      formattedPeriod: this.formatPeriodLabel(item.period, period),
      revenue: parseFloat(item.revenue || 0),
      totalAmount: parseFloat(item.totalAmount || 0)
    }));
  }

  // Format period label for display
  formatPeriodLabel(period, periodType) {
    const date = new Date(period);
    
    switch (periodType) {
      case 'daily':
        return date.toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'weekly':
        return `Week ${period.split('W')[1]}`;
      case 'monthly':
        return date.toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'short' 
        });
      default:
        return period;
    }
  }

  // Calculate completion rate
  calculateCompletionRate(completed, total) {
    if (total === 0) return 0;
    return (completed / total) * 100;
  }

  // Get trend direction
  getTrendDirection(current, previous) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  // Process service breakdown data
  processServiceBreakdown(serviceBreakdown) {
    if (!serviceBreakdown || serviceBreakdown.length === 0) {
      return [];
    }

    const total = serviceBreakdown.reduce((sum, item) => sum + parseFloat(item.totalRevenue || 0), 0);

    return serviceBreakdown.map(item => ({
      ...item,
      totalRevenue: parseFloat(item.totalRevenue || 0),
      percentage: total > 0 ? ((parseFloat(item.totalRevenue || 0) / total) * 100) : 0,
      formattedRevenue: this.formatCurrency(parseFloat(item.totalRevenue || 0))
    }));
  }

  // Process expense type breakdown
  processExpenseBreakdown(typeBreakdown) {
    if (!typeBreakdown || typeBreakdown.length === 0) {
      return [];
    }

    const total = typeBreakdown.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0);

    return typeBreakdown.map(item => ({
      ...item,
      totalAmount: parseFloat(item.totalAmount || 0),
      averageAmount: parseFloat(item.averageAmount || 0),
      percentage: total > 0 ? ((parseFloat(item.totalAmount || 0) / total) * 100) : 0,
      formattedTotal: this.formatCurrency(parseFloat(item.totalAmount || 0)),
      formattedAverage: this.formatCurrency(parseFloat(item.averageAmount || 0))
    }));
  }
}

export default new AnalyticsService();