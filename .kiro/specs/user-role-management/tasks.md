# User Role Management System Implementation Plan

- [x] 1. Database Schema Updates and Backend Foundation


  - Update database schema to support user roles and business settings
  - Create migration scripts for existing data
  - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.3_

- [x] 1.1 Update users table with role support


  - Add role column to users table with enum constraint
  - Create database migration script
  - Update existing users with default roles
  - Create indexes for role-based queries
  - _Requirements: 1.2, 10.1, 10.7_

- [x] 1.2 Create business_settings table and update orders table

  - Design and create business_settings table schema
  - Add columns for logo_path, favicon_path, business_name
  - Insert default business settings record
  - Add customer_address, rejection_reason, rejected_at, rejected_by columns to orders table
  - Update order status enum to include 'Rejected' status
  - Create file storage directory structure
  - _Requirements: 5.4, 8.1, 8.4, 9.1, 9.3, 9.4, 10.2, 10.3, 10.4, 10.6_

- [x] 2. Enhanced User Model and Authentication


  - Update User model to support role-based permissions
  - Implement role checking and permission validation methods
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2.1 Update User model with role functionality


  - Add role property and validation to User model
  - Implement hasPermission() method for role checking
  - Create canEditOrder() and canEditExpense() methods
  - Add role-based permission constants
  - _Requirements: 1.2, 2.4, 2.5, 3.2, 3.3_

- [x] 2.2 Enhance authentication system with roles

  - Update login response to include user role information
  - Modify JWT/session to store role data
  - Update authentication middleware to handle roles
  - Create role-based route protection middleware
  - _Requirements: 1.3, 1.4, 7.4_

- [x] 3. Business Settings Management Backend



  - Create business settings model and API endpoints
  - Implement file upload handling for logo and favicon
  - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3_

- [x] 3.1 Create BusinessSettings model and routes


  - Implement BusinessSettings model class
  - Create CRUD operations for business settings
  - Build API endpoints for settings management
  - Add validation for business settings data
  - _Requirements: 4.3, 5.4_

- [x] 3.2 Implement logo and favicon upload functionality


  - Create file upload middleware for images
  - Add file type and size validation
  - Implement secure file storage system
  - Create API endpoints for logo/favicon upload
  - Add file serving routes for uploaded assets
  - _Requirements: 4.4, 5.1, 5.2, 5.3_

- [x] 4. Role-Based API Endpoint Protection


  - Update existing API routes with role-based access control
  - Implement permission checking for orders and expenses
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 4.1, 4.2_

- [x] 4.1 Implement role-based middleware

  - Create roleMiddleware function for route protection
  - Define permission constants for different operations
  - Implement hasRequiredPermission utility function
  - Add error handling for insufficient permissions
  - _Requirements: 1.4, 7.4_

- [x] 4.2 Update orders routes with role-based access


  - Add role checks to order creation endpoints
  - Implement conditional edit permissions for employees
  - Restrict order editing based on status and payment
  - Add order rejection endpoint for admin/super_admin roles
  - Add role-based error responses
  - _Requirements: 2.2, 2.4, 2.5, 3.2, 3.3, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.3 Update expenses routes with role-based access


  - Add role checks to expense creation endpoints
  - Restrict expense editing for employee role
  - Allow full expense management for admin/super_admin
  - Implement role-based validation
  - _Requirements: 2.3, 3.3_

- [x] 5. Frontend Authentication and Role Management



  - Update frontend authentication to handle user roles
  - Create role-based navigation and UI components
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 5.1 Update AuthContext with role support


  - Modify AuthContext to store and manage user role
  - Update login flow to handle role information
  - Create role checking hooks and utilities
  - Add role-based state management
  - _Requirements: 1.3, 7.5_

- [x] 5.2 Implement role-based navigation component


  - Update Navigation component with role-based menu items
  - Hide/show navigation items based on user role
  - Implement dynamic navigation rendering
  - Add role-based styling and indicators
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 5.3 Create permission-aware UI components

  - Update existing components with role-based rendering
  - Create PermissionGate component for conditional rendering
  - Implement role-based form controls and buttons
  - Add role-based error messages and notifications
  - _Requirements: 2.4, 2.5, 3.2, 3.3_

- [x] 6. Business Settings Frontend Interface











  - Create business settings page for super admin users
  - Implement logo and favicon upload components
  - _Requirements: 4.3, 4.4, 4.5, 5.4_

- [x] 6.1 Create BusinessSettings page component


  - Design and implement business settings UI
  - Add logo and favicon preview functionality
  - Create upload progress indicators
  - Implement settings form validation
  - _Requirements: 4.3, 5.4_

