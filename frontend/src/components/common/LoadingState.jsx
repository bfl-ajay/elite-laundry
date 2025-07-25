import React from 'react';
import { LoadingSpinnerIcon, RefreshIcon } from '../../assets/icons/laundry-icons';

const LoadingState = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  className = '',
  showProgress = false,
  progress = 0,
  onRetry = null,
  retryMessage = 'Retry'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 sm:space-y-4 ${className}`}>
      {/* Animated Loading Spinner */}
      <div className="relative">
        <LoadingSpinnerIcon 
          className={`${getSizeClasses()} text-primary-500 animate-spin`} 
        />
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Loading Message */}
      {message && (
        <p className={`${getTextSize()} text-gray-600 font-medium text-center animate-pulse`}>
          {message}
        </p>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <RefreshIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{retryMessage}</span>
        </button>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl max-w-sm w-full animate-slideIn">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Inline loading spinner for buttons and small spaces
export const InlineLoader = ({ 
  size = 'small', 
  className = '', 
  color = 'text-current' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-5 h-5';
      case 'large':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <LoadingSpinnerIcon 
      className={`${getSizeClasses()} ${color} animate-spin ${className}`} 
    />
  );
};

// Enhanced loading skeleton with shimmer effect
export const LoadingSkeleton = ({ 
  lines = 3, 
  className = '',
  animate = true,
  variant = 'default' // 'default', 'card', 'table', 'form'
}) => {
  const getSkeletonContent = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        );
      case 'form':
        return (
          <div className="space-y-4">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={`h-4 bg-gray-200 rounded ${
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`${animate ? 'animate-pulse' : ''} ${className}`}>
      {getSkeletonContent()}
    </div>
  );
};

// Card loading skeleton with enhanced styling
export const CardSkeleton = ({ 
  className = '', 
  showImage = false,
  showActions = false 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 ${className}`}>
      <div className="animate-pulse">
        {showImage && (
          <div className="h-32 sm:h-40 bg-gray-200 rounded-lg mb-4"></div>
        )}
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        {showActions && (
          <div className="flex space-x-3">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pulse loading indicator for buttons
export const ButtonLoader = ({ 
  size = 'small',
  className = '',
  text = 'Loading...'
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <InlineLoader size={size} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

// Page loading with branded animation
export const PageLoader = ({ message = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-primary-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Laundry Management System
        </h2>
        <p className="text-gray-600 animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;