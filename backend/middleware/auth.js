const { User } = require('../models/User');

// Basic Authentication middleware
const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Basic authentication required'
        }
      });
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials format'
        }
      });
    }

    // Find and verify user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Basic auth error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Session-based authentication middleware (for compatibility)
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    // Load user with role information
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Session auth error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Combined authentication middleware (checks both Basic Auth and session)
const authenticate = async (req, res, next) => {
  console.log('Authentication middleware called for:', req.method, req.path);
  console.log('Auth header present:', !!req.headers.authorization);
  console.log('Session userId:', req.session?.userId);
  
  // First try Basic Auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    console.log('Using Basic Auth');
    return basicAuth(req, res, next);
  }
  
  // Fall back to session auth
  console.log('Using Session Auth');
  return requireAuth(req, res, next);
};

// Optional authentication middleware (doesn't block if not authenticated)
const optionalAuth = (req, res, next) => {
  // Just pass through, authentication status can be checked via req.session.userId
  next();
};

module.exports = {
  basicAuth,
  requireAuth,
  authenticate,
  optionalAuth
};