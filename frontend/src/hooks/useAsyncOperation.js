import { useState, useCallback, useRef, useEffect } from 'react';
import { useError } from '../contexts/ErrorContext';

const useAsyncOperation = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { handleApiError } = useError();
  const abortControllerRef = useRef(null);

  const {
    onSuccess,
    onError,
    showErrorNotification = true,
    errorContext = ''
  } = options;

  // Execute async operation
  const execute = useCallback(async (asyncFunction, ...args) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);

      // Execute the async function
      const result = await asyncFunction(...args, {
        signal: abortControllerRef.current.signal
      });

      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Don't handle aborted requests
      if (err.name === 'AbortError') {
        return;
      }

      setError(err);
      
      if (showErrorNotification) {
        handleApiError(err, errorContext);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [onSuccess, onError, showErrorNotification, errorContext, handleApiError]);

  // Reset state
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  // Cancel ongoing operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    cancel
  };
};

// Hook for handling multiple async operations
export const useAsyncOperations = () => {
  const [operations, setOperations] = useState({});

  const createOperation = useCallback((key, options = {}) => {
    const operation = useAsyncOperation(options);
    
    setOperations(prev => ({
      ...prev,
      [key]: operation
    }));

    return operation;
  }, []);

  const getOperation = useCallback((key) => {
    return operations[key];
  }, [operations]);

  const isAnyLoading = Object.values(operations).some(op => op.loading);

  return {
    operations,
    createOperation,
    getOperation,
    isAnyLoading
  };
};

export default useAsyncOperation;