import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BusinessSettingsProvider, useBusinessSettings } from '../contexts/BusinessSettingsContext';
import { businessSettingsService } from '../services';

// Mock the business settings service
jest.mock('../services', () => ({
  businessSettingsService: {
    getPublicSettings: jest.fn()
  }
}));

// Test component to verify the context is working
function TestComponent() {
  const { settings, loading, error } = useBusinessSettings();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="settings">{settings ? JSON.stringify(settings) : 'no-settings'}</div>
    </div>
  );
}

describe('BusinessSettingsProvider Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('integrates BusinessSettingsProvider and loads settings on initialization', async () => {
    // Mock successful business settings response
    businessSettingsService.getPublicSettings.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        businessName: 'Test Laundry',
        logoUrl: '/uploads/logo.png',
        faviconUrl: null,
        hasLogo: true,
        hasFavicon: false
      }
    });

    const { getByTestId } = render(
      <BusinessSettingsProvider>
        <TestComponent />
      </BusinessSettingsProvider>
    );

    // Initially should be loading
    expect(getByTestId('loading')).toHaveTextContent('loading');

    // Wait for the business settings to be loaded
    await waitFor(() => {
      expect(businessSettingsService.getPublicSettings).toHaveBeenCalledTimes(1);
    });

    // Should be loaded now
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should have settings
    await waitFor(() => {
      expect(getByTestId('settings')).toHaveTextContent('Test Laundry');
    });

    // Should have no error
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  test('handles business settings loading error gracefully', async () => {
    // Mock failed business settings response
    businessSettingsService.getPublicSettings.mockRejectedValue({
      error: { message: 'Failed to load settings' }
    });

    const { getByTestId } = render(
      <BusinessSettingsProvider>
        <TestComponent />
      </BusinessSettingsProvider>
    );

    // Wait for the business settings call to complete
    await waitFor(() => {
      expect(businessSettingsService.getPublicSettings).toHaveBeenCalledTimes(1);
    });

    // Should be loaded (not loading anymore)
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should have error
    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Failed to load settings');
    });

    // Should have no settings
    expect(getByTestId('settings')).toHaveTextContent('no-settings');
  });

  test('provider context is available to child components', () => {
    businessSettingsService.getPublicSettings.mockResolvedValue({
      success: true,
      data: { businessName: 'Test' }
    });

    const { getByTestId } = render(
      <BusinessSettingsProvider>
        <TestComponent />
      </BusinessSettingsProvider>
    );

    // The component should render without throwing errors, indicating proper provider setup
    expect(getByTestId('loading')).toBeInTheDocument();
    expect(getByTestId('error')).toBeInTheDocument();
    expect(getByTestId('settings')).toBeInTheDocument();
  });
});