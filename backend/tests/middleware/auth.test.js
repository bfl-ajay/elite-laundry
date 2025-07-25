const { basicAuth, requireAuth, authenticate, optionalAuth } = require('../../middleware/auth');
const User = require('../../models/User');

describe('Authentication Middleware', () => {
  let testUser;
  let req, res, next;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      username: 'middlewaretest',
      password: 'testpassword'
    });

    req = {
      headers: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('basicAuth middleware', () => {
    it('should authenticate valid Basic Auth credentials', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      req.headers.authorization = authHeader;

      await basicAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('middlewaretest');
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing Authorization header', async () => {
      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Basic authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-Basic Authorization header', async () => {
      req.headers.authorization = 'Bearer token123';

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Basic authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid Base64 credentials', async () => {
      req.headers.authorization = 'Basic invalid-base64';

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject malformed credentials', async () => {
      const malformedCredentials = Buffer.from('onlyusername').toString('base64');
      req.headers.authorization = `Basic ${malformedCredentials}`;

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials format'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-existent username', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('nonexistent', 'password');
      req.headers.authorization = authHeader;

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid password', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'wrongpassword');
      req.headers.authorization = authHeader;

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock User.findByUsername to throw an error
      const originalFindByUsername = User.findByUsername;
      User.findByUsername = jest.fn().mockRejectedValue(new Error('Database error'));

      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      req.headers.authorization = authHeader;

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Authentication error'
        }
      });
      expect(next).not.toHaveBeenCalled();

      // Restore original method
      User.findByUsername = originalFindByUsername;
    });
  });

  describe('requireAuth middleware', () => {
    it('should allow access with valid session', () => {
      req.session.userId = testUser.id;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without session', () => {
      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty session', () => {
      req.session.userId = null;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticate middleware', () => {
    it('should use Basic Auth when Authorization header is present', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      req.headers.authorization = authHeader;

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('middlewaretest');
    });

    it('should fall back to session auth when no Authorization header', () => {
      req.session.userId = testUser.id;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject when neither Basic Auth nor session is valid', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should prioritize Basic Auth over session', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      req.headers.authorization = authHeader;
      req.session.userId = 999; // Different user ID

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('middlewaretest');
    });
  });

  describe('optionalAuth middleware', () => {
    it('should always call next regardless of authentication status', () => {
      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should not modify request or response', () => {
      const originalReq = { ...req };
      const originalRes = { ...res };

      optionalAuth(req, res, next);

      expect(req).toEqual(originalReq);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('Authentication flow integration', () => {
    it('should handle multiple authentication attempts', async () => {
      // First attempt with invalid credentials
      const invalidAuthHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'wrongpassword');
      req.headers.authorization = invalidAuthHeader;

      await basicAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();

      // Reset mocks
      res.status.mockClear();
      res.json.mockClear();
      next.mockClear();

      // Second attempt with valid credentials
      const validAuthHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      req.headers.authorization = validAuthHeader;

      await basicAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle concurrent authentication requests', async () => {
      const authHeader = testUtils.generateBasicAuthHeader('middlewaretest', 'testpassword');
      
      const req1 = { headers: { authorization: authHeader }, session: {} };
      const req2 = { headers: { authorization: authHeader }, session: {} };
      
      const res1 = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const res2 = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
      const next1 = jest.fn();
      const next2 = jest.fn();

      // Execute both authentications concurrently
      await Promise.all([
        basicAuth(req1, res1, next1),
        basicAuth(req2, res2, next2)
      ]);

      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
      expect(req1.user).toBeDefined();
      expect(req2.user).toBeDefined();
      expect(req1.user.username).toBe('middlewaretest');
      expect(req2.user.username).toBe('middlewaretest');
    });
  });
});