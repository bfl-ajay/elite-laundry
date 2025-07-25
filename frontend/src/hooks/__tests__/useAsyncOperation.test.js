import { renderHook, act } from '@testing-library/react';
import useAsyncOperation from '../useAsyncOperation';
import { ErrorProvider } from '../../contexts/ErrorContext';

// Mock the error context
const mockHandleApiError = jest.fn();
jest.mock('../../contexts/ErrorContext', () => ({
  ...jest.requireActual('../../contexts/ErrorContext'),
  useError: () => ({
    handleApiError: mockHandleApiError
  })
}));

describe('useAsyncOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useAsyncOperation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  test('handles successful async operation', async () => {
    const mockAsyncFn = jest.fn().mockResolvedValue('success data');
    const mockOnSuccess = jest.fn();
    
    const { result } = renderHook(() => 
      useAsyncOperation({ onSuccess: mockOnSuccess })
    );

    await act(async () => {
      const data = await result.current.execute(mockAsyncFn);
      expect(data).toBe('success data');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('success data');
    expect(mockOnSuccess).toHaveBeenCalledWith('success data');
  });

  test('handles failed async operation', async () => {
    const mockError = new Error('Test error');
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();
    
    const { result } = renderHook(() => 
      useAsyncOperation({ 
        onError: mockOnError,
        errorContext: 'Test operation'
      })
    );

    await act(async () => {
      try {
        await result.current.execute(mockAsyncFn);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
    expect(mockHandleApiError).toHaveBeenCalledWith(mockError, 'Test operation');
  });

  test('sets loading state during operation', async () => {
    let resolvePromise;
    const mockAsyncFn = jest.fn(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));
    
    const { result } = renderHook(() => useAsyncOperation());

    // Start async operation
    act(() => {
      result.current.execute(mockAsyncFn);
    });

    expect(result.current.loading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise('data');
    });

    expect(result.current.loading).toBe(false);
  });

  test('cancels ongoing operation', async () => {
    const mockAsyncFn = jest.fn((signal) => 
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('AbortError')));
      })
    );
    
    const { result } = renderHook(() => useAsyncOperation());

    // Start operation
    act(() => {
      result.current.execute(mockAsyncFn);
    });

    expect(result.current.loading).toBe(true);

    // Cancel operation
    act(() => {
      result.current.cancel();
    });

    // Should not handle aborted requests as errors
    expect(mockHandleApiError).not.toHaveBeenCalled();
  });

  test('resets state correctly', () => {
    const { result } = renderHook(() => useAsyncOperation());

    // Set some state
    act(() => {
      result.current.execute(jest.fn().mockResolvedValue('data'));
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  test('does not show error notification when disabled', async () => {
    const mockError = new Error('Test error');
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() => 
      useAsyncOperation({ showErrorNotification: false })
    );

    await act(async () => {
      try {
        await result.current.execute(mockAsyncFn);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(mockHandleApiError).not.toHaveBeenCalled();
  });
});