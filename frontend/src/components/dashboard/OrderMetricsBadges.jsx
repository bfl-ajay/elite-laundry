import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChartIcon, 
  WashingMachineIcon, 
  CheckIcon, 
  MoneyIcon,
  ClockIcon 
} from '../../assets/icons/laundry-icons';
import orderService from '../../services/orderService';
import { useResponsive } from '../../hooks/useResponsive';

const OrderMetricsBadges = ({ onFilterChange, activeFilter, loading: externalLoading }) => {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    paidOrders: 0,
    unpaidCompletedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isMobile, isTouch } = useResponsive();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await orderService.getOrderMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching order metrics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBadgeClick = useCallback((filter) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  }, [onFilterChange]);

  const handleKeyDown = useCallback((event, filter) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBadgeClick(filter);
    }
  }, [handleBadgeClick]);

  const badges = useMemo(() => [
    {
      id: 'all',
      label: 'Total Orders',
      value: metrics.totalOrders,
      icon: ChartIcon,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      hoverGradient: 'hover:from-blue-100 hover:to-blue-200',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-500'
    },
    {
      id: 'pending',
      label: 'Pending Orders',
      value: metrics.pendingOrders,
      icon: ClockIcon,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      hoverGradient: 'hover:from-orange-100 hover:to-orange-200',
      textColor: 'text-orange-700',
      iconBg: 'bg-orange-500'
    },
    {
      id: 'completed',
      label: 'Completed Orders',
      value: metrics.completedOrders,
      icon: CheckIcon,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      hoverGradient: 'hover:from-green-100 hover:to-green-200',
      textColor: 'text-green-700',
      iconBg: 'bg-green-500'
    },
    {
      id: 'paid',
      label: 'Paid Orders',
      value: metrics.paidOrders,
      icon: MoneyIcon,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      hoverGradient: 'hover:from-emerald-100 hover:to-emerald-200',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-500'
    },
    {
      id: 'unpaid-completed',
      label: 'Unpaid Completed',
      value: metrics.unpaidCompletedOrders,
      icon: WashingMachineIcon,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      hoverGradient: 'hover:from-red-100 hover:to-red-200',
      textColor: 'text-red-700',
      iconBg: 'bg-red-500'
    }
  ], [metrics]);

  if (loading || externalLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6" data-testid="metrics-grid">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg p-4 h-24">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-5 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading metrics
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={fetchMetrics}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        const isActive = activeFilter === badge.id;
        
        return (
          <button
            key={badge.id}
            onClick={() => handleBadgeClick(badge.id)}
            onKeyDown={(event) => handleKeyDown(event, badge.id)}
            aria-label={`Filter by ${badge.label.toLowerCase()}: ${badge.value} orders`}
            aria-pressed={isActive}
            role="button"
            tabIndex={0}
            className={`
              relative overflow-hidden rounded-lg transition-all duration-300 transform hover:shadow-lg
              ${isMobile ? 'p-3 min-h-[80px]' : 'p-4 hover:scale-105'}
              ${isTouch ? 'active:scale-95' : ''}
              ${isActive 
                ? `bg-gradient-to-br ${badge.gradient} text-white shadow-lg ${!isMobile ? 'scale-105' : ''}` 
                : `bg-gradient-to-br ${badge.bgGradient} ${badge.hoverGradient} ${badge.textColor} hover:shadow-md`
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              animate-fadeIn
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg transition-colors duration-200
                ${isActive ? 'bg-white bg-opacity-20' : badge.iconBg}
              `}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-xs font-medium ${isActive ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                  {badge.label}
                </p>
                <p className={`text-2xl font-bold ${isActive ? 'text-white' : badge.textColor}`}>
                  {badge.value}
                </p>
              </div>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 border-2 border-white border-opacity-30 rounded-lg pointer-events-none"></div>
            )}
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity duration-200 pointer-events-none"></div>
          </button>
        );
      })}
    </div>
  );
};

export default OrderMetricsBadges;