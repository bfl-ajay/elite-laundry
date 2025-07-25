const fs = require('fs');
const path = require('path');

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message, resource = null) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = resource ? `${resource.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'AUTHORIZATION_ERROR';
  }
}

class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.code = 'DATABASE_ERROR';
    this.originalError = originalError;
  }
}

class FileUploadError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'FileUploadError';
    this.statusCode = 400;
    this.code = 'FILE_UPLOAD_ERROR';
    this.details = details;
  }
}

// Database error handler
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // PostgreSQL specific error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new DatabaseError('Duplicate entry found', error);
    case '23503': // Foreign key violation
      return new DatabaseError('Referenced record not found', error);
    case '23502': // Not null violation
      return new DatabaseError('Required field is missing', error);
    case '23514': // Check violation
      return new DatabaseError('Invalid data format', error);
    case '42P01': // Undefined table
      return new DatabaseError('Database table not found', error);
    case '42703': // Undefined column
      return new DatabaseError('Database column not found', error);
    case 'ECONNREFUSED':
      return new DatabaseError('Database connection failed', error);
    case 'ENOTFOUND':
      return new DatabaseError('Database server not found', error);
    default:
      return new DatabaseError('Database operation failed', error);
  }
};

// File cleanup utility
const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  let processedError = error;

  // Handle different types of errors
  if (error.name === 'ValidationError' || error.type === 'entity.parse.failed') {
    processedError = new ValidationError('Invalid request data', error.details);
  } else if (error.code && (error.code.startsWith('23') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
    processedError = handleDatabaseError(error);
  } else if (error.name === 'MulterError') {
    // Handle multer file upload errors
    let message = 'File upload error';
    let details = null;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        details = { maxSize: '5MB' };
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = error.message || 'File upload error';
    }
    
    processedError = new FileUploadError(message, details);
    
    // Clean up any uploaded files
    if (req.file) {
      cleanupFile(req.file.path);
    }
    if (req.files) {
      req.files.forEach(file => cleanupFile(file.path));
    }
  } else if (!error.statusCode) {
    // Handle unexpected errors
    processedError = {
      name: 'ServerError',
      statusCode: 500,
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    };
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] ${processedError.name || 'Error'}:`, {
    message: processedError.message,
    code: processedError.code,
    statusCode: processedError.statusCode,
    stack: process.env.NODE_ENV === 'development' ? processedError.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  const response = {
    success: false,
    error: {
      code: processedError.code || 'SERVER_ERROR',
      message: processedError.message || 'An unexpected error occurred'
    }
  };

  // Add details in development or for validation errors
  if (process.env.NODE_ENV === 'development' || processedError.details) {
    response.error.details = processedError.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && processedError.stack) {
    response.error.stack = processedError.stack;
  }

  res.status(processedError.statusCode || 500).json(response);
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  FileUploadError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleDatabaseError,
  cleanupFile
};