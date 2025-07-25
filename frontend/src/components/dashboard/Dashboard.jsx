import React, { useState } from 'react';
import BusinessMetrics from './BusinessMetrics';
import ExpenseMetrics from './ExpenseMetrics';
import TimeFilter from './TimeFilter';
import { DashboardIllustration } from '../../assets/icons/laundry-icons';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="animate-bounce-gentle">
              <DashboardIllustration className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 animate-slide-up">Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Monitor your laundry business performance
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <TimeFilter onPeriodChange={handlePeriodChange} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <BusinessMetrics period={selectedPeriod} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <ExpenseMetrics period={selectedPeriod} />
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="bg-surface rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <a
                href="/orders"
                className="flex flex-col items-center p-3 sm:p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">View Orders</span>
              </a>
              
              <a
                href="/orders"
                className="flex flex-col items-center p-3 sm:p-4 bg-accent-50 rounded-lg hover:bg-accent-100 transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-500 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">New Order</span>
              </a>
              
              <a
                href="/expenses"
                className="flex flex-col items-center p-3 sm:p-4 bg-success-50 rounded-lg hover:bg-success-100 transition-all duration-200 transform hover:scale-105 hover:shadow-md group col-span-2 sm:col-span-1"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-500 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Add Expense</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;