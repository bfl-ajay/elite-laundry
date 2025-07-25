import React, { useState, useEffect } from 'react';
import { businessSettingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Navigation } from '../components';
import PermissionGate from '../components/common/PermissionGate';
import LogoUploader from '../components/common/LogoUploader';
import FaviconUploader from '../components/common/FaviconUploader';

const BusinessSettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { canAccessSettings } = usePermissions();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  useEffect(() => {
    // Only load settings after authentication is complete and user has access
    if (!authLoading && user && canAccessSettings) {
      loadSettings();
    } else if (!authLoading && !user) {
      setLoading(false);
    } else if (!authLoading && user && !canAccessSettings) {
      setLoading(false);
    }
  }, [authLoading, user, canAccessSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await businessSettingsService.getSettings();
      
      if (response.success) {
        setSettings(response.data);
        setBusinessName(response.data.businessName || '');
      } else {
        setError(response.error?.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.error?.message || 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessNameUpdate = async (e) => {
    e.preventDefault();
    
    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    try {
      setIsUpdatingName(true);
      setError(null);
      setSuccess(null);

      const response = await businessSettingsService.updateBusinessName(businessName.trim());
      
      if (response.success) {
        setSettings(response.data);
        setSuccess('Business name updated successfully');
      } else {
        setError(response.error?.message || 'Failed to update business name');
      }
    } catch (err) {
      console.error('Error updating business name:', err);
      setError(err.error?.message || 'Failed to update business name');
    } finally {
      setIsUpdatingName(false);
    }
  };



  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!canAccessSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access business settings.</p>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Authenticating...' : 'Loading business settings...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate requiredPermission="business_settings:read">
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
              <p className="text-gray-600 mt-1">Manage your business branding and settings</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={clearMessages}
                        className="inline-flex text-red-400 hover:text-red-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={clearMessages}
                        className="inline-flex text-green-400 hover:text-green-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Name Section */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
                <form onSubmit={handleBusinessNameUpdate} className="max-w-md">
                  <div className="mb-4">
                    <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your business name"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdatingName || !businessName.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingName ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Business Name'
                    )}
                  </button>
                </form>
              </div>

              {/* Logo Section */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Business Logo</h2>
                <LogoUploader
                  currentLogo={settings?.logoUrl}
                  onUploadSuccess={(updatedSettings, message) => {
                    setSettings(updatedSettings);
                    setSuccess(message);
                    setError(null);
                  }}
                  onUploadError={(errorMessage) => {
                    setError(errorMessage);
                    setSuccess(null);
                  }}
                  onRemoveSuccess={(updatedSettings, message) => {
                    setSettings(updatedSettings);
                    setSuccess(message);
                    setError(null);
                  }}
                  onRemoveError={(errorMessage) => {
                    setError(errorMessage);
                    setSuccess(null);
                  }}
                />
              </div>

              {/* Favicon Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Favicon</h2>
                <FaviconUploader
                  currentFavicon={settings?.faviconUrl}
                  onUploadSuccess={(updatedSettings, message) => {
                    setSettings(updatedSettings);
                    setSuccess(message);
                    setError(null);
                  }}
                  onUploadError={(errorMessage) => {
                    setError(errorMessage);
                    setSuccess(null);
                  }}
                  onRemoveSuccess={(updatedSettings, message) => {
                    setSettings(updatedSettings);
                    setSuccess(message);
                    setError(null);
                  }}
                  onRemoveError={(errorMessage) => {
                    setError(errorMessage);
                    setSuccess(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default BusinessSettingsPage;