- [x] 6.2 Implement logo and favicon upload components


  - Create LogoUploader component with drag-and-drop
  - Implement FaviconUploader with preview
  - Add file validation and error handling
  - Create upload progress and success feedback
  - Update favicon dynamically after upload
  - _Requirements: 4.4, 4.5, 5.1, 5.2, 5.3_




- [x] 7. Enhanced PDF Bill Generation








  - Integrate PDF generation library
  - Create branded bill templates with business logo
  - Implement automatic PDF download functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7.1 Install and configure PDF generation library


  - Install PDFKit or similar PDF generation library
  - Create PDF service utility class
  - Set up PDF generation configuration
  - Create basic PDF template structure
  - _Requirements: 6.1, 6.4_

- [x] 7.2 Implement branded PDF bill generation


  - Create professional bill template with business logo
  - Add customer information and order details sections
  - Implement services table with pricing
  - Add total amount and payment status
  - Include business branding and contact information
  - _Requirements: 6.2, 6.3, 6.5_

- [x] 7.3 Create automatic PDF download functionality


  - Implement PDF generation API endpoint
  - Create frontend PDF download trigger
  - Add download progress indicators
  - Handle PDF generation errors gracefully
  - Optimize PDF file size and generation speed
  - _Requirements: 6.1, 6.4_





- [x] 8. Role-Based Order and Expense Management




- [ ] 8. Role-Based Order and Expense Management



  - Update order and expense components with role-based editing
  - Implement conditional editing based on user permissions
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3_

- [x] 8.1 Update OrderDetails component with role-based editing


  - Add role-based edit button visibility
  - Implement conditional order editing for employees
  - Restrict editing for completed/paid orders (employee role)
  - Add order rejection functionality for admin/super_admin
  - Add role-based status update permissions
  - Display appropriate error messages for restricted actions
  - _Requirements: 2.2, 2.4, 2.5, 3.3, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.2 Update OrderForm with customer address field


  - Add customer address field to order creation form
  - Implement address validation and formatting
  - Update order creation API to handle customer address
  - Add address field to order display components
  - Include customer address in PDF bill generation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8.3 Update ExpenseList and ExpenseForm with role restrictions


  - Hide edit buttons for employees on existing expenses
  - Allow expense creation for all roles
  - Restrict expense editing to admin/super_admin roles
  - Add role-based validation messages
  - _Requirements: 2.3, 3.3_

- [x] 8.4 Update currency display from USD to INR throughout application


  - Replace all $ symbols with ₹ symbols in frontend components
  - Update OrderForm, OrderTable, OrderDetails currency displays
  - Update ExpenseForm, ExpenseList currency displays
  - Update Dashboard and Analytics currency formatting
  - Update PDF bill generation to use INR formatting
  - Update form labels and placeholders to reflect INR
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


-

- [x] 9. User Management Interface (Super Admin)








  - Create user management page for super admin
  - Implement user creation, editing, and role assignment
  - _Requirements: 4.1, 4.2_

- [x] 9.1 Create UserManagement page component


  - Design user list interface with role indicators
  - Implement user creation form with role selection
  - Add user editing and role change functionality
  - Create user deletion with confirmation
  - _Requirements: 4.1, 4.2_

- [x] 9.2 Implement user CRUD operations


  - Create user management API endpoints
  - Add user validation and role assignment
  - Implement secure user creation and updates
  - Add audit logging for user management actions
  - _Requirements: 4.1, 4.2_
-



- [-] 10. Testing and Security Implementation




  - Create comprehensive tests for role-based functionality
  - Implement security measures and validation
  - _Requirements: All requirements_

- [x] 10.1 Write unit tests for role-based functionality


  - Test User model role methods and permissions
  - Test role-based middleware and route protection
  - Test business settings and PDF generation
  - Create mock data for different user roles
  - _Requirements: All backend requirements_

- [x] 10.2 Write integration tests for role-based API


  - Test API endpoints with different user roles
  - Verify proper access control enforcement
  - Test error responses for unauthorized access
  - Create end-to-end role-based workflow tests
  - _Requirements: All API requirements_

- [-] 10.3 Implement frontend role-based tests

  - Test role-based navigation and component rendering
  - Test permission-aware UI components
  - Create user interaction tests for different roles
  - Test business settings and PDF download functionality
  - _Requirements: All frontend requirements_

- [ ] 11. Default User Setup and Migration

  - Create default super admin user
  - Implement data migration for existing users
  - _Requirements: 8.5_

- [ ] 11.1 Create default super admin setup
  - Create script to generate default super admin user
  - Add super admin creation to database initialization
  - Implement secure default password generation
  - Create user role migration for existing data
  - _Requirements: 8.5_

- [ ] 11.2 Update existing user data with roles
  - Create migration script for existing users
  - Assign appropriate roles to current users
  - Update authentication flow for migrated users
  - Test role assignment and permissions
  - _Requirements: 8.1, 8.5_