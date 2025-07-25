const { requireRole, requirePermission, canEditOrder, canEditExpense, hasRequiredPermission } = require('../../middleware/roleAuth');
const { User } = require('../../models/User');

describe('Role-Based Authorization Middleware', () => {
  let mockReq, mockRes, mockNext;
  let employeeUser, adminUser, superAdminUser;

  beforeEach(async () => {
    // Create test users
    employeeUser = await User.create({
      username: 'employee',
      password: 'password',
      role: 'employee'
    });

    adminUser = await User.create({
      username: 'admin',
      password: 'password',
      role: 'admin'
    });

    superAdminUser = await User.create({
      username: 'superadmin',
      password: 'password',
      role: 'super_admin'
    });

    // Mock request, response, and next
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole middleware', () => {
    test('should allow access for matching single role', () => {
      mockReq.user = employeeUser;
      const middleware = requireRole('employee');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow access for matching role in array', () => {
      mockReq.user = adminUser;
      const middleware = requireRole(['admin', 'super_admin']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access for non-matching role', () => {
      mockReq.user = employeeUser;
      const middleware = requireRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    });

    test('should deny access when user is not authenticated', () => {
      mockReq.user = null;
      const middleware = requireRole('employee');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    });

    test('should handle errors gracefully', () => {
      mockReq.user = { role: 'invalid' };
      const middleware = requireRole('admin');

      middleware(mockReq, mockRes, mockNext);

      // Invalid role should result in 403 (insufficient permissions)
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    });
  });

  describe('requirePermission middleware', () => {
    test('should allow access when user has permission', () => {
      mockReq.user = adminUser;
      const middleware = requirePermission('orders:update');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access when user lacks permission', () => {
      mockReq.user = employeeUser;
      const middleware = requirePermission('orders:delete');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    });

    test('should allow super admin access to any permission', () => {
      mockReq.user = superAdminUser;
      const middleware = requirePermission('any:custom:permission');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      mockReq.user = null;
      const middleware = requirePermission('orders:read');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    });
  });

  describe('canEditOrder middleware', () => {
    test('should allow employee to edit pending unpaid order', () => {
      mockReq.user = employeeUser;
      mockReq.order = {
        status: 'Pending',
        payment_status: 'Unpaid'
      };

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny employee editing completed order', () => {
      mockReq.user = employeeUser;
      mockReq.order = {
        status: 'Completed',
        payment_status: 'Unpaid'
      };

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_EDIT_RESTRICTED',
          message: 'Cannot edit completed or paid orders'
        }
      });
    });

    test('should deny employee editing paid order', () => {
      mockReq.user = employeeUser;
      mockReq.order = {
        status: 'Pending',
        payment_status: 'Paid'
      };

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_EDIT_RESTRICTED',
          message: 'Cannot edit completed or paid orders'
        }
      });
    });

    test('should allow admin to edit any order', () => {
      mockReq.user = adminUser;
      mockReq.order = {
        status: 'Completed',
        payment_status: 'Paid'
      };

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow super admin to edit any order', () => {
      mockReq.user = superAdminUser;
      mockReq.order = {
        status: 'Completed',
        payment_status: 'Paid'
      };

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should work without order object for non-employees', () => {
      mockReq.user = adminUser;
      // No order object set

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      mockReq.user = null;

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    });
  });

  describe('canEditExpense middleware', () => {
    test('should deny employee expense editing', () => {
      mockReq.user = employeeUser;

      canEditExpense(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EXPENSE_EDIT_RESTRICTED',
          message: 'Employees cannot edit expenses after creation'
        }
      });
    });

    test('should allow admin expense editing', () => {
      mockReq.user = adminUser;

      canEditExpense(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow super admin expense editing', () => {
      mockReq.user = superAdminUser;

      canEditExpense(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      mockReq.user = null;

      canEditExpense(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    });
  });

  describe('hasRequiredPermission utility function', () => {
    test('should return true for employee with valid permission', () => {
      const result = hasRequiredPermission('employee', 'orders:create');
      expect(result).toBe(true);
    });

    test('should return false for employee with invalid permission', () => {
      const result = hasRequiredPermission('employee', 'orders:delete');
      expect(result).toBe(false);
    });

    test('should return true for admin with valid permission', () => {
      const result = hasRequiredPermission('admin', 'analytics:read');
      expect(result).toBe(true);
    });

    test('should return false for admin with super admin permission', () => {
      const result = hasRequiredPermission('admin', 'business_settings:read');
      expect(result).toBe(false);
    });

    test('should return true for super admin with any permission', () => {
      const result = hasRequiredPermission('super_admin', 'any:custom:permission');
      expect(result).toBe(true);
    });

    test('should return false for invalid role', () => {
      const result = hasRequiredPermission('invalid_role', 'orders:read');
      expect(result).toBe(false);
    });

    test('should handle undefined role gracefully', () => {
      const result = hasRequiredPermission(undefined, 'orders:read');
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle middleware errors in requireRole', () => {
      // Create a user object that will cause an error when role is accessed
      mockReq.user = {};
      Object.defineProperty(mockReq.user, 'role', {
        get: () => {
          throw new Error('Test error');
        }
      });
      
      const middleware = requireRole('admin');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed'
        }
      });

      consoleSpy.mockRestore();
    });

    test('should handle middleware errors in requirePermission', () => {
      mockReq.user = { hasPermission: null };
      const middleware = requirePermission('orders:read');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Permission check failed'
        }
      });

      consoleSpy.mockRestore();
    });

    test('should handle middleware errors in canEditOrder', () => {
      mockReq.user = { role: 'employee', canEditOrder: null };
      mockReq.order = { status: 'Pending' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      canEditOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Order edit permission check failed'
        }
      });

      consoleSpy.mockRestore();
    });

    test('should handle middleware errors in canEditExpense', () => {
      mockReq.user = { canEditExpense: null };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      canEditExpense(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Expense edit permission check failed'
        }
      });

      consoleSpy.mockRestore();
    });
  });
});