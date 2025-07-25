const { User } = require('../../models/User');

/**
 * Test data fixtures for role-based testing
 */
class RoleTestData {
  constructor() {
    this.users = {};
    this.orders = {};
    this.expenses = {};
  }

  /**
   * Create test users for all roles
   */
  async createTestUsers() {
    this.users.employee = await User.create({
      username: 'employee_test',
      password: 'employee_password',
      role: 'employee'
    });

    this.users.admin = await User.create({
      username: 'admin_test',
      password: 'admin_password',
      role: 'admin'
    });

    this.users.superAdmin = await User.create({
      username: 'superadmin_test',
      password: 'superadmin_password',
      role: 'super_admin'
    });

    return this.users;
  }

  /**
   * Create test orders with different statuses
   */
  async createTestOrders() {
    const Order = require('../../models/Order');

    // Pending unpaid order (editable by employee)
    this.orders.pendingUnpaid = await Order.create({
      customerName: 'John Doe',
      contactNumber: '1234567890',
      customerAddress: '123 Main St, City',
      orderDate: '2024-01-15',
      status: 'Pending',
      paymentStatus: 'Unpaid',
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 5,
          unitCost: 10.00
        }
      ]
    });

    // In progress unpaid order (editable by employee)
    this.orders.inProgressUnpaid = await Order.create({
      customerName: 'Jane Smith',
      contactNumber: '0987654321',
      customerAddress: '456 Oak Ave, Town',
      orderDate: '2024-01-16',
      status: 'In Progress',
      paymentStatus: 'Unpaid',
      services: [
        {
          serviceType: 'ironing',
          clothType: 'saari',
          quantity: 3,
          unitCost: 15.00
        }
      ]
    });

    // Completed unpaid order (not editable by employee)
    this.orders.completedUnpaid = await Order.create({
      customerName: 'Bob Johnson',
      contactNumber: '5555555555',
      customerAddress: '789 Pine St, Village',
      orderDate: '2024-01-17',
      status: 'Completed',
      paymentStatus: 'Unpaid',
      services: [
        {
          serviceType: 'dry_cleaning',
          clothType: 'normal',
          quantity: 2,
          unitCost: 25.00
        }
      ]
    });

    // Pending paid order (not editable by employee)
    this.orders.pendingPaid = await Order.create({
      customerName: 'Alice Brown',
      contactNumber: '7777777777',
      customerAddress: '321 Elm St, City',
      orderDate: '2024-01-18',
      status: 'Pending',
      paymentStatus: 'Paid',
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 8,
          unitCost: 12.00
        }
      ]
    });

    // Completed paid order (not editable by employee)
    this.orders.completedPaid = await Order.create({
      customerName: 'Charlie Wilson',
      contactNumber: '9999999999',
      customerAddress: '654 Maple Dr, Town',
      orderDate: '2024-01-19',
      status: 'Completed',
      paymentStatus: 'Paid',
      services: [
        {
          serviceType: 'stain_removal',
          clothType: 'saari',
          quantity: 1,
          unitCost: 30.00
        }
      ]
    });

    // Rejected order
    this.orders.rejected = await Order.create({
      customerName: 'David Lee',
      contactNumber: '1111111111',
      customerAddress: '987 Cedar Ln, Village',
      orderDate: '2024-01-20',
      status: 'Rejected',
      paymentStatus: 'Unpaid',
      rejectionReason: 'Customer requested cancellation',
      rejectedAt: new Date(),
      rejectedBy: this.users.admin?.id,
      services: [
        {
          serviceType: 'washing',
          clothType: 'normal',
          quantity: 4,
          unitCost: 10.00
        }
      ]
    });

    return this.orders;
  }

  /**
   * Create test expenses
   */
  async createTestExpenses() {
    const Expense = require('../../models/Expense');

    this.expenses.utilities = await Expense.create({
      expenseType: 'Utilities',
      amount: 150.00,
      expenseDate: '2024-01-15',
      billAttachment: null
    });

    this.expenses.supplies = await Expense.create({
      expenseType: 'Cleaning Supplies',
      amount: 75.50,
      expenseDate: '2024-01-16',
      billAttachment: 'uploads/expenses/supplies_receipt.pdf'
    });

    this.expenses.maintenance = await Expense.create({
      expenseType: 'Equipment Maintenance',
      amount: 200.00,
      expenseDate: '2024-01-17',
      billAttachment: 'uploads/expenses/maintenance_bill.pdf'
    });

    return this.expenses;
  }

  /**
   * Get user credentials for authentication testing
   */
  getUserCredentials(role) {
    const credentials = {
      employee: {
        username: 'employee_test',
        password: 'employee_password'
      },
      admin: {
        username: 'admin_test',
        password: 'admin_password'
      },
      superAdmin: {
        username: 'superadmin_test',
        password: 'superadmin_password'
      }
    };

    return credentials[role];
  }

  /**
   * Generate basic auth header for testing
   */
  getBasicAuthHeader(role) {
    const credentials = this.getUserCredentials(role);
    if (!credentials) return null;

    const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Get test scenarios for order editing permissions
   */
  getOrderEditScenarios() {
    return [
      {
        name: 'Employee can edit pending unpaid order',
        user: this.users.employee,
        order: this.orders.pendingUnpaid,
        canEdit: true
      },
      {
        name: 'Employee can edit in-progress unpaid order',
        user: this.users.employee,
        order: this.orders.inProgressUnpaid,
        canEdit: true
      },
      {
        name: 'Employee cannot edit completed unpaid order',
        user: this.users.employee,
        order: this.orders.completedUnpaid,
        canEdit: false
      },
      {
        name: 'Employee cannot edit pending paid order',
        user: this.users.employee,
        order: this.orders.pendingPaid,
        canEdit: false
      },
      {
        name: 'Employee cannot edit completed paid order',
        user: this.users.employee,
        order: this.orders.completedPaid,
        canEdit: false
      },
      {
        name: 'Admin can edit any order',
        user: this.users.admin,
        order: this.orders.completedPaid,
        canEdit: true
      },
      {
        name: 'Super admin can edit any order',
        user: this.users.superAdmin,
        order: this.orders.completedPaid,
        canEdit: true
      }
    ];
  }

  /**
   * Get test scenarios for expense editing permissions
   */
  getExpenseEditScenarios() {
    return [
      {
        name: 'Employee cannot edit expenses',
        user: this.users.employee,
        expense: this.expenses.utilities,
        canEdit: false
      },
      {
        name: 'Admin can edit expenses',
        user: this.users.admin,
        expense: this.expenses.utilities,
        canEdit: true
      },
      {
        name: 'Super admin can edit expenses',
        user: this.users.superAdmin,
        expense: this.expenses.utilities,
        canEdit: true
      }
    ];
  }

  /**
   * Get test scenarios for order rejection permissions
   */
  getOrderRejectionScenarios() {
    return [
      {
        name: 'Employee cannot reject orders',
        user: this.users.employee,
        canReject: false
      },
      {
        name: 'Admin can reject orders',
        user: this.users.admin,
        canReject: true
      },
      {
        name: 'Super admin can reject orders',
        user: this.users.superAdmin,
        canReject: true
      }
    ];
  }

  /**
   * Get test scenarios for business settings access
   */
  getBusinessSettingsScenarios() {
    return [
      {
        name: 'Employee cannot access business settings',
        user: this.users.employee,
        canAccess: false
      },
      {
        name: 'Admin cannot access business settings',
        user: this.users.admin,
        canAccess: false
      },
      {
        name: 'Super admin can access business settings',
        user: this.users.superAdmin,
        canAccess: true
      }
    ];
  }

  /**
   * Get test scenarios for user management permissions
   */
  getUserManagementScenarios() {
    return [
      {
        name: 'Employee cannot manage users',
        user: this.users.employee,
        canManage: false
      },
      {
        name: 'Admin cannot manage users',
        user: this.users.admin,
        canManage: false
      },
      {
        name: 'Super admin can manage users',
        user: this.users.superAdmin,
        canManage: true
      }
    ];
  }

  /**
   * Get navigation items for each role
   */
  getNavigationScenarios() {
    return [
      {
        role: 'employee',
        user: this.users.employee,
        allowedRoutes: ['/orders', '/expenses'],
        deniedRoutes: ['/dashboard', '/analytics', '/settings', '/users']
      },
      {
        role: 'admin',
        user: this.users.admin,
        allowedRoutes: ['/orders', '/expenses', '/dashboard', '/analytics'],
        deniedRoutes: ['/settings', '/users']
      },
      {
        role: 'super_admin',
        user: this.users.superAdmin,
        allowedRoutes: ['/orders', '/expenses', '/dashboard', '/analytics', '/settings', '/users'],
        deniedRoutes: []
      }
    ];
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    // Clean up in reverse order of dependencies
    if (this.orders) {
      for (const order of Object.values(this.orders)) {
        if (order && order.delete) {
          try {
            await order.delete();
          } catch (error) {
            console.warn('Error cleaning up order:', error.message);
          }
        }
      }
    }

    if (this.expenses) {
      for (const expense of Object.values(this.expenses)) {
        if (expense && expense.delete) {
          try {
            await expense.delete();
          } catch (error) {
            console.warn('Error cleaning up expense:', error.message);
          }
        }
      }
    }

    if (this.users) {
      for (const user of Object.values(this.users)) {
        if (user && user.delete) {
          try {
            await user.delete();
          } catch (error) {
            console.warn('Error cleaning up user:', error.message);
          }
        }
      }
    }
  }
}

module.exports = RoleTestData;