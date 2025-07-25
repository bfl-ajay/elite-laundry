const express = require('express');
const BusinessSettings = require('../models/BusinessSettings');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { uploadLogo, uploadFavicon, handleUploadError, validateUploadedFile } = require('../middleware/brandingUpload');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Business Settings
 *   description: Business settings and branding management
 */

// Apply auth middleware to protected routes only (public route is excluded)

/**
 * @swagger
 * /api/business-settings:
 *   get:
 *     summary: Get current business settings
 *     description: Retrieve current business settings including logo and favicon information
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Business settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BusinessSettings'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, requireRole(['super_admin']), asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    
    res.json({
      success: true,
      data: settings.toJSON()
    });
  } catch (error) {
    throw new Error('Failed to retrieve business settings');
  }
}));

/**
 * @swagger
 * /api/business-settings/public:
 *   get:
 *     summary: Get public business settings
 *     description: Retrieve public business settings (logo, favicon, business name) without authentication
 *     tags: [Business Settings]
 *     responses:
 *       200:
 *         description: Public business settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         businessName:
 *                           type: string
 *                         logoUrl:
 *                           type: string
 *                         faviconUrl:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/public', asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    
    res.json({
      success: true,
      data: {
        businessName: settings.businessName,
        logoUrl: settings.getLogoUrl(),
        faviconUrl: settings.getFaviconUrl()
      }
    });
  } catch (error) {
    throw new Error('Failed to retrieve public business settings');
  }
}));

/**
 * @swagger
 * /api/business-settings/business-name:
 *   put:
 *     summary: Update business name
 *     description: Update the business name (Super Admin only)
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *             properties:
 *               businessName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "My Laundry Business"
 *     responses:
 *       200:
 *         description: Business name updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.put('/business-name', authenticate, requireRole(['super_admin']), asyncHandler(async (req, res) => {
  try {
    const { businessName } = req.body;
    
    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      throw new ValidationError('Business name is required and must be a non-empty string');
    }
    
    if (businessName.length > 255) {
      throw new ValidationError('Business name must not exceed 255 characters');
    }
    
    const settings = await BusinessSettings.getCurrent();
    await settings.updateBusinessName(businessName.trim());
    
    res.json({
      success: true,
      data: settings.toJSON(),
      message: 'Business name updated successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error('Failed to update business name');
  }
}));

/**
 * @swagger
 * /api/business-settings/logo:
 *   post:
 *     summary: Upload business logo
 *     description: Upload a new business logo (Super Admin only)
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPG, PNG, SVG - max 5MB)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/logo', authenticate, requireRole(['super_admin']), uploadLogo, handleUploadError, validateUploadedFile, asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    const logoPath = `uploads/branding/${req.file.filename}`;
    
    await settings.updateLogo(logoPath);
    
    res.json({
      success: true,
      data: settings.toJSON(),
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        await require('fs').promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    throw new Error('Failed to upload logo');
  }
}));

/**
 * @swagger
 * /api/business-settings/favicon:
 *   post:
 *     summary: Upload business favicon
 *     description: Upload a new business favicon (Super Admin only)
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               favicon:
 *                 type: string
 *                 format: binary
 *                 description: Favicon file (ICO, PNG, JPG - max 5MB)
 *     responses:
 *       200:
 *         description: Favicon uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/favicon', authenticate, requireRole(['super_admin']), uploadFavicon, handleUploadError, validateUploadedFile, asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    const faviconPath = `uploads/branding/${req.file.filename}`;
    
    await settings.updateFavicon(faviconPath);
    
    res.json({
      success: true,
      data: settings.toJSON(),
      message: 'Favicon uploaded successfully'
    });
  } catch (error) {
    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        await require('fs').promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    throw new Error('Failed to upload favicon');
  }
}));

/**
 * @swagger
 * /api/business-settings/logo:
 *   delete:
 *     summary: Remove business logo
 *     description: Remove the current business logo (Super Admin only)
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logo removed successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.delete('/logo', authenticate, requireRole(['super_admin']), asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    await settings.removeLogo();
    
    res.json({
      success: true,
      data: settings.toJSON(),
      message: 'Logo removed successfully'
    });
  } catch (error) {
    throw new Error('Failed to remove logo');
  }
}));

/**
 * @swagger
 * /api/business-settings/favicon:
 *   delete:
 *     summary: Remove business favicon
 *     description: Remove the current business favicon (Super Admin only)
 *     tags: [Business Settings]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Favicon removed successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.delete('/favicon', authenticate, requireRole(['super_admin']), asyncHandler(async (req, res) => {
  try {
    const settings = await BusinessSettings.getCurrent();
    await settings.removeFavicon();
    
    res.json({
      success: true,
      data: settings.toJSON(),
      message: 'Favicon removed successfully'
    });
  } catch (error) {
    throw new Error('Failed to remove favicon');
  }
}));

module.exports = router;