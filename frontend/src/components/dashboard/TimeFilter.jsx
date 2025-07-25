import React, { useState } from 'react';
import { CalendarIcon } from '../../assets/icons/laundry-icons';

const TimeFilter = ({ onPeriodChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const periods = [
    { 
      value: 'daily', 
      label: 'Daily',
      icon: '📅',
      description: 'Last 30 days'
    },
    { 
      value: 'weekly', 
      label: 'Weekly',
      icon: '📊',
      description: 'Last 12 weeks'
    },
    { 
      value: 'monthly', 
      label: 'Monthly',
      icon: '📈',
      description: 'Last 12 months'
    }
  ];

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-gray-600">
        <CalendarIcon className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-medium hidden sm:inline">Time Period:</span>
      </div>
      
      <div className="flex bg-surface rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {periods.map((period, index) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${
              selectedPeriod === period.value
                ? 'bg-accent-500 text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-accent-600'
            } ${
              index === 0 ? 'rounded-l-lg' : 
              index === periods.length - 1 ? 'rounded-r-lg' : ''
            }`}
            title={period.description}
          >
            <div className="flex items-center space-x-1">
              <span className="text-xs">{period.icon}</span>
              <span>{period.label}</span>
            </div>
            
            {/* Active indicator */}
            {selectedPeriod === period.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
            )}
            
            {/* Hover tooltip */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {period.description}
            </div>
          </button>
        ))}
      </div>
      
      {/* Current selection indicator */}
      <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
        <span>Showing:</span>
        <span className="font-medium text-accent-600 capitalize">
          {periods.find(p => p.value === selectedPeriod)?.description}
        </span>
      </div>
    </div>
  );
};

export default TimeFilter;