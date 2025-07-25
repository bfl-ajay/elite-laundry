import React, { useState, useEffect } from 'react';
import { ChartIcon, MoneyIcon, WashingMachineIcon, CheckIcon } from '../../assets/icons/laundry-icons';
import { analyticsService } from '../../services';

const BusinessMetrics = ({ period = 'monthly' }) => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  useEffect(() => {
    // Animate numbers when metrics change
    if (!loading) {
      animateNumbers();
    }
  }, [metrics, loading]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getBusinessMetrics(period);
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateNumbers = () => {
    const duration = 1000; // 1 second
    const steps = 60; // 60 FPS
    const stepDuration = duration / steps;

    Object.keys(metrics).forEach(key => {
      const startValue = animatedValues[key];
      const endValue = metrics[key];
      const difference = endValue - startValue;
      const stepValue = difference / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const newValue = startValue + (stepValue * currentStep);
        
        setAnimatedValues(prev => ({
          ...prev,
          [key]: currentStep === steps ? endValue : newValue
        }));

        if (currentStep === steps) {
          clearInterval(interval);
        }
      }, stepDuration);
    });
  };

  const calculateCompletionRate = () => {
    if (metrics.totalOrders === 0) return 0;
    return (metrics.completedOrders / metrics.totalOrders) * 100;
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ChartIcon className="w-6 h-6 text-primary-500 mr-2 animate-pulse" />
          Business Metrics
        </h2>
        <div className="text-sm text-gray-500 capitalize">
          {period} View
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 hover:from-primary-100 hover:to-primary-200 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-2 bg-primary-500 rounded-lg">
              <MoneyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-primary-600">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-700">
                ₹{animatedValues.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4 hover:from-success-100 hover:to-success-200 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-2 bg-success-500 rounded-lg">
              <WashingMachineIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-success-600">Total Orders</p>
              <p className="text-2xl font-bold text-success-700">
                {Math.round(animatedValues.totalOrders)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg p-4 hover:from-warning-100 hover:to-warning-200 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-2 bg-warning-500 rounded-lg relative">
              <WashingMachineIcon className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning-600 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-warning-600">Pending</p>
              <p className="text-2xl font-bold text-warning-700">
                {Math.round(animatedValues.pendingOrders)}
              </p>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg p-4 hover:from-accent-100 hover:to-accent-200 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-2 bg-accent-500 rounded-lg">
              <MoneyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-accent-600">Avg Order</p>
              <p className="text-2xl font-bold text-accent-700">
                ₹{animatedValues.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate Progress Bar */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <CheckIcon className="w-4 h-4 text-success-500 mr-1" />
            Completion Rate
          </span>
          <span className="text-sm font-bold text-gray-900">
            {calculateCompletionRate().toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${calculateCompletionRate()}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BusinessMetrics;