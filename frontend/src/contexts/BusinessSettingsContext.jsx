import React, { createContext, useContext, useState, useEffect } from 'react';
import { businessSettingsService } from '../services';

const BusinessSettingsContext = createContext();

export const useBusinessSettings = () => {
  const context = useContext(BusinessSettingsContext);
  if (!context) {
    throw new Error('useBusinessSettings must be used within a BusinessSettingsProvider');
  }
  return context;
};

export const BusinessSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use public settings endpoint to avoid auth issues
      const response = await businessSettingsService.getPublicSettings();
      
      if (response.success) {
        setSettings(response.data);
      } else {
        setError(response.error?.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading business settings:', err);
      setError(err.error?.message || 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const value = {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings
  };

  return (
    <BusinessSettingsContext.Provider value={value}>
      {children}
    </BusinessSettingsContext.Provider>
  );
};