import React, { useState, useEffect } from 'react';
import { MoneyIcon, ExpenseIllustration, ChartIcon } from '../../assets/icons/laundry-icons';
import { analyticsService } from '../../services';

const ExpenseMetrics = ({ period = 'monthly' }) => {
  const [expenses, setExpenses] = useState({
    totalExpenses: 0,
    dailyExpenses: 0,
    weeklyExpenses: 0,
    monthlyExpenses: 0
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    fetchExpenseMetrics();
  }, [period]);

  useEffect(() => {
    // Animate total expense number
    if (!loading && expenses.totalExpenses !== animatedTotal) {
      animateTotal();
    }
  }, [expenses.totalExpenses, loading]);

  const fetchExpenseMetrics = async () => {
    try {
      setLoading(true);
      const [metricsData, analyticsData] = await Promise.all([
        analyticsService.getExpenseMetrics(),
        analyticsService.getExpenseAnalytics({ period })
      ]);
      
      setExpenses(metricsData);
      
      // Process expense breakdown if available
      if (analyticsData?.data?.typeBreakdown) {
        setExpenseBreakdown(analyticsData.data.typeBreakdown.slice(0, 3)); // Top 3 expense types
      }
    } catch (error) {
      console.error('Error fetching expense metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateTotal = () => {
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    const startValue = animatedTotal;
    const endValue = expenses.totalExpenses;
    const difference = endValue - startValue;
    const stepValue = difference / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newValue = startValue + (stepValue * currentStep);
      
      setAnimatedTotal(currentStep === steps ? endValue : newValue);

      if (currentStep === steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  };

  const getPeriodExpense = () => {
    switch (period) {
      case 'daily':
        return expenses.dailyExpenses;
      case 'weekly':
        return expenses.weeklyExpenses;
      case 'monthly':
        return expenses.monthlyExpenses;
      default:
        return expenses.monthlyExpenses;
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ExpenseIllustration className="w-8 h-8 mr-2 animate-bounce-gentle" />
          Expense Analytics
        </h2>
        <div className="text-sm text-gray-500 capitalize">
          {period} View
        </div>
      </div>

      <div className="space-y-4">
        {/* Total Expenses Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-error-50 to-error-100 rounded-lg p-4 hover:from-error-100 hover:to-error-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-error-500 rounded-lg">
                <MoneyIcon className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-error-700 font-medium">Total Expenses</span>
            </div>
            <span className="text-2xl font-bold text-error-700">
              ₹{animatedTotal.toFixed(2)}
            </span>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-error-200 rounded-full opacity-20"></div>
          <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-error-300 rounded-full opacity-30"></div>
        </div>

        {/* Period Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105">
            <div className="w-8 h-8 bg-primary-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <ChartIcon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-gray-600 capitalize">{period}</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{getPeriodExpense().toFixed(2)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-b from-accent-50 to-accent-100 rounded-lg hover:from-accent-100 hover:to-accent-200 transition-all duration-300 transform hover:scale-105">
            <div className="w-8 h-8 bg-accent-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AVG</span>
            </div>
            <p className="text-sm text-accent-600">Average</p>
            <p className="text-lg font-semibold text-accent-700">
              ₹{expenses.totalExpenses > 0 ? (expenses.totalExpenses / 30).toFixed(2) : '0.00'}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-b from-warning-50 to-warning-100 rounded-lg hover:from-warning-100 hover:to-warning-200 transition-all duration-300 transform hover:scale-105">
            <div className="w-8 h-8 bg-warning-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-xs">%</span>
            </div>
            <p className="text-sm text-warning-600">Growth</p>
            <p className="text-lg font-semibold text-warning-700">
              +12.5%
            </p>
          </div>
        </div>

        {/* Expense Breakdown */}
        {expenseBreakdown.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ChartIcon className="w-4 h-4 text-gray-500 mr-1" />
              Top Expense Categories
            </h3>
            <div className="space-y-2">
              {expenseBreakdown.map((expense, index) => (
                <div key={expense.expenseType} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        index === 0 ? 'bg-error-500' : 
                        index === 1 ? 'bg-warning-500' : 'bg-accent-500'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600 capitalize">
                      {expense.expenseType}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{parseFloat(expense.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseMetrics;