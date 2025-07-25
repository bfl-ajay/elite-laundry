import React from 'react';
import { useError } from '../../contexts/ErrorContext';
import { 
  AlertTriangleIcon, 
  InfoIcon, 
  CheckCircleIcon, 
  XIcon 
} from '../../assets/icons/laundry-icons';

const ErrorNotification = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangleIcon className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5" />;
      case 'info':
        return <InfoIcon className="w-5 h-5" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <AlertTriangleIcon className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`
            border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out
            ${getColorClasses(error.type)}
          `}
        >
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getIconColor(error.type)}`}>
              {getIcon(error.type)}
            </div>
            
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {error.message}
              </p>
              
              {error.details && (
                <div className="mt-2 text-xs opacity-75">
                  <pre className="whitespace-pre-wrap">
                    {typeof error.details === 'string' 
                      ? error.details 
                      : JSON.stringify(error.details, null, 2)
                    }
                  </pre>
                </div>
              )}
              
              {error.action && (
                <div className="mt-3">
                  <button
                    onClick={error.action.onClick}
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    {error.action.label}
                  </button>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeError(error.id)}
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  hover:bg-black hover:bg-opacity-10 transition-colors
                  ${getIconColor(error.type)}
                `}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;