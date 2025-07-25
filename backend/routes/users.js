const express = require('express');
const { User } = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { validateUserCreation, validateUserUpdate } = require('../middleware/validation');
const pool = require('../config/database');

const router = express.Router();

// Get all users (Super Admin only)
router.get('/', authenticate, requireRole(['super_admin']), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      data: users.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_USERS_ERROR', message: 'Failed to fetch users' }
    });
  }
});

// Get user by ID (Super Admin only)
router.get('/:id', authenticate, requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }
    
    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_USER_ERROR', message: 'Failed to fetch user' }
    });
  }
});

// Create new user (Super Admin only)
router.post('/', authenticate, requireRole(['super_admin']), validateUserCreation, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USERNAME_EXISTS', message: 'Username already exists' }
      });
    }
    
    // Create new user
    const newUser = await User.create({ username, password, role });
    
    // Log user creation action
    console.log(`User created: ${newUser.username} (${newUser.role}) by ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      data: newUser.toJSON(),
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_USER_ERROR', message: 'Failed to create user' }
    });
  }
});

// Update user (Super Admin only)
router.put('/:id', authenticate, requireRole(['super_admin']), validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }
    
    // Prevent super admin from changing their own role
    if (user.id === req.user.id && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_CHANGE_OWN_ROLE', message: 'Cannot change your own role' }
      });
    }
    
    // Check if new username already exists (if username is being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { code: 'USERNAME_EXISTS', message: 'Username already exists' }
        });
      }
      
      // Update username
      const query = `
        UPDATE users 
        SET username = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [username, id]);
      user.username = result.rows[0].username;
      user.updatedAt = result.rows[0].updated_at;
    }
    
    // Update password if provided
    if (password) {
      await user.updatePassword(password);
    }
    
    // Update role if provided
    if (role && role !== user.role) {
      await user.updateRole(role, req.user.id);
    }
    
    // Log user update action
    console.log(`User updated: ${user.username} by ${req.user.username}`);
    
    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_USER_ERROR', message: 'Failed to update user' }
    });
  }
});

// Delete user (Super Admin only)
router.delete('/:id', authenticate, requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }
    
    // Prevent super admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SELF', message: 'Cannot delete your own account' }
      });
    }
    
    // Check if this is the last super admin
    const superAdmins = await User.findByRole('super_admin');
    if (user.role === 'super_admin' && superAdmins.length <= 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'LAST_SUPER_ADMIN', message: 'Cannot delete the last super admin' }
      });
    }
    
    await user.delete();
    
    // Log user deletion action
    console.log(`User deleted: ${user.username} by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_USER_ERROR', message: 'Failed to delete user' }
    });
  }
});

// Get users by role (Super Admin only)
router.get('/role/:role', authenticate, requireRole(['super_admin']), async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['super_admin', 'admin', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid role specified' }
      });
    }
    
    const users = await User.findByRole(role);
    res.json({
      success: true,
      data: users.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_USERS_BY_ROLE_ERROR', message: 'Failed to fetch users by role' }
    });
  }
});

module.exports = router;