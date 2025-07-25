const BusinessSettings = require('../../models/BusinessSettings');
const fs = require('fs').promises;
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
    access: jest.fn()
  }
}));

describe('BusinessSettings Model', () => {
  let businessSettings;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get or create business settings
    businessSettings = await BusinessSettings.getCurrent();
  });

  describe('Singleton Pattern', () => {
    test('should get current business settings', async () => {
      const settings = await BusinessSettings.getCurrent();
      
      expect(settings).toBeInstanceOf(BusinessSettings);
      expect(settings.id).toBeDefined();
      expect(settings.businessName).toBeDefined();
    });

    test('should create default settings if none exist', async () => {
      // This test assumes the setup creates default settings
      const settings = await BusinessSettings.getCurrent();
      
      expect(settings.businessName).toBe('Laundry Management System');
    });

    test('should return same settings on multiple calls', async () => {
      const settings1 = await BusinessSettings.getCurrent();
      const settings2 = await BusinessSettings.getCurrent();
      
      expect(settings1.id).toBe(settings2.id);
      expect(settings1.businessName).toBe(settings2.businessName);
    });
  });

  describe('Business Name Management', () => {
    test('should update business name', async () => {
      const newName = 'Elite Laundry Services';
      
      await businessSettings.updateBusinessName(newName);
      
      expect(businessSettings.businessName).toBe(newName);
      expect(businessSettings.updatedAt).toBeDefined();
    });

    test('should persist business name changes', async () => {
      const newName = 'Premium Laundry Co.';
      
      await businessSettings.updateBusinessName(newName);
      
      // Get fresh instance from database
      const freshSettings = await BusinessSettings.getCurrent();
      expect(freshSettings.businessName).toBe(newName);
    });

    test('should handle empty business name', async () => {
      await businessSettings.updateBusinessName('');
      expect(businessSettings.businessName).toBe('');
    });
  });

  describe('Logo Management', () => {
    test('should update logo path', async () => {
      const logoPath = 'uploads/branding/logo.png';
      
      await businessSettings.updateLogo(logoPath);
      
      expect(businessSettings.logoPath).toBe(logoPath);
      expect(businessSettings.updatedAt).toBeDefined();
    });

    test('should delete old logo when updating', async () => {
      const oldLogoPath = 'uploads/branding/old-logo.png';
      const newLogoPath = 'uploads/branding/new-logo.png';
      
      // Set initial logo
      await businessSettings.updateLogo(oldLogoPath);
      
      // Update to new logo
      await businessSettings.updateLogo(newLogoPath);
      
      expect(fs.unlink).toHaveBeenCalled();
      expect(businessSettings.logoPath).toBe(newLogoPath);
    });

    test('should handle logo deletion error gracefully', async () => {
      const logoPath = 'uploads/branding/logo.png';
      
      // Set initial logo
      await businessSettings.updateLogo(logoPath);
      
      // Mock fs.unlink to throw error
      fs.unlink.mockRejectedValueOnce(new Error('File not found'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw error
      await expect(businessSettings.updateLogo('new-logo.png')).resolves.toBeDefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not delete old logo file:', 'File not found');
      consoleSpy.mockRestore();
    });

    test('should remove logo', async () => {
      const logoPath = 'uploads/branding/logo.png';
      
      // Set logo first
      await businessSettings.updateLogo(logoPath);
      expect(businessSettings.logoPath).toBe(logoPath);
      
      // Remove logo
      await businessSettings.removeLogo();
      
      expect(businessSettings.logoPath).toBeNull();
      expect(fs.unlink).toHaveBeenCalled();
    });

    test('should get logo URL', () => {
      businessSettings.logoPath = 'uploads/branding/logo.png';
      
      const logoUrl = businessSettings.getLogoUrl();
      
      expect(logoUrl).toBe('/uploads/branding/logo.png');
    });

    test('should return null for logo URL when no logo', () => {
      businessSettings.logoPath = null;
      
      const logoUrl = businessSettings.getLogoUrl();
      
      expect(logoUrl).toBeNull();
    });

    test('should check if logo exists', async () => {
      businessSettings.logoPath = 'uploads/branding/logo.png';
      
      // Mock fs.access to resolve (file exists)
      fs.access.mockResolvedValueOnce();
      
      const hasLogo = await businessSettings.hasLogo();
      
      expect(hasLogo).toBe(true);
      expect(fs.access).toHaveBeenCalled();
    });

    test('should return false when logo file does not exist', async () => {
      businessSettings.logoPath = 'uploads/branding/nonexistent.png';
      
      // Mock fs.access to reject (file does not exist)
      fs.access.mockRejectedValueOnce(new Error('File not found'));
      
      const hasLogo = await businessSettings.hasLogo();
      
      expect(hasLogo).toBe(false);
    });

    test('should return false when no logo path set', async () => {
      businessSettings.logoPath = null;
      
      const hasLogo = await businessSettings.hasLogo();
      
      expect(hasLogo).toBe(false);
      expect(fs.access).not.toHaveBeenCalled();
    });
  });

  describe('Favicon Management', () => {
    test('should update favicon path', async () => {
      const faviconPath = 'uploads/branding/favicon.ico';
      
      await businessSettings.updateFavicon(faviconPath);
      
      expect(businessSettings.faviconPath).toBe(faviconPath);
      expect(businessSettings.updatedAt).toBeDefined();
    });

    test('should delete old favicon when updating', async () => {
      const oldFaviconPath = 'uploads/branding/old-favicon.ico';
      const newFaviconPath = 'uploads/branding/new-favicon.ico';
      
      // Set initial favicon
      await businessSettings.updateFavicon(oldFaviconPath);
      
      // Update to new favicon
      await businessSettings.updateFavicon(newFaviconPath);
      
      expect(fs.unlink).toHaveBeenCalled();
      expect(businessSettings.faviconPath).toBe(newFaviconPath);
    });

    test('should remove favicon', async () => {
      const faviconPath = 'uploads/branding/favicon.ico';
      
      // Set favicon first
      await businessSettings.updateFavicon(faviconPath);
      expect(businessSettings.faviconPath).toBe(faviconPath);
      
      // Remove favicon
      await businessSettings.removeFavicon();
      
      expect(businessSettings.faviconPath).toBeNull();
      expect(fs.unlink).toHaveBeenCalled();
    });

    test('should get favicon URL', () => {
      businessSettings.faviconPath = 'uploads/branding/favicon.ico';
      
      const faviconUrl = businessSettings.getFaviconUrl();
      
      expect(faviconUrl).toBe('/uploads/branding/favicon.ico');
    });

    test('should return null for favicon URL when no favicon', () => {
      businessSettings.faviconPath = null;
      
      const faviconUrl = businessSettings.getFaviconUrl();
      
      expect(faviconUrl).toBeNull();
    });

    test('should check if favicon exists', async () => {
      businessSettings.faviconPath = 'uploads/branding/favicon.ico';
      
      // Mock fs.access to resolve (file exists)
      fs.access.mockResolvedValueOnce();
      
      const hasFavicon = await businessSettings.hasFavicon();
      
      expect(hasFavicon).toBe(true);
      expect(fs.access).toHaveBeenCalled();
    });

    test('should return false when favicon file does not exist', async () => {
      businessSettings.faviconPath = 'uploads/branding/nonexistent.ico';
      
      // Mock fs.access to reject (file does not exist)
      fs.access.mockRejectedValueOnce(new Error('File not found'));
      
      const hasFavicon = await businessSettings.hasFavicon();
      
      expect(hasFavicon).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to JSON for API response', () => {
      businessSettings.businessName = 'Test Laundry';
      businessSettings.logoPath = 'uploads/branding/logo.png';
      businessSettings.faviconPath = 'uploads/branding/favicon.ico';
      
      const json = businessSettings.toJSON();
      
      expect(json).toEqual({
        id: businessSettings.id,
        businessName: 'Test Laundry',
        logoUrl: '/uploads/branding/logo.png',
        faviconUrl: '/uploads/branding/favicon.ico',
        hasLogo: true,
        hasFavicon: true,
        createdAt: businessSettings.createdAt,
        updatedAt: businessSettings.updatedAt
      });
    });

    test('should serialize to JSON without logo/favicon', () => {
      businessSettings.businessName = 'Test Laundry';
      businessSettings.logoPath = null;
      businessSettings.faviconPath = null;
      
      const json = businessSettings.toJSON();
      
      expect(json.logoUrl).toBeNull();
      expect(json.faviconUrl).toBeNull();
      expect(json.hasLogo).toBe(false);
      expect(json.hasFavicon).toBe(false);
    });

    test('should serialize to JSON with paths for internal use', () => {
      businessSettings.businessName = 'Test Laundry';
      businessSettings.logoPath = 'uploads/branding/logo.png';
      businessSettings.faviconPath = 'uploads/branding/favicon.ico';
      
      const json = businessSettings.toJSONWithPaths();
      
      expect(json).toEqual({
        id: businessSettings.id,
        businessName: 'Test Laundry',
        logoPath: 'uploads/branding/logo.png',
        faviconPath: 'uploads/branding/favicon.ico',
        logoUrl: '/uploads/branding/logo.png',
        faviconUrl: '/uploads/branding/favicon.ico',
        createdAt: businessSettings.createdAt,
        updatedAt: businessSettings.updatedAt
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle file deletion errors in removeLogo', async () => {
      businessSettings.logoPath = 'uploads/branding/logo.png';
      
      // Mock fs.unlink to throw error
      fs.unlink.mockRejectedValueOnce(new Error('Permission denied'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw error
      await expect(businessSettings.removeLogo()).resolves.toBeDefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not delete logo file:', 'Permission denied');
      expect(businessSettings.logoPath).toBeNull();
      
      consoleSpy.mockRestore();
    });

    test('should handle file deletion errors in removeFavicon', async () => {
      businessSettings.faviconPath = 'uploads/branding/favicon.ico';
      
      // Mock fs.unlink to throw error
      fs.unlink.mockRejectedValueOnce(new Error('Permission denied'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw error
      await expect(businessSettings.removeFavicon()).resolves.toBeDefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not delete favicon file:', 'Permission denied');
      expect(businessSettings.faviconPath).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle updating logo when no previous logo exists', async () => {
      businessSettings.logoPath = null;
      
      await businessSettings.updateLogo('uploads/branding/new-logo.png');
      
      expect(businessSettings.logoPath).toBe('uploads/branding/new-logo.png');
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test('should handle updating favicon when no previous favicon exists', async () => {
      businessSettings.faviconPath = null;
      
      await businessSettings.updateFavicon('uploads/branding/new-favicon.ico');
      
      expect(businessSettings.faviconPath).toBe('uploads/branding/new-favicon.ico');
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test('should handle removing logo when no logo exists', async () => {
      businessSettings.logoPath = null;
      
      await businessSettings.removeLogo();
      
      expect(businessSettings.logoPath).toBeNull();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test('should handle removing favicon when no favicon exists', async () => {
      businessSettings.faviconPath = null;
      
      await businessSettings.removeFavicon();
      
      expect(businessSettings.faviconPath).toBeNull();
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });
});