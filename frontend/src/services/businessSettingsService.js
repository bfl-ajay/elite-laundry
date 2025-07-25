import api from './api';

/**
 * Business Settings Service
 * Handles API calls for business settings management
 */
class BusinessSettingsService {
  /**
   * Get current business settings (Super Admin only)
   * @returns {Promise<Object>} Business settings data
   */
  async getSettings() {
    try {
      const response = await api.get('/business-settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business settings:', error);
      throw error;
    }
  }

  /**
   * Get public business settings (no auth required)
   * @returns {Promise<Object>} Public business settings
   */
  async getPublicSettings() {
    try {
      const response = await api.get('/business-settings/public');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch public business settings:', error);
      throw error;
    }
  }

  /**
   * Update business name
   * @param {string} businessName - New business name
   * @returns {Promise<Object>} Updated settings
   */
  async updateBusinessName(businessName) {
    try {
      const response = await api.put('/business-settings/business-name', {
        businessName
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update business name:', error);
      throw error;
    }
  }

  /**
   * Upload business logo
   * @param {File} logoFile - Logo file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Updated settings
   */
  async uploadLogo(logoFile, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await api.post('/business-settings/logo', formData, config);
      return response.data;
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error;
    }
  }

  /**
   * Upload business favicon
   * @param {File} faviconFile - Favicon file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Updated settings
   */
  async uploadFavicon(faviconFile, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('favicon', faviconFile);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await api.post('/business-settings/favicon', formData, config);
      return response.data;
    } catch (error) {
      console.error('Failed to upload favicon:', error);
      throw error;
    }
  }

  /**
   * Remove business logo
   * @returns {Promise<Object>} Updated settings
   */
  async removeLogo() {
    try {
      const response = await api.delete('/business-settings/logo');
      return response.data;
    } catch (error) {
      console.error('Failed to remove logo:', error);
      throw error;
    }
  }

  /**
   * Remove business favicon
   * @returns {Promise<Object>} Updated settings
   */
  async removeFavicon() {
    try {
      const response = await api.delete('/business-settings/favicon');
      return response.data;
    } catch (error) {
      console.error('Failed to remove favicon:', error);
      throw error;
    }
  }

  /**
   * Validate file for upload
   * @param {File} file - File to validate
   * @param {string} type - File type ('logo' or 'favicon')
   * @returns {Object} Validation result
   */
  validateFile(file, type = 'logo') {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = {
      logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
      favicon: ['image/x-icon', 'image/png', 'image/jpeg', 'image/jpg']
    };

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes[type].includes(file.type)) {
      const allowedExtensions = type === 'logo' 
        ? 'JPG, PNG, SVG' 
        : 'ICO, PNG, JPG';
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedExtensions}` 
      };
    }

    return { valid: true };
  }
}

export default new BusinessSettingsService();