import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug user state changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AuthProvider: User state changed`, {
      hasUser: !!user,
      userId: user?.id,
      username: user?.username,
      isAuthenticated: !!user,
      loading,
      hasError: !!error
    });
  }, [user, loading, error]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if we have stored credentials
      if (!authService.isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check with server
      const response = await authService.checkAuthStatus();
      
      if (response.success && response.data.authenticated) {
        setUser(response.data.user || authService.getCurrentUser());
      } else {
        // Clear invalid credentials
        await authService.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setError('Failed to verify authentication status');
      // Clear potentially invalid credentials
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AuthContext.login: Starting login process`, {
      username: username,
      passwordProvided: !!password,
      currentUser: user?.username || null,
      isCurrentlyLoading: loading
    });

    try {
      setLoading(true);
      setError(null);
      console.log(`[${timestamp}] AuthContext.login: Set loading=true, cleared error`);

      console.log(`[${timestamp}] AuthContext.login: Calling authService.login`);
      const response = await authService.login(username, password);
      
      console.log(`[${timestamp}] AuthContext.login: AuthService response received`, {
        success: response.success,
        hasUser: !!response.data?.user,
        errorCode: response.error?.code,
        errorMessage: response.error?.message
      });

      if (response.success) {
        setUser(response.data.user);
        console.log(`[${timestamp}] AuthContext.login: Login successful, user set`, {
          userId: response.data.user?.id,
          username: response.data.user?.username
        });
        return { success: true };
      } else {
        const errorMessage = response.error?.message || 'Login failed';
        setError(errorMessage);
        console.log(`[${timestamp}] AuthContext.login: Login failed, error set`, {
          errorMessage,
          errorCode: response.error?.code,
          fullError: response.error
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`[${timestamp}] AuthContext.login: Exception caught`, {
        errorType: error.constructor.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });

      // Determine appropriate error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const serverError = error.response.data?.error;
        
        console.log(`[${timestamp}] AuthContext.login: Processing HTTP error`, {
          status,
          serverError,
          statusText: error.response.statusText
        });

        switch (status) {
          case 401:
            errorMessage = serverError?.message || 'Invalid username or password';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 400:
            errorMessage = serverError?.message || 'Invalid login data';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverError?.message || `Login failed (${status})`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
        console.log(`[${timestamp}] AuthContext.login: Network error detected`);
      }

      setError(errorMessage);
      console.log(`[${timestamp}] AuthContext.login: Final error message set`, { errorMessage });
      
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
      console.log(`[${timestamp}] AuthContext.login: Login process completed, loading=false`);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Role-based permission checking
  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const hasPermission = (permission) => {
    if (!user?.role) return false;
    
    // Define role permissions (should match backend)
    const rolePermissions = {
      employee: [
        'orders:create',
        'orders:read',
        'orders:update_limited',
        'expenses:create',
        'expenses:read'
      ],
      admin: [
        'orders:create',
        'orders:read',
        'orders:update',
        'orders:delete',
        'orders:reject',
        'expenses:create',
        'expenses:read',
        'expenses:update',
        'expenses:delete',
        'analytics:read',
        'dashboard:read'
      ],
      super_admin: [
        '*', // All permissions
        'business_settings:read',
        'business_settings:update',
        'users:create',
        'users:read',
        'users:update',
        'users:delete'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const canEditOrder = (order) => {
    if (!user) return false;
    
    if (user.role === 'employee') {
      // Employees can only edit orders that are not completed and not paid
      return order?.status !== 'Completed' && order?.payment_status !== 'Paid';
    }
    
    // Admin and Super Admin can edit any order
    return hasPermission('orders:update');
  };

  const canEditExpense = () => {
    if (!user) return false;
    // Only Admin and Super Admin can edit expenses
    return user.role !== 'employee' && hasPermission('expenses:update');
  };

  const canRejectOrder = () => {
    return hasPermission('orders:reject');
  };

  const canAccessBusinessSettings = () => {
    return hasPermission('business_settings:read');
  };

  const canManageUsers = () => {
    return hasPermission('users:create');
  };

  const getRoleDisplayName = () => {
    const roleNames = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'employee': 'Employee'
    };
    return roleNames[user?.role] || 'Unknown';
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
    clearError,
    isAuthenticated: !!user,
    // Role-based methods
    hasRole,
    hasAnyRole,
    hasPermission,
    canEditOrder,
    canEditExpense,
    canRejectOrder,
    canAccessBusinessSettings,
    canManageUsers,
    getRoleDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};