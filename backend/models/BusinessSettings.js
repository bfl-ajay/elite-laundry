const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class BusinessSettings {
  constructor(data) {
    this.id = data.id;
    this.logoPath = data.logo_path;
    this.faviconPath = data.favicon_path;
    this.businessName = data.business_name;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get current business settings (singleton pattern)
  static async getCurrent() {
    const query = 'SELECT * FROM business_settings ORDER BY id LIMIT 1';
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      return await BusinessSettings.createDefault();
    }
    
    return new BusinessSettings(result.rows[0]);
  }

  // Create default business settings
  static async createDefault() {
    const query = `
      INSERT INTO business_settings (business_name)
      VALUES ($1)
      RETURNING *
    `;
    
    const result = await pool.query(query, ['Laundry Management System']);
    return new BusinessSettings(result.rows[0]);
  }

  // Update business name
  async updateBusinessName(newName) {
    const query = `
      UPDATE business_settings 
      SET business_name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [newName, this.id]);
    const updated = new BusinessSettings(result.rows[0]);
    
    // Update current instance
    this.businessName = updated.businessName;
    this.updatedAt = updated.updatedAt;
    
    return this;
  }

  // Update logo path
  async updateLogo(logoPath) {
    // Delete old logo file if it exists
    if (this.logoPath) {
      try {
        const oldLogoPath = path.join(__dirname, '..', this.logoPath);
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.warn('Could not delete old logo file:', error.message);
      }
    }

    const query = `
      UPDATE business_settings 
      SET logo_path = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [logoPath, this.id]);
    const updated = new BusinessSettings(result.rows[0]);
    
    // Update current instance
    this.logoPath = updated.logoPath;
    this.updatedAt = updated.updatedAt;
    
    return this;
  }

  // Update favicon path
  async updateFavicon(faviconPath) {
    // Delete old favicon file if it exists
    if (this.faviconPath) {
      try {
        const oldFaviconPath = path.join(__dirname, '..', this.faviconPath);
        await fs.unlink(oldFaviconPath);
      } catch (error) {
        console.warn('Could not delete old favicon file:', error.message);
      }
    }

    const query = `
      UPDATE business_settings 
      SET favicon_path = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [faviconPath, this.id]);
    const updated = new BusinessSettings(result.rows[0]);
    
    // Update current instance
    this.faviconPath = updated.faviconPath;
    this.updatedAt = updated.updatedAt;
    
    return this;
  }

  // Remove logo
  async removeLogo() {
    if (this.logoPath) {
      try {
        const logoPath = path.join(__dirname, '..', this.logoPath);
        await fs.unlink(logoPath);
      } catch (error) {
        console.warn('Could not delete logo file:', error.message);
      }
    }

    const query = `
      UPDATE business_settings 
      SET logo_path = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [this.id]);
    const updated = new BusinessSettings(result.rows[0]);
    
    // Update current instance
    this.logoPath = updated.logoPath;
    this.updatedAt = updated.updatedAt;
    
    return this;
  }

  // Remove favicon
  async removeFavicon() {
    if (this.faviconPath) {
      try {
        const faviconPath = path.join(__dirname, '..', this.faviconPath);
        await fs.unlink(faviconPath);
      } catch (error) {
        console.warn('Could not delete favicon file:', error.message);
      }
    }

    const query = `
      UPDATE business_settings 
      SET favicon_path = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [this.id]);
    const updated = new BusinessSettings(result.rows[0]);
    
    // Update current instance
    this.faviconPath = updated.faviconPath;
    this.updatedAt = updated.updatedAt;
    
    return this;
  }

  // Get logo URL for client
  getLogoUrl() {
    if (!this.logoPath) return null;
    return `/uploads/branding/${path.basename(this.logoPath)}`;
  }

  // Get favicon URL for client
  getFaviconUrl() {
    if (!this.faviconPath) return null;
    return `/uploads/branding/${path.basename(this.faviconPath)}`;
  }

  // Check if logo exists
  async hasLogo() {
    if (!this.logoPath) return false;
    
    try {
      const logoPath = path.join(__dirname, '..', this.logoPath);
      await fs.access(logoPath);
      return true;
    } catch {
      return false;
    }
  }

  // Check if favicon exists
  async hasFavicon() {
    if (!this.faviconPath) return false;
    
    try {
      const faviconPath = path.join(__dirname, '..', this.faviconPath);
      await fs.access(faviconPath);
      return true;
    } catch {
      return false;
    }
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      id: this.id,
      businessName: this.businessName,
      logoUrl: this.getLogoUrl(),
      faviconUrl: this.getFaviconUrl(),
      hasLogo: !!this.logoPath,
      hasFavicon: !!this.faviconPath,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to JSON with file paths (for internal use)
  toJSONWithPaths() {
    return {
      id: this.id,
      businessName: this.businessName,
      logoPath: this.logoPath,
      faviconPath: this.faviconPath,
      logoUrl: this.getLogoUrl(),
      faviconUrl: this.getFaviconUrl(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = BusinessSettings;