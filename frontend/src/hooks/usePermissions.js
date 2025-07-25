import { useAuth } from '../contexts/AuthContext';

// Custom hook for role-based permissions
export const usePermissions = () => {
  const {
    user,
    hasRole,
    hasAnyRole,
    hasPermission,
    canEditOrder,
    canEditExpense,
    canRejectOrder,
    canAccessBusinessSettings,
    canManageUsers,
    getRoleDisplayName
  } = useAuth();

  return {
    user,
    userRole: user?.role,
    roleDisplayName: getRoleDisplayName(),
    
    // Role checking
    isEmployee: hasRole('employee'),
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('super_admin'),
    isAdminOrAbove: hasAnyRole(['admin', 'super_admin']),
    
    // Permission checking
    hasRole,
    hasAnyRole,
    hasPermission,
    
    // Specific permission checks
    canCreateOrders: hasPermission('orders:create'),
    canViewOrders: hasPermission('orders:read'),
    canUpdateOrders: hasPermission('orders:update'),
    canDeleteOrders: hasPermission('orders:delete'),
    canRejectOrders: canRejectOrder(),
    
    canCreateExpenses: hasPermission('expenses:create'),
    canViewExpenses: hasPermission('expenses:read'),
    canUpdateExpenses: canEditExpense(),
    canDeleteExpenses: hasPermission('expenses:delete'),
    
    canViewDashboard: hasPermission('dashboard:read'),
    canViewAnalytics: hasPermission('analytics:read'),
    
    canAccessSettings: canAccessBusinessSettings(),
    canManageUsers: canManageUsers(),
    
    // Context-specific permission checks
    canEditOrder,
    canEditExpense
  };
};

export default usePermissions;