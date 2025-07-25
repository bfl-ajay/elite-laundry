const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Role-based permission constants
const ROLE_PERMISSIONS = {
  employee: [
    'orders:create',
    'orders:read',
    'orders:update_limited', // Only if not completed/paid
    'expenses:create',
    'expenses:read'
  ],
  admin: [
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'orders:reject', // Can reject orders
    'expenses:create',
    'expenses:read',
    'expenses:update',
    'expenses:delete',
    'analytics:read',
    'dashboard:read'
  ],
  super_admin: [
    '*', // All permissions
    'orders:reject', // Can reject orders
    'business_settings:read',
    'business_settings:update',
    'users:create',
    'users:read',
    'users:update',
    'users:delete'
  ]
};

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.password_hash;
    this.role = data.role || 'employee';
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { username, password, role = 'employee' } = userData;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [username, passwordHash, role]);
    return new User(result.rows[0]);
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Update password
  async updatePassword(newPassword) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [passwordHash, this.id]);
    const updatedUser = new User(result.rows[0]);
    
    // Update current instance
    this.passwordHash = updatedUser.passwordHash;
    this.updatedAt = updatedUser.updatedAt;
    
    return this;
  }

  // Get all users (admin function)
  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    
    return result.rows.map(row => new User(row));
  }

  // Delete user
  async delete() {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Check if user has a specific permission
  hasPermission(permission) {
    const userPermissions = ROLE_PERMISSIONS[this.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  // Check if user can edit an order based on role and order status
  canEditOrder(order) {
    if (this.role === 'employee') {
      // Employees can only edit orders that are not completed and not paid
      return order.status !== 'Completed' && order.payment_status !== 'Paid';
    }
    // Admin and Super Admin can edit any order
    return this.hasPermission('orders:update');
  }

  // Check if user can edit expenses
  canEditExpense(expense) {
    // Only Admin and Super Admin can edit expenses
    return this.role !== 'employee' && this.hasPermission('expenses:update');
  }

  // Check if user can reject orders
  canRejectOrder() {
    return this.hasPermission('orders:reject');
  }

  // Check if user can access business settings
  canAccessBusinessSettings() {
    return this.hasPermission('business_settings:read');
  }

  // Check if user can manage other users
  canManageUsers() {
    return this.hasPermission('users:create');
  }

  // Get user's role display name
  getRoleDisplayName() {
    const roleNames = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'employee': 'Employee'
    };
    return roleNames[this.role] || 'Unknown';
  }

  // Update user role (admin/super_admin only)
  async updateRole(newRole, updatedBy) {
    if (!['super_admin', 'admin', 'employee'].includes(newRole)) {
      throw new Error('Invalid role specified');
    }

    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [newRole, this.id]);
    const updatedUser = new User(result.rows[0]);
    
    // Update current instance
    this.role = updatedUser.role;
    this.updatedAt = updatedUser.updatedAt;
    
    return this;
  }

  // Get users by role
  static async findByRole(role) {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [role]);
    
    return result.rows.map(row => new User(row));
  }

  // Convert to JSON (exclude password hash, include role)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      roleDisplayName: this.getRoleDisplayName(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to safe JSON for client (minimal info)
  toSafeJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      roleDisplayName: this.getRoleDisplayName()
    };
  }

  // Static method to get role permissions
  static getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Static method to check if a role has a specific permission
  static roleHasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}

module.exports = { User, ROLE_PERMISSIONS };