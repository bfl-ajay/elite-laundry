import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as authService from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService');

// Test component to access auth context
const TestComponent = () => {
  const { user, login, logout, isAuthenticated, hasPermission, canEditOrder, canEditExpense } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
      <div data-testid="user-display-name">{user?.roleDisplayName || 'no-display-name'}</div>
      <div data-testid="can-create-orders">{hasPermission('orders:create') ? 'yes' : 'no'}</div>
      <div data-testid="can-delete-orders">{hasPermission('orders:delete') ? 'yes' : 'no'}</div>
      <div data-testid="can-access-settings">{hasPermission('business_settings:read') ? 'yes' : 'no'}</div>
      <div data-testid="can-manage-users">{hasPermission('users:create') ? 'yes' : 'no'}</div>
      <div data-testid="can-edit-pending-order">
        {canEditOrder({ status: 'Pending', payment_status: 'Unpaid' }) ? 'yes' : 'no'}
      </div>
      <div data-testid="can-edit-completed-order">
        {canEditOrder({ status: 'Completed', payment_status: 'Paid' }) ? 'yes' : 'no'}
      </div>
      <div data-testid="can-edit-expense">{canEditExpense({}) ? 'yes' : 'no'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuthProvider = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext Role-Based Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Employee Role Authentication', () => {
    const employeeUser = {
      id: 1,
      username: 'employee',
      role: 'employee',
      roleDisplayName: 'Employee'
    };

    beforeEach(() => {
      authService.login.mockResolvedValue({
        success: true,
        data: { user: employeeUser, token: 'employee-token' }
      });
    });

    test('should authenticate employee and set correct permissions', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('employee');
      expect(screen.getByTestId('user-display-name')).toHaveTextContent('Employee');
      expect(screen.getByTestId('can-create-orders')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-delete-orders')).toHaveTextContent('no');
      expect(screen.getByTestId('can-access-settings')).toHaveTextContent('no');
      expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
    });

    test('should allow employee to edit pending orders but not completed orders', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-pending-order')).toHaveTextContent('yes');
        expect(screen.getByTestId('can-edit-completed-order')).toHaveTextContent('no');
      });
    });

    test('should not allow employee to edit expenses', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-expense')).toHaveTextContent('no');
      });
    });
  });

  describe('Admin Role Authentication', () => {
    const adminUser = {
      id: 2,
      username: 'admin',
      role: 'admin',
      roleDisplayName: 'Admin'
    };

    beforeEach(() => {
      authService.login.mockResolvedValue({
        success: true,
        data: { user: adminUser, token: 'admin-token' }
      });
    });

    test('should authenticate admin and set correct permissions', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('user-display-name')).toHaveTextContent('Admin');
      expect(screen.getByTestId('can-create-orders')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-delete-orders')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-access-settings')).toHaveTextContent('no');
      expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
    });

    test('should allow admin to edit any order', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-pending-order')).toHaveTextContent('yes');
        expect(screen.getByTestId('can-edit-completed-order')).toHaveTextContent('yes');
      });
    });

    test('should allow admin to edit expenses', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-expense')).toHaveTextContent('yes');
      });
    });
  });

  describe('Super Admin Role Authentication', () => {
    const superAdminUser = {
      id: 3,
      username: 'superadmin',
      role: 'super_admin',
      roleDisplayName: 'Super Admin'
    };

    beforeEach(() => {
      authService.login.mockResolvedValue({
        success: true,
        data: { user: superAdminUser, token: 'superadmin-token' }
      });
    });

    test('should authenticate super admin and set correct permissions', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('super_admin');
      expect(screen.getByTestId('user-display-name')).toHaveTextContent('Super Admin');
      expect(screen.getByTestId('can-create-orders')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-delete-orders')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-access-settings')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-manage-users')).toHaveTextContent('yes');
    });

    test('should allow super admin to edit any order', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-pending-order')).toHaveTextContent('yes');
        expect(screen.getByTestId('can-edit-completed-order')).toHaveTextContent('yes');
      });
    });

    test('should allow super admin to edit expenses', async () => {
      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('can-edit-expense')).toHaveTextContent('yes');
      });
    });
  });

  describe('Authentication State Management', () => {
    test('should handle login failure', async () => {
      authService.login.mockResolvedValue({
        success: false,
        error: { message: 'Invalid credentials' }
      });

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('no-role');
    });

    test('should handle logout', async () => {
      const employeeUser = {
        id: 1,
        username: 'employee',
        role: 'employee',
        roleDisplayName: 'Employee'
      };

      authService.login.mockResolvedValue({
        success: true,
        data: { user: employeeUser, token: 'employee-token' }
      });

      authService.logout.mockResolvedValue({ success: true });

      renderWithAuthProvider(<TestComponent />);

      // Login first
      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Then logout
      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('no-role');
    });

    test('should persist authentication state in localStorage', async () => {
      const employeeUser = {
        id: 1,
        username: 'employee',
        role: 'employee',
        roleDisplayName: 'Employee'
      };

      authService.login.mockResolvedValue({
        success: true,
        data: { user: employeeUser, token: 'employee-token' }
      });

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('employee-token');
        expect(JSON.parse(localStorage.getItem('user'))).toEqual(employeeUser);
      });
    });

    test('should restore authentication state from localStorage', () => {
      const storedUser = {
        id: 1,
        username: 'employee',
        role: 'employee',
        roleDisplayName: 'Employee'
      };

      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('user', JSON.stringify(storedUser));

      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-role')).toHaveTextContent('employee');
    });
  });

  describe('Permission Edge Cases', () => {
    test('should handle undefined user gracefully', () => {
      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('can-create-orders')).toHaveTextContent('no');
      expect(screen.getByTestId('can-edit-pending-order')).toHaveTextContent('no');
      expect(screen.getByTestId('can-edit-expense')).toHaveTextContent('no');
    });

    test('should handle invalid role gracefully', async () => {
      const invalidUser = {
        id: 1,
        username: 'invalid',
        role: 'invalid_role',
        roleDisplayName: 'Invalid Role'
      };

      authService.login.mockResolvedValue({
        success: true,
        data: { user: invalidUser, token: 'invalid-token' }
      });

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('invalid_role');
      });

      // Invalid role should have no permissions
      expect(screen.getByTestId('can-create-orders')).toHaveTextContent('no');
      expect(screen.getByTestId('can-delete-orders')).toHaveTextContent('no');
      expect(screen.getByTestId('can-access-settings')).toHaveTextContent('no');
      expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
    });

    test('should handle order editing with missing order data', async () => {
      const employeeUser = {
        id: 1,
        username: 'employee',
        role: 'employee',
        roleDisplayName: 'Employee'
      };

      authService.login.mockResolvedValue({
        success: true,
        data: { user: employeeUser, token: 'employee-token' }
      });

      const TestComponentWithNullOrder = () => {
        const { canEditOrder } = useAuth();
        return (
          <div>
            <div data-testid="can-edit-null-order">{canEditOrder(null) ? 'yes' : 'no'}</div>
            <div data-testid="can-edit-undefined-order">{canEditOrder(undefined) ? 'yes' : 'no'}</div>
          </div>
        );
      };

      renderWithAuthProvider(<TestComponentWithNullOrder />);

      expect(screen.getByTestId('can-edit-null-order')).toHaveTextContent('no');
      expect(screen.getByTestId('can-edit-undefined-order')).toHaveTextContent('no');
    });
  });
});