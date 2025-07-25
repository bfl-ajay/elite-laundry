import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderDetails from '../OrderDetails';

describe('OrderDetails', () => {
  const mockOrder = {
    id: 1,
    orderNumber: 'ORD001',
    customerName: 'John Doe',
    contactNumber: '1234567890',
    orderDate: '2024-01-15',
    status: 'Completed',
    totalAmount: 275.00,
    paymentStatus: 'Paid',
    services: [
      {
        id: 1,
        serviceType: 'washing',
        clothType: 'normal',
        quantity: 5,
        unitCost: 15.00,
        totalCost: 75.00
      },
      {
        id: 2,
        serviceType: 'ironing',
        clothType: 'saari',
        quantity: 8,
        unitCost: 25.00,
        totalCost: 200.00
      }
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  };

  const mockProps = {
    order: mockOrder,
    onClose: jest.fn(),
    onStatusUpdate: jest.fn(),
    onPaymentUpdate: jest.fn(),
    onGenerateBill: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders order details correctly', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Order Details')).toBeInTheDocument();
    expect(screen.getByText('ORD001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  test('displays service details correctly', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('washing')).toBeInTheDocument();
    expect(screen.getByText('normal')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();

    expect(screen.getByText('ironing')).toBeInTheDocument();
    expect(screen.getByText('saari')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  test('displays total amount correctly', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('$275.00')).toBeInTheDocument();
  });

  test('shows status badge with correct styling', () => {
    render(<OrderDetails {...mockProps} />);

    const statusBadge = screen.getByText('Completed');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('shows payment status badge with correct styling', () => {
    render(<OrderDetails {...mockProps} />);

    const paymentBadge = screen.getByText('Paid');
    expect(paymentBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('calls onClose when close button is clicked', () => {
    render(<OrderDetails {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('shows status update button for pending orders', () => {
    const pendingOrder = { ...mockOrder, status: 'Pending' };
    render(<OrderDetails {...mockProps} order={pendingOrder} />);

    expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
  });

  test('shows payment update button for unpaid orders', () => {
    const unpaidOrder = { ...mockOrder, paymentStatus: 'Unpaid' };
    render(<OrderDetails {...mockProps} order={unpaidOrder} />);

    expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
  });

  test('shows generate bill button for completed orders', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Generate Bill')).toBeInTheDocument();
  });

  test('calls onStatusUpdate when status button is clicked', () => {
    const pendingOrder = { ...mockOrder, status: 'Pending' };
    render(<OrderDetails {...mockProps} order={pendingOrder} />);

    const statusButton = screen.getByText('Mark as Completed');
    fireEvent.click(statusButton);

    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith(mockOrder.id, 'Completed');
  });

  test('calls onPaymentUpdate when payment button is clicked', () => {
    const unpaidOrder = { ...mockOrder, paymentStatus: 'Unpaid' };
    render(<OrderDetails {...mockProps} order={unpaidOrder} />);

    const paymentButton = screen.getByText('Mark as Paid');
    fireEvent.click(paymentButton);

    expect(mockProps.onPaymentUpdate).toHaveBeenCalledWith(mockOrder.id, 'Paid');
  });

  test('calls onGenerateBill when generate bill button is clicked', () => {
    render(<OrderDetails {...mockProps} />);

    const billButton = screen.getByText('View Bill');
    fireEvent.click(billButton);

    expect(mockProps.onGenerateBill).toHaveBeenCalledWith(mockOrder.id);
  });

  test('shows PDF download button for completed orders', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  test('PDF download button shows loading state when clicked', async () => {
    // Mock the orderService.downloadPdfBill method
    const mockDownloadPdfBill = jest.fn().mockResolvedValue({ success: true });
    jest.doMock('../../../services/orderService', () => ({
      downloadPdfBill: mockDownloadPdfBill,
      getOrderById: jest.fn().mockResolvedValue(mockOrder)
    }));

    render(<OrderDetails {...mockProps} />);

    const pdfButton = screen.getByText('Download PDF');
    fireEvent.click(pdfButton);

    // Should show loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  test('displays timestamps correctly', () => {
    render(<OrderDetails {...mockProps} />);

    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Updated:')).toBeInTheDocument();
  });

  test('handles missing services gracefully', () => {
    const orderWithoutServices = { ...mockOrder, services: [] };
    render(<OrderDetails {...mockProps} order={orderWithoutServices} />);

    expect(screen.getByText('No services found')).toBeInTheDocument();
  });

  test('calculates service totals correctly', () => {
    render(<OrderDetails {...mockProps} />);

    // Should show individual service totals
    expect(screen.getByText('$75.00')).toBeInTheDocument(); // 5 * 15.00
    expect(screen.getByText('$200.00')).toBeInTheDocument(); // 8 * 25.00
  });

  test('displays service type icons', () => {
    render(<OrderDetails {...mockProps} />);

    // Check for service type representations
    expect(screen.getByText('washing')).toBeInTheDocument();
    expect(screen.getByText('ironing')).toBeInTheDocument();
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<OrderDetails {...mockProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  test('handles keyboard navigation', () => {
    render(<OrderDetails {...mockProps} />);

    const dialog = screen.getByRole('dialog');
    
    // Test Escape key
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('prevents background scroll when modal is open', () => {
    render(<OrderDetails {...mockProps} />);

    // Check if modal overlay exists
    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  test('displays order number prominently', () => {
    render(<OrderDetails {...mockProps} />);

    const orderNumber = screen.getByText('ORD001');
    expect(orderNumber).toHaveClass('text-xl', 'font-bold');
  });

  test('shows different actions based on order status', () => {
    // Test with pending order
    const pendingOrder = { ...mockOrder, status: 'Pending', paymentStatus: 'Unpaid' };
    const { rerender } = render(<OrderDetails {...mockProps} order={pendingOrder} />);

    expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    expect(screen.queryByText('Generate Bill')).not.toBeInTheDocument();

    // Test with completed order
    rerender(<OrderDetails {...mockProps} order={mockOrder} />);

    expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    expect(screen.getByText('Generate Bill')).toBeInTheDocument();
  });
});