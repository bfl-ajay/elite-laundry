const { User, ROLE_PERMISSIONS } = require('../models/User');

// Role-based authorization middleware
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to perform this action'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed'
        }
      });
    }
  };
};

// Permission-based authorization middleware
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (!req.user.hasPermission(requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to perform this action'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission authorization error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Permission check failed'
        }
      });
    }
  };
};

// Middleware to check if user can edit a specific order
const canEditOrder = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    // For employees, we need to check the order status
    if (req.user.role === 'employee' && req.order) {
      if (!req.user.canEditOrder(req.order)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ORDER_EDIT_RESTRICTED',
            message: 'Cannot edit completed or paid orders'
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Order edit authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Order edit permission check failed'
      }
    });
  }
};

// Middleware to check if user can edit expenses
const canEditExpense = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!req.user.canEditExpense()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EXPENSE_EDIT_RESTRICTED',
          message: 'Employees cannot edit expenses after creation'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Expense edit authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Expense edit permission check failed'
      }
    });
  }
};

// Utility function to check if user has required permission
const hasRequiredPermission = (userRole, requiredPermission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(requiredPermission);
};

module.exports = {
  requireRole,
  requirePermission,
  canEditOrder,
  canEditExpense,
  hasRequiredPermission
};