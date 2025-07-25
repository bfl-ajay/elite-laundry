import React from 'react';

// Responsive container with consistent padding and max-width
export const ResponsiveContainer = ({ 
  children, 
  className = '',
  size = 'default', // 'sm', 'default', 'lg', 'xl', 'full'
  padding = 'default' // 'none', 'sm', 'default', 'lg'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-2xl';
      case 'default':
        return 'max-w-7xl';
      case 'lg':
        return 'max-w-screen-xl';
      case 'xl':
        return 'max-w-screen-2xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-7xl';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-2 sm:px-4';
      case 'default':
        return 'px-4 sm:px-6 lg:px-8';
      case 'lg':
        return 'px-6 sm:px-8 lg:px-12';
      default:
        return 'px-4 sm:px-6 lg:px-8';
    }
  };

  return (
    <div className={`${getSizeClasses()} mx-auto ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default' // 'sm', 'default', 'lg'
}) => {
  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-3 sm:gap-4';
      case 'default':
        return 'gap-4 sm:gap-6';
      case 'lg':
        return 'gap-6 sm:gap-8';
      default:
        return 'gap-4 sm:gap-6';
    }
  };

  const getColClasses = () => {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = lg } = cols;
    return `grid-cols-${xs} sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl}`;
  };

  return (
    <div className={`grid ${getColClasses()} ${getGapClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive card component with hover effects
export const ResponsiveCard = ({ 
  children, 
  className = '',
  hover = true,
  padding = 'default',
  shadow = 'default'
}) => {
  const getPaddingClasses = () => {
    switch (padding) {
      case 'sm':
        return 'p-3 sm:p-4';
      case 'default':
        return 'p-4 sm:p-6';
      case 'lg':
        return 'p-6 sm:p-8';
      default:
        return 'p-4 sm:p-6';
    }
  };

  const getShadowClasses = () => {
    switch (shadow) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'default':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      default:
        return 'shadow-md';
    }
  };

  const hoverClasses = hover 
    ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]' 
    : '';

  return (
    <div className={`
      bg-surface rounded-lg border border-gray-200 
      ${getPaddingClasses()} 
      ${getShadowClasses()} 
      ${hoverClasses} 
      ${className}
    `}>
      {children}
    </div>
  );
};

// Responsive button component
export const ResponsiveButton = ({ 
  children, 
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'success', 'warning', 'error'
  size = 'default', // 'sm', 'default', 'lg'
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  ...props
}) => {
  const getVariantClasses = () => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 transform hover:scale-105 hover:shadow-md`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 transform hover:scale-105 hover:shadow-md`;
      case 'success':
        return `${baseClasses} bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 transform hover:scale-105 hover:shadow-md`;
      case 'warning':
        return `${baseClasses} bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 transform hover:scale-105 hover:shadow-md`;
      case 'error':
        return `${baseClasses} bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 transform hover:scale-105 hover:shadow-md`;
      default:
        return `${baseClasses} bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 transform hover:scale-105 hover:shadow-md`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'default':
        return 'px-4 py-2 text-sm sm:text-base';
      case 'lg':
        return 'px-6 py-3 text-base sm:text-lg';
      default:
        return 'px-4 py-2 text-sm sm:text-base';
    }
  };

  const widthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = (disabled || loading) 
    ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100 hover:shadow-none' 
    : '';

  return (
    <button
      className={`
        ${getVariantClasses()} 
        ${getSizeClasses()} 
        ${widthClasses} 
        ${disabledClasses} 
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Responsive input component
export const ResponsiveInput = ({ 
  className = '',
  error = false,
  label,
  required = false,
  helpText,
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 sm:px-4 sm:py-2.5 
    border rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent 
    transition-all duration-200
    ${error 
      ? 'border-error-500 bg-error-50 focus:ring-error-500' 
      : 'border-gray-300 hover:border-gray-400'
    }
  `;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {helpText && (
        <p className={`mt-1 text-sm ${error ? 'text-error-600' : 'text-gray-500'}`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Responsive modal component
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'default', // 'sm', 'default', 'lg', 'xl'
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'default':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`
          inline-block w-full ${getSizeClasses()} 
          p-6 my-8 overflow-hidden text-left align-middle 
          transition-all transform bg-white shadow-xl rounded-2xl
          animate-slideIn
          ${className}
        `}>
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveContainer;