import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * PermissionGate component for conditional rendering based on user permissions
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Required permission(s)
 * @param {string|string[]} props.role - Required role(s)
 * @param {Object} props.order - Order object for order-specific permission checks
 * @param {Object} props.expense - Expense object for expense-specific permission checks
 * @param {React.ReactNode} props.children - Content to render if permission is granted
 * @param {React.ReactNode} props.fallback - Content to render if permission is denied
 * @param {boolean} props.requireAll - If true, user must have ALL specified permissions/roles
 */
const PermissionGate = ({
  permission,
  role,
  order,
  expense,
  children,
  fallback = null,
  requireAll = false
}) => {
  const {
    hasPermission,
    hasRole,
    hasAnyRole,
    canEditOrder,
    canEditExpense
  } = usePermissions();

  // Check role-based access
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = requireAll 
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);
    
    if (!hasRequiredRole) {
      return fallback;
    }
  }

  // Check permission-based access
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasRequiredPermission = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));
    
    if (!hasRequiredPermission) {
      return fallback;
    }
  }

  // Check order-specific permissions
  if (order && !canEditOrder(order)) {
    return fallback;
  }

  // Check expense-specific permissions
  if (expense && !canEditExpense()) {
    return fallback;
  }

  return children;
};

// Convenience components for common permission checks
export const AdminOnly = ({ children, fallback = null }) => (
  <PermissionGate role={['admin', 'super_admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const SuperAdminOnly = ({ children, fallback = null }) => (
  <PermissionGate role="super_admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const EmployeeRestricted = ({ children, fallback = null }) => (
  <PermissionGate role={['admin', 'super_admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const OrderEditGate = ({ order, children, fallback = null }) => (
  <PermissionGate order={order} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const ExpenseEditGate = ({ children, fallback = null }) => (
  <PermissionGate expense={{}} fallback={fallback}>
    {children}
  </PermissionGate>
);

export default PermissionGate;