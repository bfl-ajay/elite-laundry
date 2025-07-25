-- Migration: Add created_by column to orders table
-- This migration adds a created_by column to track which user created each order

-- Add created_by column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Update existing orders to set created_by to the first super_admin user (if exists)
-- This is a fallback for existing data
UPDATE orders 
SET created_by = (
    SELECT id FROM users 
    WHERE role = 'super_admin' 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE created_by IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- Add comment to document the column
COMMENT ON COLUMN orders.created_by IS 'ID of the user who created this order';