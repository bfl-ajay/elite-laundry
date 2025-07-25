import React, { useState } from 'react';
import { ExpenseForm, ExpenseList, Navigation } from '../components';
import { ExpenseIllustration } from '../assets/icons/laundry-icons';

const ExpensesPage = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseCreated = () => {
    setShowExpenseForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <ExpenseIllustration className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-600">Track and manage business expenses</p>
            </div>
          </div>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium"
          >
            {showExpenseForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Expense Form */}
          {showExpenseForm && (
            <ExpenseForm
              onExpenseCreated={handleExpenseCreated}
              onCancel={() => setShowExpenseForm(false)}
            />
          )}

          {/* Expenses List */}
          <ExpenseList refreshTrigger={refreshTrigger} />
        </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;