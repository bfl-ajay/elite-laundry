import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  // Add a new error
  const addError = useCallback((error, options = {}) => {
    const errorId = Date.now() + Math.random();
    const newError = {
      id: errorId,
      message: error.message || error,
      type: options.type || 'error', // 'error', 'warning', 'info'
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || null,
      timestamp: new Date(),
      persistent: options.persistent || false, // Whether error should auto-dismiss
      action: options.action || null // Optional action button
    };

    setErrors(prev => [...prev, newError]);

    // Auto-dismiss non-persistent errors after 5 seconds
    if (!newError.persistent) {
      setTimeout(() => {
        removeError(errorId);
      }, 5000);
    }

    return errorId;
  }, []);

  // Remove a specific error
  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Handle API errors with user-friendly messages
  const handleApiError = useCallback((error, context = '') => {
    let message = 'An unexpected error occurred';
    let type = 'error';

    if (error?.error) {
      const { code, message: apiMessage, details } = error.error;
      
      switch (code) {
        case 'VALIDATION_ERROR':
          message = 'Please check your input and try again';
          if (details && Array.isArray(details)) {
            message = details.map(d => d.msg).join(', ');
          }
          type = 'warning';
          break;
        case 'AUTHENTICATION_ERROR':
          message = 'Please log in to continue';
          break;
        case 'AUTHORIZATION_ERROR':
          message = 'You do not have permission to perform this action';
          break;
        case 'NOT_FOUND':
        case 'ORDER_NOT_FOUND':
        case 'EXPENSE_NOT_FOUND':
          message = 'The requested item was not found';
          break;
        case 'DATABASE_ERROR':
          message = 'Database error occurred. Please try again later';
          break;
        case 'FILE_UPLOAD_ERROR':
          message = apiMessage || 'File upload failed';
          if (details?.maxSize) {
            message += ` (Maximum size: ${details.maxSize})`;
          }
          break;
        case 'NETWORK_ERROR':
          message = 'Unable to connect to server. Please check your connection';
          break;
        default:
          message = apiMessage || message;
      }
    } else if (error?.message) {
      message = error.message;
    }

    if (context) {
      message = `${context}: ${message}`;
    }

    return addError({ message, code: error?.error?.code }, { type });
  }, [addError]);

  // Handle form validation errors
  const handleValidationError = useCallback((fieldErrors) => {
    const messages = Object.entries(fieldErrors)
      .map(([field, error]) => `${field}: ${error}`)
      .join(', ');
    
    return addError(
      { message: `Validation failed: ${messages}`, code: 'VALIDATION_ERROR' },
      { type: 'warning' }
    );
  }, [addError]);

  const value = {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiError,
    handleValidationError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};