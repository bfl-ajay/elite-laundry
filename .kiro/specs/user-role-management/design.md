# User Role Management System Design

## Overview

This design document outlines the implementation of a comprehensive role-based access control (RBAC) system for the laundry management application. The system will support three user roles with distinct permissions, business branding management, and enhanced PDF bill generation capabilities.

## Architecture

### Role-Based Access Control (RBAC) Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Super Admin   │    │      Admin      │    │    Employee     │
│                 │    │                 │    │                 │
│ • All Features  │    │ • Orders (Full) │    │ • Orders (Ltd)  │
│ • Business Mgmt │    │ • Expenses(Full)│    │ • Expenses(Ltd) │
│ • User Mgmt     │    │ • Analytics     │    │ • No Analytics  │
│ • Logo/Favicon  │    │ • Dashboard     │    │ • No Dashboard  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### System Components

1. **Authentication & Authorization Layer**
   - Enhanced JWT/Session management with role information
   - Role-based middleware for route protection
   - Permission checking utilities

2. **Business Settings Management**
   - Logo and favicon upload handling
   - File storage and retrieval system
   - Settings persistence and caching

3. **Enhanced PDF Generation**
   - PDF library integration (PDFKit or similar)
   - Template system with business branding
   - Automatic download functionality

4. **Role-Based UI Components**
   - Dynamic navigation based on user role
   - Conditional rendering of features
   - Permission-aware form controls

## Components and Interfaces

### Backend Components

#### 1. User Model Enhancement
```javascript
// Enhanced User model with role support
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password; // hashed
    this.role = data.role; // 'super_admin', 'admin', 'employee'
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
  
  hasPermission(permission) {
    return ROLE_PERMISSIONS[this.role].includes(permission);
  }
  
  canEditOrder(order) {
    if (this.role === 'employee') {
      return order.status !== 'Completed' && order.payment_status !== 'Paid';
    }
    return true; // Admin and Super Admin can edit any order
  }
  
  canEditExpense(expense) {
    return this.role !== 'employee'; // Only Admin and Super Admin can edit expenses
  }
}
```

#### 2. Business Settings Model
```javascript
class BusinessSettings {
  constructor(data) {
    this.id = data.id;
    this.logo_path = data.logo_path;
    this.favicon_path = data.favicon_path;
    this.business_name = data.business_name;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}
```

#### 3. Role-Based Middleware
```javascript
const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!hasRequiredPermission(userRole, requiredRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' }
      });
    }
    next();
  };
};
```

#### 4. PDF Generation Service
```javascript
class PDFBillService {
  async generateBill(orderData, businessSettings) {
    const doc = new PDFDocument();
    
    // Add business logo if available
    if (businessSettings.logo_path) {
      doc.image(businessSettings.logo_path, 50, 50, { width: 100 });
    }
    
    // Add bill content
    this.addBillHeader(doc, orderData);
    this.addCustomerInfo(doc, orderData);
    this.addServicesTable(doc, orderData.services);
    this.addTotalAmount(doc, orderData.total_amount);
    
    return doc;
  }
}
```

### Frontend Components

#### 1. Role-Based Navigation Component
```jsx
const Navigation = () => {
  const { user } = useAuth();
  
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/orders', label: 'Orders', roles: ['employee', 'admin', 'super_admin'] },
      { path: '/expenses', label: 'Expenses', roles: ['employee', 'admin', 'super_admin'] }
    ];
    
    const adminItems = [
      { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'super_admin'] },
      { path: '/analytics', label: 'Analytics', roles: ['admin', 'super_admin'] }
    ];
    
    const superAdminItems = [
      { path: '/settings', label: 'Business Settings', roles: ['super_admin'] }
    ];
    
    return [...baseItems, ...adminItems, ...superAdminItems]
      .filter(item => item.roles.includes(user.role));
  };
  
  return (
    <nav>
      {getNavigationItems().map(item => (
        <NavLink key={item.path} to={item.path}>{item.label}</NavLink>
      ))}
    </nav>
  );
};
```

#### 2. Permission-Aware Order Components
```jsx
const OrderDetails = ({ order, user }) => {
  const canEdit = user.canEditOrder(order);
  
  return (
    <div>
      {/* Order details display */}
      {canEdit && (
        <div>
          <button onClick={handleEdit}>Edit Order</button>
          <StatusUpdater order={order} />
        </div>
      )}
    </div>
  );
};
```

