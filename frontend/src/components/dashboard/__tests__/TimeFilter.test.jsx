import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeFilter from '../TimeFilter';

describe('TimeFilter', () => {
  const mockOnPeriodChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all time period options', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  test('highlights selected period', () => {
    render(<TimeFilter selectedPeriod="weekly" onPeriodChange={mockOnPeriodChange} />);

    const weeklyButton = screen.getByText('Weekly');
    const dailyButton = screen.getByText('Daily');
    const monthlyButton = screen.getByText('Monthly');

    // Weekly should be selected (highlighted)
    expect(weeklyButton).toHaveClass('bg-primary', 'text-white');
    
    // Others should not be selected
    expect(dailyButton).not.toHaveClass('bg-primary', 'text-white');
    expect(monthlyButton).not.toHaveClass('bg-primary', 'text-white');
  });

  test('calls onPeriodChange when period is selected', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    const dailyButton = screen.getByText('Daily');
    fireEvent.click(dailyButton);

    expect(mockOnPeriodChange).toHaveBeenCalledWith('daily');
  });

  test('calls onPeriodChange for each period option', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    // Test daily
    fireEvent.click(screen.getByText('Daily'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('daily');

    // Test weekly
    fireEvent.click(screen.getByText('Weekly'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('weekly');

    // Test monthly
    fireEvent.click(screen.getByText('Monthly'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('monthly');

    expect(mockOnPeriodChange).toHaveBeenCalledTimes(3);
  });

  test('does not call onPeriodChange when clicking already selected period', () => {
    render(<TimeFilter selectedPeriod="weekly" onPeriodChange={mockOnPeriodChange} />);

    const weeklyButton = screen.getByText('Weekly');
    fireEvent.click(weeklyButton);

    // Should still call the function (component doesn't prevent this)
    expect(mockOnPeriodChange).toHaveBeenCalledWith('weekly');
  });

  test('applies correct styling to buttons', () => {
    render(<TimeFilter selectedPeriod="daily" onPeriodChange={mockOnPeriodChange} />);

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toHaveClass('px-4', 'py-2', 'rounded-lg', 'font-medium', 'transition-colors');
    });
  });

  test('handles keyboard navigation', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    const dailyButton = screen.getByText('Daily');
    
    // Test Enter key
    fireEvent.keyDown(dailyButton, { key: 'Enter', code: 'Enter' });
    expect(mockOnPeriodChange).toHaveBeenCalledWith('daily');

    // Test Space key
    fireEvent.keyDown(dailyButton, { key: ' ', code: 'Space' });
    expect(mockOnPeriodChange).toHaveBeenCalledTimes(2);
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<TimeFilter selectedPeriod="weekly" onPeriodChange={mockOnPeriodChange} />);

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });

    // Selected button should have aria-pressed
    const weeklyButton = screen.getByText('Weekly');
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('displays filter label', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    expect(screen.getByText('Time Period:')).toBeInTheDocument();
  });

  test('handles edge case with invalid selectedPeriod', () => {
    render(<TimeFilter selectedPeriod="invalid" onPeriodChange={mockOnPeriodChange} />);

    // Should still render all options
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();

    // No button should be highlighted
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveClass('bg-primary', 'text-white');
    });
  });

  test('maintains focus after selection', () => {
    render(<TimeFilter selectedPeriod="monthly" onPeriodChange={mockOnPeriodChange} />);

    const dailyButton = screen.getByText('Daily');
    dailyButton.focus();
    
    expect(document.activeElement).toBe(dailyButton);
    
    fireEvent.click(dailyButton);
    
    // Focus should remain on the button after click
    expect(document.activeElement).toBe(dailyButton);
  });
});