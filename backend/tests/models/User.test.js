const { User, ROLE_PERMISSIONS } = require('../../models/User');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  describe('User Creation', () => {
    test('should create a new user with default employee role', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword'
      };

      const user = await User.create(userData);

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('employee');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    test('should create a user with specified role', async () => {
      const userData = {
        username: 'adminuser',
        password: 'adminpassword',
        role: 'admin'
      };

      const user = await User.create(userData);

      expect(user.role).toBe('admin');
      expect(user.username).toBe('adminuser');
    });

    test('should hash password during creation', async () => {
      const userData = {
        username: 'hashtest',
        password: 'plainpassword'
      };

      const user = await User.create(userData);

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('plainpassword');
      expect(await bcrypt.compare('plainpassword', user.passwordHash)).toBe(true);
    });

    test('should throw error for duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        password: 'password'
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Authentication', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'authtest',
        password: 'testpassword'
      });
    });

    test('should verify correct password', async () => {
      const isValid = await testUser.verifyPassword('testpassword');
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const isValid = await testUser.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should find user by username', async () => {
      const foundUser = await User.findByUsername('authtest');
      
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser.id).toBe(testUser.id);
      expect(foundUser.username).toBe('authtest');
    });

    test('should return null for non-existent username', async () => {
      const foundUser = await User.findByUsername('nonexistent');
      expect(foundUser).toBeNull();
    });

    test('should find user by ID', async () => {
      const foundUser = await User.findById(testUser.id);
      
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser.id).toBe(testUser.id);
      expect(foundUser.username).toBe('authtest');
    });
  });

  describe('Role-Based Permissions', () => {
    let employeeUser, adminUser, superAdminUser;

    beforeEach(async () => {
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
    });

    describe('hasPermission method', () => {
      test('employee should have limited permissions', () => {
        expect(employeeUser.hasPermission('orders:create')).toBe(true);
        expect(employeeUser.hasPermission('orders:read')).toBe(true);
        expect(employeeUser.hasPermission('orders:update_limited')).toBe(true);
        expect(employeeUser.hasPermission('expenses:create')).toBe(true);
        expect(employeeUser.hasPermission('expenses:read')).toBe(true);
        
        // Should not have admin permissions
        expect(employeeUser.hasPermission('orders:delete')).toBe(false);
        expect(employeeUser.hasPermission('expenses:update')).toBe(false);
        expect(employeeUser.hasPermission('analytics:read')).toBe(false);
        expect(employeeUser.hasPermission('business_settings:read')).toBe(false);
      });

      test('admin should have extended permissions', () => {
        expect(adminUser.hasPermission('orders:create')).toBe(true);
        expect(adminUser.hasPermission('orders:read')).toBe(true);
        expect(adminUser.hasPermission('orders:update')).toBe(true);
        expect(adminUser.hasPermission('orders:delete')).toBe(true);
        expect(adminUser.hasPermission('orders:reject')).toBe(true);
        expect(adminUser.hasPermission('expenses:create')).toBe(true);
        expect(adminUser.hasPermission('expenses:read')).toBe(true);
        expect(adminUser.hasPermission('expenses:update')).toBe(true);
        expect(adminUser.hasPermission('expenses:delete')).toBe(true);
        expect(adminUser.hasPermission('analytics:read')).toBe(true);
        expect(adminUser.hasPermission('dashboard:read')).toBe(true);
        
        // Should not have super admin permissions
        expect(adminUser.hasPermission('business_settings:read')).toBe(false);
        expect(adminUser.hasPermission('users:create')).toBe(false);
      });

      test('super admin should have all permissions', () => {
        expect(superAdminUser.hasPermission('orders:create')).toBe(true);
        expect(superAdminUser.hasPermission('orders:delete')).toBe(true);
        expect(superAdminUser.hasPermission('expenses:update')).toBe(true);
        expect(superAdminUser.hasPermission('analytics:read')).toBe(true);
        expect(superAdminUser.hasPermission('business_settings:read')).toBe(true);
        expect(superAdminUser.hasPermission('business_settings:update')).toBe(true);
        expect(superAdminUser.hasPermission('users:create')).toBe(true);
        expect(superAdminUser.hasPermission('users:read')).toBe(true);
        expect(superAdminUser.hasPermission('users:update')).toBe(true);
        expect(superAdminUser.hasPermission('users:delete')).toBe(true);
        
        // Should have wildcard permission
        expect(superAdminUser.hasPermission('any:permission')).toBe(true);
      });
    });

    describe('canEditOrder method', () => {
      test('employee can edit pending unpaid orders', () => {
        const pendingOrder = {
          status: 'Pending',
          payment_status: 'Unpaid'
        };

        expect(employeeUser.canEditOrder(pendingOrder)).toBe(true);
      });

      test('employee can edit in-progress unpaid orders', () => {
        const inProgressOrder = {
          status: 'In Progress',
          payment_status: 'Unpaid'
        };

        expect(employeeUser.canEditOrder(inProgressOrder)).toBe(true);
      });

      test('employee cannot edit completed orders', () => {
        const completedOrder = {
          status: 'Completed',
          payment_status: 'Unpaid'
        };

        expect(employeeUser.canEditOrder(completedOrder)).toBe(false);
      });

      test('employee cannot edit paid orders', () => {
        const paidOrder = {
          status: 'Pending',
          payment_status: 'Paid'
        };

        expect(employeeUser.canEditOrder(paidOrder)).toBe(false);
      });

      test('admin can edit any order', () => {
        const completedPaidOrder = {
          status: 'Completed',
          payment_status: 'Paid'
        };

        expect(adminUser.canEditOrder(completedPaidOrder)).toBe(true);
      });

      test('super admin can edit any order', () => {
        const completedPaidOrder = {
          status: 'Completed',
          payment_status: 'Paid'
        };

        expect(superAdminUser.canEditOrder(completedPaidOrder)).toBe(true);
      });
    });

    describe('canEditExpense method', () => {
      test('employee cannot edit expenses', () => {
        const expense = { id: 1, amount: 100 };
        expect(employeeUser.canEditExpense(expense)).toBe(false);
      });

      test('admin can edit expenses', () => {
        const expense = { id: 1, amount: 100 };
        expect(adminUser.canEditExpense(expense)).toBe(true);
      });

      test('super admin can edit expenses', () => {
        const expense = { id: 1, amount: 100 };
        expect(superAdminUser.canEditExpense(expense)).toBe(true);
      });
    });

    describe('canRejectOrder method', () => {
      test('employee cannot reject orders', () => {
        expect(employeeUser.canRejectOrder()).toBe(false);
      });

      test('admin can reject orders', () => {
        expect(adminUser.canRejectOrder()).toBe(true);
      });

      test('super admin can reject orders', () => {
        expect(superAdminUser.canRejectOrder()).toBe(true);
      });
    });

    describe('canAccessBusinessSettings method', () => {
      test('employee cannot access business settings', () => {
        expect(employeeUser.canAccessBusinessSettings()).toBe(false);
      });

      test('admin cannot access business settings', () => {
        expect(adminUser.canAccessBusinessSettings()).toBe(false);
      });

      test('super admin can access business settings', () => {
        expect(superAdminUser.canAccessBusinessSettings()).toBe(true);
      });
    });

    describe('canManageUsers method', () => {
      test('employee cannot manage users', () => {
        expect(employeeUser.canManageUsers()).toBe(false);
      });

      test('admin cannot manage users', () => {
        expect(adminUser.canManageUsers()).toBe(false);
      });

      test('super admin can manage users', () => {
        expect(superAdminUser.canManageUsers()).toBe(true);
      });
    });
  });

  describe('Role Management', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'roletest',
        password: 'password',
        role: 'employee'
      });
    });

    test('should update user role', async () => {
      await testUser.updateRole('admin');
      
      expect(testUser.role).toBe('admin');
      expect(testUser.hasPermission('analytics:read')).toBe(true);
    });

    test('should throw error for invalid role', async () => {
      await expect(testUser.updateRole('invalid_role')).rejects.toThrow('Invalid role specified');
    });

    test('should get role display name', () => {
      expect(testUser.getRoleDisplayName()).toBe('Employee');
      
      testUser.role = 'admin';
      expect(testUser.getRoleDisplayName()).toBe('Admin');
      
      testUser.role = 'super_admin';
      expect(testUser.getRoleDisplayName()).toBe('Super Admin');
    });

    test('should find users by role', async () => {
      await User.create({
        username: 'admin1',
        password: 'password',
        role: 'admin'
      });

      await User.create({
        username: 'admin2',
        password: 'password',
        role: 'admin'
      });

      const adminUsers = await User.findByRole('admin');
      expect(adminUsers).toHaveLength(2);
      expect(adminUsers.every(user => user.role === 'admin')).toBe(true);
    });
  });

  describe('Static Methods', () => {
    test('should get role permissions', () => {
      const employeePermissions = User.getRolePermissions('employee');
      expect(employeePermissions).toContain('orders:create');
      expect(employeePermissions).toContain('expenses:read');
      expect(employeePermissions).not.toContain('analytics:read');

      const superAdminPermissions = User.getRolePermissions('super_admin');
      expect(superAdminPermissions).toContain('*');
    });

    test('should check role permissions statically', () => {
      expect(User.roleHasPermission('employee', 'orders:create')).toBe(true);
      expect(User.roleHasPermission('employee', 'analytics:read')).toBe(false);
      expect(User.roleHasPermission('super_admin', 'any:permission')).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'jsontest',
        password: 'password',
        role: 'admin'
      });
    });

    test('should serialize to JSON without password hash', () => {
      const json = testUser.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('username', 'jsontest');
      expect(json).toHaveProperty('role', 'admin');
      expect(json).toHaveProperty('roleDisplayName', 'Admin');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json).not.toHaveProperty('passwordHash');
    });

    test('should serialize to safe JSON with minimal info', () => {
      const safeJson = testUser.toSafeJSON();
      
      expect(safeJson).toHaveProperty('id');
      expect(safeJson).toHaveProperty('username', 'jsontest');
      expect(safeJson).toHaveProperty('role', 'admin');
      expect(safeJson).toHaveProperty('roleDisplayName', 'Admin');
      expect(safeJson).not.toHaveProperty('createdAt');
      expect(safeJson).not.toHaveProperty('updatedAt');
      expect(safeJson).not.toHaveProperty('passwordHash');
    });
  });

  describe('User Management Operations', () => {
    test('should get all users', async () => {
      await User.create({ username: 'user1', password: 'pass', role: 'employee' });
      await User.create({ username: 'user2', password: 'pass', role: 'admin' });
      await User.create({ username: 'user3', password: 'pass', role: 'super_admin' });

      const allUsers = await User.findAll();
      expect(allUsers.length).toBeGreaterThanOrEqual(3);
      expect(allUsers.every(user => user instanceof User)).toBe(true);
    });

    test('should delete user', async () => {
      const user = await User.create({
        username: 'deletetest',
        password: 'password'
      });

      const result = await user.delete();
      expect(result).toBe(true);

      const deletedUser = await User.findById(user.id);
      expect(deletedUser).toBeNull();
    });

    test('should update password', async () => {
      const user = await User.create({
        username: 'passwordtest',
        password: 'oldpassword'
      });

      await user.updatePassword('newpassword');

      expect(await user.verifyPassword('newpassword')).toBe(true);
      expect(await user.verifyPassword('oldpassword')).toBe(false);
    });
  });
});

