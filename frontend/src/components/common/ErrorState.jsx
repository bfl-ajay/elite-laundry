import React from 'react';
import { 
  AlertTriangleIcon, 
  RefreshIcon, 
  XIcon,
  InfoIcon 
} from '../../assets/icons/laundry-icons';
import { ResponsiveButton } from './ResponsiveContainer';

const ErrorState = ({ 
  error,
  onRetry,
  onDismiss,
  title = 'Something went wrong',
  message,
  type = 'error', // 'error', 'warning', 'info'
  showRetry = true,
  showDismiss = false,
  className = '',
  size = 'default' // 'sm', 'default', 'lg'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-warning-500" />;
      case 'info':
        return <InfoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" />;
      default:
        return <AlertTriangleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-error-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      case 'info':
        return 'bg-primary-50 border-primary-200';
      default:
        return 'bg-error-50 border-error-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-4 space-y-3';
      case 'default':
        return 'p-6 space-y-4';
      case 'lg':
        return 'p-8 space-y-6';
      default:
        return 'p-6 space-y-4';
    }
  };

  const errorMessage = message || error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className={`
      ${getColorClasses()} 
      ${getSizeClasses()} 
      border rounded-lg 
      ${className}
    `}>
      <div className="flex flex-col items-center text-center">
        {/* Error Icon */}
        <div className="mb-4">
          {getIcon()}
        </div>

        {/* Error Title */}
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Error Message */}
        <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md">
          {errorMessage}
        </p>

        {/* Error Details (for development) */}
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="w-full mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-left overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          {showRetry && onRetry && (
            <ResponsiveButton
              onClick={onRetry}
              variant={type === 'error' ? 'error' : 'primary'}
              className="flex items-center justify-center space-x-2"
              fullWidth
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Try Again</span>
            </ResponsiveButton>
          )}
          
          {showDismiss && onDismiss && (
            <ResponsiveButton
              onClick={onDismiss}
              variant="secondary"
              className="flex items-center justify-center space-x-2"
              fullWidth
            >
              <XIcon className="w-4 h-4" />
              <span>Dismiss</span>
            </ResponsiveButton>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline error component for forms and smaller spaces
export const InlineError = ({ 
  error, 
  message, 
  className = '',
  showIcon = true 
}) => {
  const errorMessage = message || error?.message || 'An error occurred';

  return (
    <div className={`flex items-center space-x-2 text-error-600 ${className}`}>
      {showIcon && <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm">{errorMessage}</span>
    </div>
  );
};

// Network error component with specific retry logic
export const NetworkError = ({ 
  onRetry, 
  className = '',
  isRetrying = false 
}) => {
  return (
    <ErrorState
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      showRetry={true}
      className={className}
      error={null}
    >
      {isRetrying && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-primary-600">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Reconnecting...</span>
        </div>
      )}
    </ErrorState>
  );
};

// 404 Not Found error component
export const NotFoundError = ({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  onGoHome,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-8">
        <div className="text-6xl sm:text-8xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">{message}</p>
      </div>
      
      {onGoHome && (
        <ResponsiveButton onClick={onGoHome} size="lg">
          Go to Dashboard
        </ResponsiveButton>
      )}
    </div>
  );
};

// Permission denied error component
export const PermissionError = ({ 
  onLogin,
  className = ''
}) => {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to access this resource. Please log in with appropriate credentials."
      type="warning"
      showRetry={false}
      className={className}
    >
      {onLogin && (
        <div className="mt-4">
          <ResponsiveButton onClick={onLogin} variant="primary">
            Log In
          </ResponsiveButton>
        </div>
      )}
    </ErrorState>
  );
};

// Validation error component for forms
export const ValidationError = ({ 
  errors = [], 
  className = '' 
}) => {
  if (!errors.length) return null;

  return (
    <div className={`bg-error-50 border border-error-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangleIcon className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-error-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="text-sm text-error-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start space-x-1">
                <span className="text-error-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;