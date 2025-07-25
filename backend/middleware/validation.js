const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid input data', errors.array());
  }
  next();
};

// Common validation rules
const commonValidations = {
  // ID parameter validation
  idParam: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  // Date validations
  dateField: (fieldName) => body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date in ISO format (YYYY-MM-DD)`),
  
  optionalDateField: (fieldName) => body(fieldName)
    .optional()
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date in ISO format (YYYY-MM-DD)`),
  
  // String validations
  requiredString: (fieldName, minLength = 1, maxLength = 255) => body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
    .trim(),
  
  optionalString: (fieldName, maxLength = 255) => body(fieldName)
    .optional()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must not exceed ${maxLength} characters`)
    .trim(),
  
  // Number validations
  positiveNumber: (fieldName) => body(fieldName)
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} must be a positive number`),
  
  positiveInteger: (fieldName) => body(fieldName)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} must be a positive integer`),
  
  // Phone number validation
  phoneNumber: (fieldName) => body(fieldName)
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage(`${fieldName} must be a valid phone number`)
    .isLength({ min: 10, max: 15 })
    .withMessage(`${fieldName} must be between 10 and 15 characters`),
  
  // Enum validations
  orderStatus: body('status')
    .isIn(['Pending', 'Completed'])
    .withMessage('Status must be either "Pending" or "Completed"'),
  
  paymentStatus: body('paymentStatus')
    .isIn(['Paid', 'Unpaid'])
    .withMessage('Payment status must be either "Paid" or "Unpaid"'),
  
  serviceType: body('services.*.serviceType')
    .isIn(['ironing', 'washing', 'dryclean', 'stain_removal'])
    .withMessage('Service type must be one of: ironing, washing, dryclean, stain_removal'),
  
  clothType: body('services.*.clothType')
    .isIn(['saari', 'normal', 'others'])
    .withMessage('Cloth type must be one of: saari, normal, others'),
  
  // Query parameter validations
  periodQuery: query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be one of: daily, weekly, monthly'),
  
  dateRangeQuery: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format (YYYY-MM-DD)'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format (YYYY-MM-DD)')
  ]
};

// Order validation rules
const orderValidations = {
  create: [
    commonValidations.requiredString('customerName', 2, 100),
    commonValidations.phoneNumber('contactNumber'),
    commonValidations.dateField('orderDate'),
    body('services')
      .isArray({ min: 1 })
      .withMessage('At least one service is required'),
    commonValidations.serviceType,
    commonValidations.clothType,
    body('services.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Service quantity must be a positive integer'),
    body('services.*.unitCost')
      .isFloat({ min: 0 })
      .withMessage('Service unit cost must be a positive number'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.idParam,
    commonValidations.requiredString('customerName', 2, 100),
    commonValidations.phoneNumber('contactNumber'),
    commonValidations.dateField('orderDate'),
    body('services')
      .isArray({ min: 1 })
      .withMessage('At least one service is required'),
    commonValidations.serviceType,
    commonValidations.clothType,
    body('services.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Service quantity must be a positive integer'),
    body('services.*.unitCost')
      .isFloat({ min: 0 })
      .withMessage('Service unit cost must be a positive number'),
    handleValidationErrors
  ],
  
  updateStatus: [
    commonValidations.idParam,
    commonValidations.orderStatus,
    handleValidationErrors
  ],
  
  updatePayment: [
    commonValidations.idParam,
    commonValidations.paymentStatus,
    handleValidationErrors
  ],
  
  getById: [
    commonValidations.idParam,
    handleValidationErrors
  ],
  
  list: [
    query('status')
      .optional()
      .isIn(['Pending', 'Completed'])
      .withMessage('Status filter must be either "Pending" or "Completed"'),
    ...commonValidations.dateRangeQuery,
    handleValidationErrors
  ]
};

// Expense validation rules
const expenseValidations = {
  create: [
    commonValidations.requiredString('expenseType', 2, 100),
    commonValidations.positiveNumber('amount'),
    commonValidations.dateField('expenseDate'),
    handleValidationErrors
  ],
  
  getById: [
    commonValidations.idParam,
    handleValidationErrors
  ],
  
  update: [
    commonValidations.idParam,
    commonValidations.requiredString('expenseType', 2, 100),
    commonValidations.positiveNumber('amount'),
    commonValidations.dateField('expenseDate'),
    handleValidationErrors
  ],
  
  list: [
    ...commonValidations.dateRangeQuery,
    query('expenseType')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Expense type filter must not exceed 100 characters'),
    handleValidationErrors
  ],
  
  uploadAttachment: [
    commonValidations.idParam,
    handleValidationErrors
  ]
};

// Analytics validation rules
const analyticsValidations = {
  business: [
    commonValidations.periodQuery,
    ...commonValidations.dateRangeQuery,
    handleValidationErrors
  ],
  
  expenses: [
    commonValidations.periodQuery,
    ...commonValidations.dateRangeQuery,
    handleValidationErrors
  ]
};

// Auth validation rules
const authValidations = {
  login: [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .trim(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    // Note: We make these optional because Basic Auth might be used instead
    handleValidationErrors
  ],
  
  register: [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    handleValidationErrors
  ]
};

// File upload validation
const fileValidations = {
  billAttachment: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedMimes.includes(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG images and PDF files are allowed'), false);
      }
    }
  }
};

// User validation rules
const userValidations = {
  create: [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['super_admin', 'admin', 'employee'])
      .withMessage('Role must be one of: super_admin, admin, employee'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.idParam,
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .trim(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['super_admin', 'admin', 'employee'])
      .withMessage('Role must be one of: super_admin, admin, employee'),
    handleValidationErrors
  ],
  
  getById: [
    commonValidations.idParam,
    handleValidationErrors
  ]
};

// Custom validation middleware for date ranges
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new ValidationError('Start date must be before or equal to end date');
    }
    
    // Check if date range is reasonable (not more than 2 years)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 730) { // 2 years
      throw new ValidationError('Date range cannot exceed 2 years');
    }
  }
  
  next();
};

// Convenience functions for user validation
const validateUserCreation = userValidations.create;
const validateUserUpdate = userValidations.update;

module.exports = {
  orderValidations,
  expenseValidations,
  analyticsValidations,
  authValidations,
  userValidations,
  fileValidations,
  validateDateRange,
  handleValidationErrors,
  commonValidations,
  validateUserCreation,
  validateUserUpdate
};