describe('ROLE_PERMISSIONS Configuration', () => {
  test('should have correct employee permissions', () => {
    const employeePerms = ROLE_PERMISSIONS.employee;
    expect(employeePerms).toContain('orders:create');
    expect(employeePerms).toContain('orders:read');
    expect(employeePerms).toContain('orders:update_limited');
    expect(employeePerms).toContain('expenses:create');
    expect(employeePerms).toContain('expenses:read');
    expect(employeePerms).not.toContain('orders:delete');
    expect(employeePerms).not.toContain('analytics:read');
  });

  test('should have correct admin permissions', () => {
    const adminPerms = ROLE_PERMISSIONS.admin;
    expect(adminPerms).toContain('orders:create');
    expect(adminPerms).toContain('orders:read');
    expect(adminPerms).toContain('orders:update');
    expect(adminPerms).toContain('orders:delete');
    expect(adminPerms).toContain('orders:reject');
    expect(adminPerms).toContain('expenses:create');
    expect(adminPerms).toContain('expenses:read');
    expect(adminPerms).toContain('expenses:update');
    expect(adminPerms).toContain('expenses:delete');
    expect(adminPerms).toContain('analytics:read');
    expect(adminPerms).toContain('dashboard:read');
    expect(adminPerms).not.toContain('business_settings:read');
  });

  test('should have correct super admin permissions', () => {
    const superAdminPerms = ROLE_PERMISSIONS.super_admin;
    expect(superAdminPerms).toContain('*');
    expect(superAdminPerms).toContain('orders:reject');
    expect(superAdminPerms).toContain('business_settings:read');
    expect(superAdminPerms).toContain('business_settings:update');
    expect(superAdminPerms).toContain('users:create');
    expect(superAdminPerms).toContain('users:read');
    expect(superAdminPerms).toContain('users:update');
    expect(superAdminPerms).toContain('users:delete');
  });
});