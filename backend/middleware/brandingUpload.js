const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directory exists
const ensureUploadDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Configure multer for branding file uploads
const createBrandingUpload = () => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/branding');
      await ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = file.fieldname; // 'logo' or 'favicon'
      const filename = `${baseName}-${timestamp}${ext}`;
      cb(null, filename);
    }
  });

  const fileFilter = (req, file, cb) => {
    // Define allowed file types for logo and favicon
    const allowedTypes = {
      logo: {
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
        extensions: ['.jpg', '.jpeg', '.png', '.svg']
      },
      favicon: {
        mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg'],
        extensions: ['.ico', '.png', '.jpg', '.jpeg']
      }
    };

    const fileType = file.fieldname; // 'logo' or 'favicon'
    const allowedConfig = allowedTypes[fileType];

    if (!allowedConfig) {
      return cb(new Error(`Invalid file field: ${fileType}`), false);
    }

    // Check MIME type
    if (!allowedConfig.mimeTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type for ${fileType}. Allowed types: ${allowedConfig.mimeTypes.join(', ')}`), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedConfig.extensions.includes(ext)) {
      return cb(new Error(`Invalid file extension for ${fileType}. Allowed extensions: ${allowedConfig.extensions.join(', ')}`), false);
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file at a time
    }
  });
};

// Middleware for logo upload
const uploadLogo = createBrandingUpload().single('logo');

// Middleware for favicon upload
const uploadFavicon = createBrandingUpload().single('favicon');

// Error handling middleware for upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size is 5MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Only one file allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message
      }
    });
  }
  
  if (err.message.includes('Invalid file')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      }
    });
  }
  
  next(err);
};

// Middleware to validate uploaded file
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded'
      }
    });
  }
  
  next();
};

module.exports = {
  uploadLogo,
  uploadFavicon,
  handleUploadError,
  validateUploadedFile
};