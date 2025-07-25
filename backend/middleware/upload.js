const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FileUploadError } = require('./errorHandler');

// Ensure upload directories exist
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for bill attachments
const billStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/bills');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `bill-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter for bill attachments
const billFileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  // Check file extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedMimes.includes(file.mimetype);
  
  // Validate file name (no special characters except dots, hyphens, underscores)
  const validFilename = /^[a-zA-Z0-9._-]+$/.test(path.basename(file.originalname, path.extname(file.originalname)));
  
  if (mimetype && extname && validFilename) {
    return cb(null, true);
  } else {
    let errorMessage = 'Invalid file type. ';
    
    if (!extname || !mimetype) {
      errorMessage += 'Only JPEG, PNG images and PDF files are allowed. ';
    }
    
    if (!validFilename) {
      errorMessage += 'Filename contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores.';
    }
    
    cb(new FileUploadError(errorMessage.trim()), false);
  }
};

// Create multer instance for bill attachments
const billUpload = multer({
  storage: billStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of non-file fields
  },
  fileFilter: billFileFilter
});

// Error handling wrapper for multer
const handleMulterError = (upload) => {
  return (req, res, next) => {
    upload(req, res, (error) => {
      if (error) {
        // Handle different types of multer errors
        if (error instanceof multer.MulterError) {
          let message = 'File upload error';
          let details = null;
          
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'File size too large. Maximum size allowed is 5MB.';
              details = { maxSize: '5MB', receivedSize: req.headers['content-length'] };
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Too many files. Only one file is allowed.';
              details = { maxFiles: 1 };
              break;
            case 'LIMIT_FIELD_COUNT':
              message = 'Too many form fields.';
              details = { maxFields: 10 };
              break;
            case 'LIMIT_FIELD_KEY':
              message = 'Field name too long.';
              details = { maxFieldNameSize: 100 };
              break;
            case 'LIMIT_FIELD_VALUE':
              message = 'Field value too long.';
              details = { maxFieldSize: '1MB' };
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = 'Unexpected file field. Expected field name: "billAttachment".';
              details = { expectedField: 'billAttachment' };
              break;
            case 'MISSING_FIELD_NAME':
              message = 'Missing field name for uploaded file.';
              break;
            default:
              message = error.message || 'File upload error';
          }
          
          return next(new FileUploadError(message, details));
        } else if (error instanceof FileUploadError) {
          return next(error);
        } else {
          return next(new FileUploadError(error.message || 'File upload failed'));
        }
      }
      next();
    });
  };
};

// Middleware to validate file upload requirements
const validateFileUpload = (required = false) => {
  return (req, res, next) => {
    if (required && !req.file) {
      return next(new FileUploadError('File upload is required'));
    }
    
    if (req.file) {
      // Additional file validation
      const stats = fs.statSync(req.file.path);
      
      // Check if file is actually empty
      if (stats.size === 0) {
        // Clean up empty file
        fs.unlinkSync(req.file.path);
        return next(new FileUploadError('Uploaded file is empty'));
      }
      
      // Validate file content matches extension (basic check)
      const fileBuffer = fs.readFileSync(req.file.path, { start: 0, end: 10 });
      const isPDF = fileBuffer.toString('hex').startsWith('255044462d'); // PDF magic number
      const isJPEG = fileBuffer.toString('hex').startsWith('ffd8ff'); // JPEG magic number
      const isPNG = fileBuffer.toString('hex').startsWith('89504e47'); // PNG magic number
      
      const extension = path.extname(req.file.originalname).toLowerCase();
      let validContent = false;
      
      if (extension === '.pdf' && isPDF) validContent = true;
      if ((extension === '.jpg' || extension === '.jpeg') && isJPEG) validContent = true;
      if (extension === '.png' && isPNG) validContent = true;
      
      if (!validContent) {
        // Clean up invalid file
        fs.unlinkSync(req.file.path);
        return next(new FileUploadError('File content does not match file extension'));
      }
    }
    
    next();
  };
};

// Clean up uploaded files on error
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = () => {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('File cleanup error:', error);
      }
    }
    
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('File cleanup error:', error);
          }
        }
      });
    }
  };
  
  res.send = function(data) {
    if (res.statusCode >= 400) {
      cleanup();
    }
    originalSend.call(this, data);
  };
  
  res.json = function(data) {
    if (res.statusCode >= 400 || (data && data.success === false)) {
      cleanup();
    }
    originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  billUpload: handleMulterError(billUpload.single('billAttachment')),
  validateFileUpload,
  cleanupOnError,
  ensureUploadDir
};