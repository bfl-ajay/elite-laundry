import React, { useState, useEffect } from 'react';
import { MoneyIcon, FileUploadIcon, DeleteIcon } from '../../assets/icons/laundry-icons';
import { expenseService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

const ExpenseList = ({ refreshTrigger }) => {
  const { canEditExpense } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, filter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getExpenses(filter !== 'all' ? { type: filter } : {});
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const getExpenseTypeColor = (type) => {
    const colors = {
      'Utilities': 'bg-blue-100 text-blue-800',
      'Rent': 'bg-purple-100 text-purple-800',
      'Equipment': 'bg-green-100 text-green-800',
      'Supplies': 'bg-yellow-100 text-yellow-800',
      'Maintenance': 'bg-red-100 text-red-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Transportation': 'bg-indigo-100 text-indigo-800',
      'Insurance': 'bg-gray-100 text-gray-800',
      'Other': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || colors['Other'];
  };

  const uniqueExpenseTypes = [...new Set(expenses.map(expense => expense.expense_type))];

  if (loading) {
    return (
      <div className="bg-surface rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MoneyIcon className="w-6 h-6 text-primary-500 mr-2" />
            Expenses
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            {uniqueExpenseTypes.slice(0, 3).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  filter === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Cards */}
      <div className="p-6">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <MoneyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No expenses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <MoneyIcon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {expense.expense_id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(expense.expense_type)}`}>
                          {expense.expense_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Date: {new Date(expense.expense_date).toLocaleDateString()}</span>
                        {expense.bill_attachment && (
                          <span className="flex items-center">
                            <FileUploadIcon className="w-4 h-4 mr-1" />
                            Attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(expense.amount || 0).toFixed(2)}
                      </p>
                    </div>
                    
                    {canEditExpense() ? (
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-error-500 hover:bg-error-50 rounded-full transition-colors duration-200"
                        title="Delete expense"
                      >
                        <DeleteIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500 text-center px-2">
                        <p>Edit restricted</p>
                        <p>for employees</p>
                      </div>
                    )}
                  </div>
                </div>

                {expense.bill_attachment && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={`/api/expenses/${expense.id}/attachment`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
                    >
                      <FileUploadIcon className="w-4 h-4 mr-1" />
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Total Expenses:</span>
            <span className="text-2xl font-bold text-error-600">
              ₹{expenses.reduce((total, expense) => total + parseFloat(expense.amount || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;