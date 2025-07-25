import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorProvider } from '../../../contexts/ErrorContext';
import OrderForm from '../OrderForm';

// Mock the order service
jest.mock('../../../services', () => ({
  orderService: {
    createOrder: jest.fn()
  }
}));

const { orderService } = require('../../../services');

const renderWithProviders = (component) => {
  return render(
    <ErrorProvider>
      {component}
    </ErrorProvider>
  );
};

describe('OrderForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays validation errors when form is submitted with invalid data', async () => {
    const mockOnOrderCreated = jest.fn();
    
    renderWithProviders(
      <OrderForm onOrderCreated={mockOnOrderCreated} />
    );

    // Try to submit form without filling required fields
    const submitButton = screen.getByText('Create Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    expect(mockOnOrderCreated).not.toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    const mockError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid order data',
        details: [{ msg: 'Customer name is too short' }]
      }
    };
    
    orderService.createOrder.mockRejectedValue(mockError);
    
    const mockOnOrderCreated = jest.fn();
    
    renderWithProviders(
      <OrderForm onOrderCreated={mockOnOrderCreated} />
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/contact number/i), {
      target: { value: '1234567890' }
    });

    // Add a service
    fireEvent.click(screen.getByText('Add Service'));
    
    // Submit form
    const submitButton = screen.getByText('Create Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Error should be handled by error context and displayed
      expect(screen.getByText(/Customer name is too short/)).toBeInTheDocument();
    });

    expect(mockOnOrderCreated).not.toHaveBeenCalled();
  });

  test('successfully creates order with valid data', async () => {
    const mockOrderData = {
      id: 1,
      orderNumber: 'ORD123',
      customerName: 'John Doe',
      contactNumber: '1234567890'
    };
    
    orderService.createOrder.mockResolvedValue({ data: mockOrderData });
    
    const mockOnOrderCreated = jest.fn();
    
    renderWithProviders(
      <OrderForm onOrderCreated={mockOnOrderCreated} />
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/contact number/i), {
      target: { value: '1234567890' }
    });

    // Add a service
    fireEvent.click(screen.getByText('Add Service'));
    
    // Fill service details
    const serviceSelects = screen.getAllByRole('combobox');
    fireEvent.change(serviceSelects[0], { target: { value: 'washing' } });
    fireEvent.change(serviceSelects[1], { target: { value: 'normal' } });
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const costInput = screen.getByLabelText(/unit cost/i);
    fireEvent.change(costInput, { target: { value: '10' } });

    // Submit form
    const submitButton = screen.getByText('Create Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnOrderCreated).toHaveBeenCalled();
    });

    expect(orderService.createOrder).toHaveBeenCalledWith({
      customerName: 'John Doe',
      contactNumber: '1234567890',
      orderDate: expect.any(String),
      services: [{
        serviceType: 'washing',
        clothType: 'normal',
        quantity: 5,
        unitCost: 10
      }]
    });
  });

  test('shows loading state during form submission', async () => {
    // Create a promise that we can control
    let resolvePromise;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    orderService.createOrder.mockReturnValue(mockPromise);
    
    const mockOnOrderCreated = jest.fn();
    
    renderWithProviders(
      <OrderForm onOrderCreated={mockOnOrderCreated} />
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/contact number/i), {
      target: { value: '1234567890' }
    });

    // Add a service
    fireEvent.click(screen.getByText('Add Service'));

    // Submit form
    const submitButton = screen.getByText('Create Order');
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise({ data: { id: 1 } });

    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });
});