#### 3. Business Settings Component
```jsx
const BusinessSettings = () => {
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);
  
  const handleLogoUpload = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    
    await businessService.uploadLogo(formData);
    // Update UI and refresh settings
  };
  
  return (
    <div>
      <h2>Business Settings</h2>
      <LogoUploader onUpload={handleLogoUpload} currentLogo={logo} />
      <FaviconUploader onUpload={handleFaviconUpload} currentFavicon={favicon} />
    </div>
  );
};
```

## Data Models

### Database Schema Updates

#### Users Table Enhancement
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'employee' 
CHECK (role IN ('super_admin', 'admin', 'employee'));

-- Create index for role-based queries
CREATE INDEX idx_users_role ON users(role);
```

#### Orders Table Enhancement
```sql
ALTER TABLE orders ADD COLUMN customer_address TEXT;
ALTER TABLE orders ADD COLUMN rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN rejected_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN rejected_by INTEGER REFERENCES users(id);

-- Update status enum to include 'Rejected'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected'));

-- Create index for rejected orders
CREATE INDEX idx_orders_status_rejected ON orders(status) WHERE status = 'Rejected';
```

#### Business Settings Table
```sql
CREATE TABLE business_settings (
  id SERIAL PRIMARY KEY,
  logo_path VARCHAR(255),
  favicon_path VARCHAR(255),
  business_name VARCHAR(255) DEFAULT 'Laundry Management System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO business_settings (business_name) VALUES ('Laundry Management System');
```

#### Role Permissions Configuration
```javascript
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
```

## Error Handling

### Role-Based Error Responses
```javascript
const RoleErrors = {
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'You do not have permission to perform this action',
    status: 403
  },
  INVALID_ROLE: {
    code: 'INVALID_ROLE',
    message: 'Invalid user role specified',
    status: 400
  },
  ORDER_EDIT_RESTRICTED: {
    code: 'ORDER_EDIT_RESTRICTED',
    message: 'Cannot edit completed or paid orders',
    status: 403
  },
  EXPENSE_EDIT_RESTRICTED: {
    code: 'EXPENSE_EDIT_RESTRICTED',
    message: 'Employees cannot edit expenses after creation',
    status: 403
  }
};
```

## Testing Strategy

### Unit Tests
1. **Role Permission Tests**
   - Test role-based access control logic
   - Verify permission checking functions
   - Test user role assignment and validation

2. **Business Settings Tests**
   - Test logo and favicon upload functionality
   - Verify file storage and retrieval
   - Test settings persistence

3. **PDF Generation Tests**
   - Test PDF creation with and without logo
   - Verify bill content accuracy
   - Test download functionality

### Integration Tests
1. **Role-Based API Tests**
   - Test API endpoints with different user roles
   - Verify proper access control enforcement
   - Test error responses for unauthorized access

2. **End-to-End Tests**
   - Test complete user workflows for each role
   - Verify navigation and UI changes based on role
   - Test PDF bill generation and download

### Security Tests
1. **Authorization Tests**
   - Test privilege escalation prevention
   - Verify role-based route protection
   - Test session management with roles

2. **File Upload Security**
   - Test file type validation for logo/favicon
   - Verify file size limits
   - Test malicious file upload prevention

## Implementation Phases

### Phase 1: Database and Backend Foundation
1. Update database schema with role support
2. Enhance User model with role functionality
3. Implement role-based middleware
4. Create business settings model and routes

### Phase 2: Authentication and Authorization
1. Update authentication to include role information
2. Implement permission checking utilities
3. Create role-based route protection
4. Update existing API endpoints with role checks

### Phase 3: Frontend Role Integration
1. Update AuthContext to handle user roles
2. Implement role-based navigation
3. Create permission-aware components
4. Update existing components with role checks

### Phase 4: Business Settings and PDF Generation
1. Implement business settings management
2. Create logo and favicon upload functionality
3. Integrate PDF generation library
4. Implement branded PDF bill generation

### Phase 5: Testing and Refinement
1. Comprehensive testing of all role-based features
2. Security testing and vulnerability assessment
3. Performance optimization for PDF generation
4. User experience refinement and bug fixes