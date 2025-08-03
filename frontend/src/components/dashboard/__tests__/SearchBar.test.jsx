import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SearchBar from '../SearchBar';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('SearchBar', () => {
  const mockProps = {
    onSearchChange: jest.fn(),
    searchQuery: '',
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Rendering', () => {
    it('renders search input with correct placeholder', () => {
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders search icon', () => {
      render(<SearchBar {...mockProps} />);
      
      const searchIcon = screen.getByTestId('search-icon');
      expect(searchIcon).toBeInTheDocument();
    });

    it('displays current search query value', () => {
      render(<SearchBar {...mockProps} searchQuery="John Doe" />);
      
      const input = screen.getByDisplayValue('John Doe');
      expect(input).toBeInTheDocument();
    });

    it('shows clear button when search query exists', () => {
      render(<SearchBar {...mockProps} searchQuery="test query" />);
      
      const clearButton = screen.getByTitle('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('hides clear button when search query is empty', () => {
      render(<SearchBar {...mockProps} searchQuery="" />);
      
      const clearButton = screen.queryByTitle('Clear search');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading is true', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('hides search icon when loading', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      const searchIcon = screen.queryByTestId('search-icon');
      expect(searchIcon).not.toBeInTheDocument();
    });

    it('shows search icon when not loading', () => {
      render(<SearchBar {...mockProps} loading={false} />);
      
      const searchIcon = screen.getByTestId('search-icon');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('updates input value on typing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, 'John');
      expect(input).toHaveValue('John');
    });

    it('calls onSearchChange after debounce delay', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, 'John');
      
      // Should not call immediately
      expect(mockProps.onSearchChange).not.toHaveBeenCalled();
      
      // Advance timers by debounce delay (300ms)
      jest.advanceTimersByTime(300);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('John');
    });

    it('debounces multiple rapid keystrokes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, 'J');
      jest.advanceTimersByTime(100);
      
      await user.type(input, 'o');
      jest.advanceTimersByTime(100);
      
      await user.type(input, 'h');
      jest.advanceTimersByTime(100);
      
      await user.type(input, 'n');
      
      // Should not have called onSearchChange yet
      expect(mockProps.onSearchChange).not.toHaveBeenCalled();
      
      // Advance by full debounce delay
      jest.advanceTimersByTime(300);
      
      // Should only call once with final value
      expect(mockProps.onSearchChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('John');
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} searchQuery="test query" />);
      
      const clearButton = screen.getByTitle('Clear search');
      await user.click(clearButton);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('clears search on Escape key', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} searchQuery="test query" />);
      
      const input = screen.getByDisplayValue('test query');
      input.focus();
      
      await user.keyboard('{Escape}');
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
    });

    it('does not clear empty search on Escape', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} searchQuery="" />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      input.focus();
      
      await user.keyboard('{Escape}');
      
      expect(mockProps.onSearchChange).not.toHaveBeenCalled();
    });

    it('focuses input on forward slash key (global shortcut)', () => {
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      // Simulate global keydown event
      fireEvent.keyDown(document, { key: '/', code: 'Slash' });
      
      expect(input).toHaveFocus();
    });

    it('prevents default behavior on forward slash shortcut', () => {
      render(<SearchBar {...mockProps} />);
      
      const event = new KeyboardEvent('keydown', { key: '/', code: 'Slash' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      fireEvent(document, event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('applies focus styles when input is focused', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} />);
      
      const container = screen.getByPlaceholderText('Search by customer name or contact number...').parentElement;
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.click(input);
      
      expect(container).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('removes focus styles when input loses focus', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} />);
      
      const container = screen.getByPlaceholderText('Search by customer name or contact number...').parentElement;
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.click(input);
      expect(container).toHaveClass('ring-2', 'ring-blue-500');
      
      await user.tab(); // Move focus away
      expect(container).not.toHaveClass('ring-2', 'ring-blue-500');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByLabelText('Search orders');
      expect(input).toBeInTheDocument();
    });

    it('has proper role for search input', () => {
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('clear button has proper accessibility attributes', () => {
      render(<SearchBar {...mockProps} searchQuery="test" />);
      
      const clearButton = screen.getByTitle('Clear search');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
      expect(clearButton).toHaveAttribute('type', 'button');
    });

    it('loading spinner has proper accessibility attributes', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Searching...');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const longQuery = 'a'.repeat(1000);
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, longQuery);
      jest.advanceTimersByTime(300);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith(longQuery);
    });

    it('handles special characters in search query', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const specialQuery = "O'Connor & Sons (123) 456-7890";
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, specialQuery);
      jest.advanceTimersByTime(300);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith(specialQuery);
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, '  John Doe  ');
      jest.advanceTimersByTime(300);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('John Doe');
    });

    it('handles empty string after trimming', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      
      await user.type(input, '   ');
      jest.advanceTimersByTime(300);
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Component Cleanup', () => {
    it('cleans up debounce timer on unmount', () => {
      const { unmount } = render(<SearchBar {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Search by customer name or contact number...');
      fireEvent.change(input, { target: { value: 'test' } });
      
      unmount();
      
      // Advance timers after unmount
      jest.advanceTimersByTime(300);
      
      // Should not call onSearchChange after unmount
      expect(mockProps.onSearchChange).not.toHaveBeenCalled();
    });
  });
});