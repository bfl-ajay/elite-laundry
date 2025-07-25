import { useState, useCallback, useRef } from 'react';
import { useError } from '../contexts/ErrorContext';

const useRetryableOperation = ({
  maxRetries = 3,
  retryDelay = 1000,
  backoffMultiplier = 2,
  onSuccess,
  onError,
  errorContext = 'Operation'
} = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const { handleApiError } = useError();
  const abortControllerRef = useRef(null);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = useCallback(async (operation, ...args) => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    let currentRetry = 0;

    while (currentRetry <= maxRetries) {
      try {
        // Check if operation was cancelled
        if (signal.aborted) {
          throw new Error('Operation cancelled');
        }

        // Update progress
        setProgress((currentRetry / (maxRetries + 1)) * 100);
        setRetryCount(currentRetry);

        // Execute the operation
        const result = await operation(...args, { signal });
        
        // Success
        setProgress(100);
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err) {
        // Check if operation was cancelled
        if (signal.aborted || err.name === 'AbortError') {
          setIsLoading(false);
          setError(null);
          setProgress(0);
          return;
        }

        currentRetry++;
        
        if (currentRetry > maxRetries) {
          // Final failure
          setIsLoading(false);
          setError(err);
          setProgress(0);
          
          if (onError) {
            onError(err);
          } else {
            handleApiError(err, errorContext);
          }
          
          throw err;
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(backoffMultiplier, currentRetry - 1);
        await sleep(delay);
      }
    }
  }, [maxRetries, retryDelay, backoffMultiplier, onSuccess, onError, errorContext, handleApiError]);

  const retry = useCallback(() => {
    if (error) {
      setError(null);
      setRetryCount(0);
      // Note: This requires the last operation to be stored, which would need additional state
      // For now, this is a placeholder for manual retry functionality
    }
  }, [error]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setError(null);
    setProgress(0);
    setRetryCount(0);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setError(null);
    setRetryCount(0);
    setProgress(0);
  }, [cancel]);

  return {
    execute,
    retry,
    cancel,
    reset,
    isLoading,
    error,
    retryCount,
    progress,
    canRetry: !isLoading && error && retryCount < maxRetries
  };
};

export default useRetryableOperation;