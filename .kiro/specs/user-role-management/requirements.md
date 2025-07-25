# User Role Management System Requirements

## Introduction

This specification defines a comprehensive user role management system for the laundry management application. The system will implement three distinct user roles (Super Admin, Admin, Employee) with specific permissions and access controls, along with business branding features and enhanced PDF bill generation.

## Requirements

### Requirement 1: User Role System

**User Story:** As a business owner, I want to have different user roles with specific permissions so that I can control access to different features based on employee responsibilities.

#### Acceptance Criteria

1. WHEN the system is initialized THEN it SHALL support three user roles: Super Admin, Admin, and Employee
2. WHEN a user is created THEN the system SHALL assign one of the three roles to the user
3. WHEN a user logs in THEN the system SHALL authenticate and authorize based on their assigned role
4. WHEN role-based permissions are checked THEN the system SHALL enforce access controls according to role definitions

### Requirement 2: Employee Role Permissions

**User Story:** As an employee, I want to access only the features I need for my daily work so that I can efficiently manage orders and expenses without accessing administrative functions.

#### Acceptance Criteria

1. WHEN an employee logs in THEN the system SHALL display only Orders and Expenses menu items
2. WHEN an employee creates a new order THEN the system SHALL allow full order creation functionality
3. WHEN an employee creates a new expense THEN the system SHALL allow expense creation but prevent future edits
4. WHEN an employee attempts to edit an order THEN the system SHALL allow edits only if the order is not completed and not paid
5. WHEN an employee attempts to edit a completed but unpaid order THEN the system SHALL prevent any modifications
6. WHEN an employee attempts to access dashboard or analytics THEN the system SHALL deny access

### Requirement 3: Admin Role Permissions

**User Story:** As an admin, I want to have full access to orders and expenses management so that I can oversee operations and make necessary corrections at any stage.

#### Acceptance Criteria

1. WHEN an admin logs in THEN the system SHALL display all menu items except business settings
2. WHEN an admin manages orders THEN the system SHALL allow editing at any stage regardless of status
3. WHEN an admin manages orders THEN the system SHALL allow rejecting orders with reason
4. WHEN an admin manages expenses THEN the system SHALL allow editing at any stage
5. WHEN an admin accesses analytics THEN the system SHALL provide full dashboard and reporting access

### Requirement 4: Super Admin Role Permissions

**User Story:** As a super admin, I want to have complete system access including business branding settings so that I can manage all aspects of the application.

#### Acceptance Criteria

1. WHEN a super admin logs in THEN the system SHALL display all menu items including business settings
2. WHEN a super admin manages orders and expenses THEN the system SHALL allow full editing capabilities like admin
3. WHEN a super admin manages orders THEN the system SHALL allow rejecting orders with reason
4. WHEN a super admin accesses business settings THEN the system SHALL allow logo and favicon management
5. WHEN a super admin uploads a business logo THEN the system SHALL store and use it for bill generation
6. WHEN a super admin uploads a favicon THEN the system SHALL update the application favicon

### Requirement 5: Business Branding Management

**User Story:** As a super admin, I want to customize the business logo and favicon so that the application reflects our brand identity.

#### Acceptance Criteria

1. WHEN a super admin uploads a business logo THEN the system SHALL validate file format (PNG, JPG, SVG)
2. WHEN a business logo is uploaded THEN the system SHALL store it securely and make it available for bills
3. WHEN a favicon is uploaded THEN the system SHALL update the browser tab icon
4. WHEN business settings are accessed THEN the system SHALL display current logo and favicon with preview
5. WHEN logo settings are saved THEN the system SHALL apply changes immediately to new bills

### Requirement 6: Enhanced PDF Bill Generation

**User Story:** As a user, I want to generate professional PDF bills with business branding so that I can provide customers with branded invoices.

#### Acceptance Criteria

1. WHEN a user clicks "Generate Bill" THEN the system SHALL create a PDF document automatically
2. WHEN a PDF bill is generated THEN it SHALL include the business logo if configured
3. WHEN a PDF bill is generated THEN it SHALL include all order details, services, and pricing
4. WHEN a PDF bill is generated THEN it SHALL automatically download to the user's device
5. WHEN a PDF bill is generated THEN it SHALL maintain professional formatting and layout
6. WHEN no business logo is configured THEN the system SHALL generate bills with default branding

### Requirement 7: Role-Based Navigation

**User Story:** As a user with a specific role, I want to see only the navigation items relevant to my permissions so that the interface is clean and focused.

#### Acceptance Criteria

1. WHEN an employee logs in THEN the navigation SHALL show only Orders and Expenses links
2. WHEN an admin logs in THEN the navigation SHALL show Dashboard, Orders, Expenses, and Analytics links
3. WHEN a super admin logs in THEN the navigation SHALL show all links including Business Settings
4. WHEN a user attempts to access unauthorized routes THEN the system SHALL redirect to authorized pages
5. WHEN role permissions change THEN the navigation SHALL update dynamically

### Requirement 8: Order Rejection Functionality

**User Story:** As an admin or super admin, I want to reject orders with a reason so that I can manage order quality and handle problematic requests.

#### Acceptance Criteria

1. WHEN an admin or super admin views an order THEN the system SHALL display a "Reject Order" option
2. WHEN rejecting an order THEN the system SHALL require a rejection reason
3. WHEN an order is rejected THEN the system SHALL update the order status to "Rejected"
4. WHEN an order is rejected THEN the system SHALL store the rejection reason and timestamp
5. WHEN an employee attempts to reject an order THEN the system SHALL deny access

### Requirement 9: Enhanced Order Form with Customer Address

**User Story:** As a user creating orders, I want to capture customer address information so that I can provide delivery services and maintain complete customer records.

#### Acceptance Criteria

1. WHEN creating a new order THEN the system SHALL include a customer address field
2. WHEN the address field is filled THEN the system SHALL validate the address format
3. WHEN an order is saved THEN the system SHALL store the customer address with the order
4. WHEN viewing order details THEN the system SHALL display the customer address
5. WHEN generating bills THEN the system SHALL include customer address on the invoice

### Requirement 10: Currency Display Update

**User Story:** As a user in India, I want to see all prices and amounts displayed in Indian Rupees (INR) so that the application reflects the local currency.

#### Acceptance Criteria

1. WHEN viewing order amounts THEN the system SHALL display prices with INR symbol (₹)
2. WHEN viewing expense amounts THEN the system SHALL display costs with INR symbol (₹)
3. WHEN generating PDF bills THEN the system SHALL show all amounts in INR format
4. WHEN creating orders or expenses THEN the system SHALL use INR currency formatting
5. WHEN viewing analytics and dashboard THEN the system SHALL display all financial data in INR

### Requirement 11: Database Schema Updates

**User Story:** As a developer, I want the database to support role-based access control and enhanced order information so that user permissions and customer data are properly stored and managed.

#### Acceptance Criteria

1. WHEN the database is updated THEN it SHALL include a role column in the users table
2. WHEN the database is updated THEN it SHALL include a business_settings table for logo and favicon storage
3. WHEN the database is updated THEN it SHALL include customer_address column in orders table
4. WHEN the database is updated THEN it SHALL include rejection_reason and rejected_at columns in orders table
5. WHEN user roles are assigned THEN they SHALL be stored with appropriate constraints
6. WHEN business settings are saved THEN they SHALL be stored with file paths and metadata
7. WHEN the system starts THEN it SHALL create default super admin user if none exists