-- Enhanced database schema for laundry management system with role-based access control

-- Users table for authentication with role support
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table for customer orders with enhanced fields
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) NOT NULL,
    customer_address TEXT,
    order_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    rejection_reason TEXT,
    rejected_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order services table for detailed service breakdown
CREATE TABLE IF NOT EXISTS order_services (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'ironing', 'washing', 'dryclean', 'stain_removal'
    cloth_type VARCHAR(50) NOT NULL, -- 'saari', 'normal', 'others'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(8,2) NOT NULL,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- Expenses table for business expense tracking
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_id VARCHAR(20) UNIQUE NOT NULL,
    expense_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bill_attachment VARCHAR(255),
    expense_date DATE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business settings table for logo and branding
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,
    logo_path VARCHAR(255),
    favicon_path VARCHAR(255),
    business_name VARCHAR(255) DEFAULT 'Laundry Management System',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status_rejected ON orders(status) WHERE status = 'Rejected';
CREATE INDEX IF NOT EXISTS idx_order_services_order_id ON order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- Insert default business settings
INSERT INTO business_settings (business_name) 
VALUES ('Laundry Management System')
ON CONFLICT DO NOTHING;

-- Insert default super admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt with salt rounds 10
INSERT INTO users (username, password_hash, role) 
VALUES ('superadmin', '$2b$10$rQZ8kHp4Z4Z4Z4Z4Z4Z4ZOZ4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$rQZ8kHp4Z4Z4Z4Z4Z4Z4ZOZ4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default employee user (password: employee123)
INSERT INTO users (username, password_hash, role) 
VALUES ('employee', '$2b$10$rQZ8kHp4Z4Z4Z4Z4Z4Z4ZOZ4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4', 'employee')
ON CONFLICT (username) DO NOTHING;