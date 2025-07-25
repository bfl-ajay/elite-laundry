const express = require('express');
const { User } = require('../models/User');
const { basicAuth, authenticate } = require('../middleware/auth');
const { authValidations } = require('../middleware/validation');
const { asyncHandler, AuthenticationError, DatabaseError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     description: Login with username and password using either form data or Basic Auth header
 *     tags: [Authentication]
 *     security:
 *       - basicAuth: []
 *       - {}
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for authentication
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: password123
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authValidations.login, asyncHandler(async (req, res) => {
  try {
    let username, password;
    
    // Check if Basic Auth is provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      [username, password] = credentials.split(':');
    } else {
      // Use form data
      ({ username, password } = req.body);
    }

    if (!username || !password) {
      throw new AuthenticationError('Username and password are required');
    }

    // Find and verify user
    const user = await User.findByUsername(username);
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Store user session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new DatabaseError('An error occurred during login', error);
  }
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and destroy session
 *     description: Destroys the current user session and logs out the user
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Server error during logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Could not log out'
        }
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check authentication status
 *     description: Returns current authentication status and user information if authenticated
 *     tags: [Authentication]
 *     security:
 *       - basicAuth: []
 *       - sessionAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Authentication status retrieved successfully
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
 *                         authenticated:
 *                           type: boolean
 *                           description: Whether user is authenticated
 *                           example: true
 *                         user:
 *                           oneOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: 'null'
 *                           description: User information if authenticated, null otherwise
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status', asyncHandler(async (req, res) => {
  try {
    // Check Basic Auth first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (username && password) {
        const user = await User.findByUsername(username);
        if (user && await user.verifyPassword(password)) {
          return res.json({
            success: true,
            data: {
              authenticated: true,
              user: user.toJSON(),
              authMethod: 'basic'
            }
          });
        }
      }
    }
    
    // Check session auth
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      return res.json({
        success: true,
        data: {
          authenticated: true,
          user: user ? user.toJSON() : {
            id: req.session.userId,
            username: req.session.username
          },
          authMethod: 'session'
        }
      });
    }

    // Not authenticated
    res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  } catch (error) {
    throw new DatabaseError('Error checking authentication status', error);
  }
}));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user account
 *     description: Register a new user with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Unique username for the new account
 *                 example: newuser
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Password for the new account
 *                 example: securepassword123
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: newuser
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: securepassword123
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authValidations.register, asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username already exists',
          code: 'USERNAME_EXISTS',
          details: [{
            field: 'username',
            message: 'This username is already taken'
          }]
        }
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new DatabaseError('Failed to create user');
  }
}));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user account
 *     description: Register a new user with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Unique username for the new account
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 description: Password for the new account
 *                 example: securepassword123
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 example: securepassword123
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authValidations.register, asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username already exists',
          code: 'USERNAME_EXISTS',
          details: [{
            field: 'username',
            message: 'This username is already taken'
          }]
        }
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username already exists',
          code: 'USERNAME_EXISTS',
          details: [{
            field: 'username',
            message: 'This username is already taken'
          }]
        }
      });
    }
    throw new DatabaseError('Failed to create user');
  }
}));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user account
 *     description: Register a new user with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Unique username for the new account
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 description: Password for the new account
 *                 example: securepassword123
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 example: securepassword123
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authValidations.register, asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username already exists',
          code: 'USERNAME_EXISTS',
          details: [{
            field: 'username',
            message: 'This username is already taken'
          }]
        }
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username already exists',
          code: 'USERNAME_EXISTS',
          details: [{
            field: 'username',
            message: 'This username is already taken'
          }]
        }
      });
    }
    throw new DatabaseError('Failed to create user');
  }
}));

module.exports = router;