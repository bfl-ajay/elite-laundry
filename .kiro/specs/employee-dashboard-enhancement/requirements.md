# Requirements Document

## Introduction

This specification outlines the enhancement of the Employee Dashboard to provide a more focused and efficient interface for employees. The dashboard will display key order metrics with clickable badges that filter the order table, include search functionality, and show pending orders by default.

## Requirements

### Requirement 1

**User Story:** As an employee, I want to see simplified order metrics on my dashboard, so that I can quickly understand the current order status without being overwhelmed by unnecessary information.

#### Acceptance Criteria

1. WHEN an employee accesses the dashboard THEN the system SHALL display only four key metrics: Total Orders, Orders Pending, Orders Completed, and Orders Paid
2. WHEN displaying Orders Completed THEN the system SHALL show two sub-categories: Orders Paid and Orders Completed but Unpaid
3. WHEN the dashboard loads THEN the system SHALL present these metrics as clickable badges with appropriate visual styling
4. WHEN displaying metrics THEN the system SHALL use clear, readable numbers and appropriate color coding for each status

### Requirement 2

**User Story:** As an employee, I want to click on metric badges to filter the order table, so that I can quickly view orders of a specific status without manual filtering.

#### Acceptance Criteria

1. WHEN an employee clicks on the "Total Orders" badge THEN the system SHALL display all orders in the table below
2. WHEN an employee clicks on the "Orders Pending" badge THEN the system SHALL filter and display only pending orders
3. WHEN an employee clicks on the "Orders Completed" badge THEN the system SHALL filter and display only completed orders (both paid and unpaid)
4. WHEN an employee clicks on the "Orders Paid" badge THEN the system SHALL filter and display only orders that are completed and paid
5. WHEN an employee clicks on the "Orders Completed but Unpaid" badge THEN the system SHALL filter and display only orders that are completed but unpaid
6. WHEN a filter is applied THEN the system SHALL provide visual feedback showing which filter is currently active

### Requirement 3

**User Story:** As an employee, I want the order table to show pending orders by default, so that I can immediately see what work needs to be done without additional clicks.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display pending orders in the table by default
2. WHEN displaying pending orders THEN the system SHALL order them by created date with newest first
3. WHEN no pending orders exist THEN the system SHALL display an appropriate message indicating no pending orders

### Requirement 4

**User Story:** As an employee, I want to search orders by customer name or contact number, so that I can quickly find specific orders without scrolling through the entire list.

#### Acceptance Criteria

1. WHEN the order table is displayed THEN the system SHALL provide a search input field above the table
2. WHEN an employee types in the search field THEN the system SHALL filter orders in real-time based on customer name or contact number
3. WHEN searching THEN the system SHALL perform case-insensitive partial matching on both customer name and contact number
4. WHEN the search field is cleared THEN the system SHALL return to showing the previously selected filter (default: pending orders)
5. WHEN search results are displayed THEN the system SHALL maintain the current status filter while applying the search criteria

### Requirement 5

**User Story:** As an admin or super admin, I want to access the same enhanced dashboard features, so that I can benefit from the improved interface while maintaining my additional privileges.

#### Acceptance Criteria

1. WHEN an admin or super admin accesses the dashboard THEN the system SHALL display the same four key metrics as employees
2. WHEN admin users click on metric badges THEN the system SHALL apply the same filtering functionality as for employees
3. WHEN admin users use the search feature THEN the system SHALL provide the same search capabilities as for employees
4. WHEN admin users access the dashboard THEN the system SHALL maintain all existing admin-specific features and permissions