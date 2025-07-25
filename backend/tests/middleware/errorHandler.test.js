const {
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
} = require('../../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Custom Error Classes', () => {
    describe('ValidationError', () => {
      it('should create validation error with correct properties', () => {
        const error = new ValidationError('Invalid input', { field: 'email' });

        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ field: 'email' });
      });
    });

    describe('NotFoundError', () => {
      it('should create not found error with correct properties', () => {
        const error = new NotFoundError('Resource not found', 'user');

        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('USER_NOT_FOUND');
      });

      it('should use generic code when no resource specified', () => {
        const error = new NotFoundError('Not found');

        expect(error.code).toBe('NOT_FOUND');
      });
    });

    describe('AuthenticationError', () => {
      it('should create authentication error with correct properties', () => {
        const error = new AuthenticationError('Invalid credentials');

        expect(error.name).toBe('AuthenticationError');
        expect(error.message).toBe('Invalid credentials');
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('AuthorizationError', () => {
      it('should create authorization error with correct properties', () => {
        const error = new AuthorizationError('Access denied');

        expect(error.name).toBe('AuthorizationError');
        expect(error.message).toBe('Access denied');
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('AUTHORIZATION_ERROR');
      });
    });

    describe('DatabaseError', () => {
      it('should create database error with correct properties', () => {
        const originalError = new Error('Connection failed');
        const error = new DatabaseError('Database operation failed', originalError);

        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe('Database operation failed');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.originalError).toBe(originalError);
      });
    });

    describe('FileUploadError', () => {
      it('should create file upload error with correct properties', () => {
        const error = new FileUploadError('File too large', { maxSize: '5MB' });

        expect(error.name).toBe('FileUploadError');
        expect(error.message).toBe('File too large');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('FILE_UPLOAD_ERROR');
        expect(error.details).toEqual({ maxSize: '5MB' });
      });
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle unique violation error', () => {
      const dbError = { code: '23505', message: 'duplicate key value' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Duplicate entry found');
    });

    it('should handle foreign key violation error', () => {
      const dbError = { code: '23503', message: 'foreign key constraint' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Referenced record not found');
    });

    it('should handle not null violation error', () => {
      const dbError = { code: '23502', message: 'null value' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Required field is missing');
    });

    it('should handle check violation error', () => {
      const dbError = { code: '23514', message: 'check constraint' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Invalid data format');
    });

    it('should handle connection refused error', () => {
      const dbError = { code: 'ECONNREFUSED', message: 'connection refused' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Database connection failed');
    });

    it('should handle unknown database errors', () => {
      const dbError = { code: 'UNKNOWN', message: 'unknown error' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Database operation failed');
    });
  });

  describe('cleanupFile', () => {
    let testFilePath;

    beforeEach(() => {
      testFilePath = path.join(__dirname, '../fixtures/cleanup-test.txt');
    });

    afterEach(() => {
      // Ensure cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should delete existing file', () => {
      // Create test file
      fs.writeFileSync(testFilePath, 'test content');
      expect(fs.existsSync(testFilePath)).toBe(true);

      cleanupFile(testFilePath);

      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it('should handle non-existent file gracefully', () => {
      expect(() => cleanupFile('non-existent-file.txt')).not.toThrow();
    });

    it('should handle null file path', () => {
      expect(() => cleanupFile(null)).not.toThrow();
    });

    it('should handle undefined file path', () => {
      expect(() => cleanupFile(undefined)).not.toThrow();
    });
  });

  describe('errorHandler', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' }
        }
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User not found', 'user');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    });

    it('should handle JSON parse errors', () => {
      const error = { type: 'entity.parse.failed', message: 'Invalid JSON' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data'
        }
      });
    });

    it('should handle database errors', () => {
      const error = { code: '23505', message: 'duplicate key' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Duplicate entry found'
        }
      });
    });

    it('should handle Multer file upload errors', () => {
      const error = { name: 'MulterError', code: 'LIMIT_FILE_SIZE', message: 'File too large' };
      req.file = { path: '/tmp/test-file.txt' };

      // Mock fs.existsSync and fs.unlinkSync
      const originalExistsSync = fs.existsSync;
      const originalUnlinkSync = fs.unlinkSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.unlinkSync = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: 'File size too large',
          details: { maxSize: '5MB' }
        }
      });
      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test-file.txt');

      // Restore original functions
      fs.existsSync = originalExistsSync;
      fs.unlinkSync = originalUnlinkSync;
    });

    it('should handle unexpected errors', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ValidationError('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test error',
          stack: 'Error stack trace'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new ValidationError('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test error'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 errors', () => {
      req.method = 'GET';
      req.path = '/api/nonexistent';

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route GET /api/nonexistent not found'
        }
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle sync functions that return promises', async () => {
      const syncFn = (req, res, next) => Promise.resolve('success');
      const wrappedFn = asyncHandler(syncFn);

      await wrappedFn(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should handle sync functions that throw errors', async () => {
      const error = new Error('Sync error');
      const syncFn = () => { throw error; };
      const wrappedFn = asyncHandler(syncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Error logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log error details', () => {
      const error = new ValidationError('Test error');

      errorHandler(error, req, res, next);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall[0]).toContain('ValidationError');
      expect(logCall[1]).toMatchObject({
        message: 'Test error',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1'
      });
    });
  });
});