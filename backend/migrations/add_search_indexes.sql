-- Add indexes for search functionality
-- These indexes will improve performance for customer name and contact number searches

-- Index for customer name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_lower 
ON orders (LOWER(customer_name));

-- Index for contact number searches
CREATE INDEX IF NOT EXISTS idx_orders_contact_number 
ON orders (contact_number);

-- Composite index for status and created_at (for filtered ordering)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON orders (status, created_at DESC);

-- Composite index for payment status and status (for metrics queries)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_status 
ON orders (payment_status, status);

-- Index for created_at ordering (if not already covered)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders (created_at DESC);