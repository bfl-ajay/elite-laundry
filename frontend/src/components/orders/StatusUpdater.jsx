import React from 'react';
import { CheckIcon, CloseIcon } from '../../assets/icons/laundry-icons';

const StatusUpdater = ({ currentStatus, onStatusUpdate }) => {
  const statuses = [
    { value: 'Pending', label: 'Pending', color: 'warning', icon: null },
    { value: 'Completed', label: 'Completed', color: 'success', icon: CheckIcon }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      'Pending': { bg: 'bg-warning-100', text: 'text-warning-800', border: 'border-warning-200' },
      'Completed': { bg: 'bg-success-100', text: 'text-success-800', border: 'border-success-200' }
    };
    return configs[status] || configs['Pending'];
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium text-gray-700">Status:</span>
      <div className="flex space-x-2">
        {statuses.map((status) => {
          const config = getStatusConfig(status.value);
          const isActive = currentStatus === status.value;
          const Icon = status.icon;
          
          return (
            <button
              key={status.value}
              onClick={() => onStatusUpdate(status.value)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isActive
                  ? `${config.bg} ${config.text} ${config.border} shadow-md`
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 focus:ring-gray-300'
              }`}
            >
              {Icon && <Icon className="w-3 h-3 mr-1" />}
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusUpdater;