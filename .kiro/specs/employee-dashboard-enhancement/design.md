# Design Document

## Overview

The Employee Dashboard Enhancement will transform the existing dashboard into a more focused, efficient interface centered around order management. The design emphasizes simplicity, quick access to relevant information, and streamlined workflows for daily operations.

## Architecture

### Component Structure
```
Dashboard
├── DashboardHeader (existing)
├── OrderMetricsBadges (new)
│   ├── MetricBadge (Total Orders)
│   ├── MetricBadge (Pending Orders)
│   ├── MetricBadge (Completed Orders)
│   ├── MetricBadge (Paid Orders)
│   └── MetricBadge (Unpaid Completed Orders)
├── OrderTableWithSearch (enhanced)
│   ├── SearchBar (new)
│   └── OrderTable (enhanced)
└── QuickActions (existing, simplified)
```

### Data Flow
1. Dashboard loads → Fetch order metrics and pending orders
2. User clicks metric badge → Filter orders by status
3. User types in search → Filter current view by search criteria
4. Search + Status filter work together for refined results

## Components and Interfaces

### OrderMetricsBadges Component

**Purpose**: Display clickable metric badges that show order counts and filter the table

**Props**:
```typescript
interface OrderMetricsBadgesProps {
  onFilterChange: (filter: OrderFilter) => void;
  activeFilter: OrderFilter;
  metrics: OrderMetrics;
  loading: boolean;
}

interface OrderMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  paidOrders: number;
  unpaidCompletedOrders: number;
}

type OrderFilter = 'all' | 'pending' | 'completed' | 'paid' | 'unpaid-completed';
```

**Visual Design**:
- Grid layout: 2 rows × 3 columns on desktop, stacked on mobile
- Each badge shows: Icon, Count, Label
- Color coding: 
  - Total Orders: Blue gradient
  - Pending: Orange/Warning gradient  
  - Completed: Green gradient
  - Paid: Success green gradient
  - Unpaid Completed: Red/Error gradient
- Active state: Darker background, border highlight
- Hover effects: Scale transform, shadow increase

### Enhanced OrderTable Component

**New Props**:
```typescript
interface OrderTableProps {
  filter: OrderFilter;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  defaultSort: 'created_at' | 'order_date';
  sortOrder: 'asc' | 'desc';
}
```

**Search Functionality**:
- Real-time filtering as user types
- Debounced API calls (300ms delay)
- Search fields: customer_name, contact_number
- Case-insensitive partial matching
- Clear search button when query exists

**Default Behavior**:
- Show pending orders on initial load
- Sort by created_at DESC (newest first)
- Maintain search query when switching filters

### SearchBar Component

**Purpose**: Provide real-time search functionality for orders

**Features**:
- Search icon with input field
- Placeholder text: "Search by customer name or contact number..."
- Clear button (X) when text exists
- Loading indicator during search
- Keyboard shortcuts: ESC to clear

## Data Models

### API Endpoints

**Enhanced Orders Endpoint**:
```
GET /api/orders?status={filter}&search={query}&sort=created_at&order=desc
```

**New Metrics Endpoint**:
```
GET /api/orders/metrics
Response: {
  totalOrders: number,
  pendingOrders: number,
  completedOrders: number,
  paidOrders: number,
  unpaidCompletedOrders: number
}
```

### Database Queries

**Metrics Query**:
```sql
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'Completed' AND payment_status = 'Paid' THEN 1 END) as paid_orders,
  COUNT(CASE WHEN status = 'Completed' AND payment_status != 'Paid' THEN 1 END) as unpaid_completed_orders
FROM orders;
```

**Enhanced Orders Query**:
```sql
SELECT * FROM orders 
WHERE 
  ($1::text IS NULL OR status = $1) 
  AND ($2::text IS NULL OR 
       customer_name ILIKE '%' || $2 || '%' OR 
       contact_number ILIKE '%' || $2 || '%')
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

## Error Handling

### Frontend Error States
- **Metrics Loading Error**: Show skeleton badges with retry button
- **Search Error**: Display error message below search bar
- **No Results**: Show empty state with clear search option
- **Network Error**: Toast notification with retry action

### Backend Error Handling
- **Invalid Filter**: Return 400 with valid filter options
- **Database Error**: Return 500 with generic error message
- **Search Query Too Long**: Limit to 100 characters, return 400 if exceeded

## Testing Strategy

### Unit Tests
- **OrderMetricsBadges**: Test badge rendering, click handlers, active states
- **SearchBar**: Test input handling, debouncing, clear functionality
- **Enhanced OrderTable**: Test filtering, sorting, search integration

### Integration Tests
- **Dashboard Flow**: Load → Click badge → Search → Verify results
- **API Integration**: Test metrics endpoint, enhanced orders endpoint
- **Error Scenarios**: Network failures, invalid responses

### E2E Tests
- **Employee Workflow**: Login → View dashboard → Filter orders → Search → View details
- **Cross-browser**: Test on Chrome, Firefox, Safari
- **Mobile Responsive**: Test on various screen sizes

## Performance Considerations

### Frontend Optimizations
- **Debounced Search**: 300ms delay to reduce API calls
- **Memoized Components**: Use React.memo for badge components
- **Virtual Scrolling**: For large order lists (>100 items)
- **Lazy Loading**: Load order details on demand

### Backend Optimizations
- **Database Indexing**: Add indexes on status, customer_name, contact_number
- **Query Optimization**: Use prepared statements, limit result sets
- **Caching**: Cache metrics for 5 minutes using Redis
- **Pagination**: Default 50 items per page

### Caching Strategy
- **Metrics Cache**: 5-minute TTL, invalidate on order updates
- **Search Results**: Client-side cache for 2 minutes
- **Static Assets**: Long-term caching for icons and styles

## Security Considerations

### Access Control
- **Role-based Access**: All roles can access enhanced dashboard
- **Data Filtering**: Users only see orders they have permission to view
- **Search Sanitization**: Prevent SQL injection in search queries

### Input Validation
- **Search Query**: Max 100 characters, sanitize special characters
- **Filter Values**: Validate against allowed filter types
- **Rate Limiting**: Max 10 search requests per minute per user

## Mobile Responsiveness

### Breakpoint Strategy
- **Mobile (< 640px)**: Stack badges vertically, simplified table
- **Tablet (640px - 1024px)**: 2-column badge grid, horizontal scroll table
- **Desktop (> 1024px)**: Full 3-column layout, full table view

### Touch Interactions
- **Badge Taps**: Larger touch targets (44px minimum)
- **Search Input**: Auto-focus on mobile, proper keyboard type
- **Table Scrolling**: Smooth horizontal scroll with momentum

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Tab through badges, search, table
- **Screen Readers**: Proper ARIA labels, live regions for updates
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Indicators**: Clear visual focus states

### Semantic HTML
- **Badge Structure**: Use buttons with proper roles
- **Search Form**: Proper form labels and fieldsets
- **Table Structure**: Proper thead, tbody, th, td elements