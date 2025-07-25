import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorProvider, useError } from '../ErrorContext';

// Test component to use the error context
const TestComponent = () => {
  const { 
    errors, 
    addError, 
    removeError, 
    clearErrors, 
    handleApiError,
    handleValidationError 
  } = useError();

  return (
    <div>
      <div data-testid="error-count">{errors.length}</div>
      <div data-testid="errors">
        {errors.map(error => (
          <div key={error.id} data-testid={`error-${error.id}`}>
            {error.message}
          </div>
        ))}
      </div>
      <button onClick={() => addError('Test error')}>Add Error</button>
      <button onClick={() => addError('Persistent error', { persistent: true })}>
        Add Persistent Error
      </button>
      <button onClick={() => removeError(errors[0]?.id)}>Remove First Error</button>
      <button onClick={clearErrors}>Clear All Errors</button>
      <button onClick={() => handleApiError({ 
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } 
      })}>
        Handle API Error
      </button>
      <button onClick={() => handleValidationError({ 
        name: 'Name is required', 
        email: 'Invalid email' 
      })}>
        Handle Validation Error
      </button>
    </div>
  );
};

describe('ErrorContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('provides error context to children', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  test('adds and displays errors', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('auto-removes non-persistent errors after timeout', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });

  test('keeps persistent errors', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Add Persistent Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Persistent error should still be there
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  test('removes specific errors', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Add Error').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('2');

    act(() => {
      screen.getByText('Remove First Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  test('clears all errors', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Add Error').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('2');

    act(() => {
      screen.getByText('Clear All Errors').click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  test('handles API errors with user-friendly messages', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Handle API Error').click();
    });

    expect(screen.getByText('Please check your input and try again')).toBeInTheDocument();
  });

  test('handles validation errors', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    act(() => {
      screen.getByText('Handle Validation Error').click();
    });

    expect(screen.getByText(/Validation failed:/)).toBeInTheDocument();
    expect(screen.getByText(/name: Name is required/)).toBeInTheDocument();
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useError must be used within an ErrorProvider');

    console.error = originalError;
  });
});