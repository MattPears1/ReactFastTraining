-- Migration: Enhance users table for customer management
-- Date: 2025-01-27
-- Description: Add customer-specific fields to support unified user management

BEGIN;

-- Add role field to distinguish user types
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer' NOT NULL;

-- Add customer information fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'UK';

-- Add emergency contact fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50);

-- Add medical/dietary fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_medical_conditions BOOLEAN DEFAULT false;

-- Add preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50) DEFAULT 'email';

-- Add statistics fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_booking_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_since DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP;

-- Add customer type for segmentation
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'individual';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_users_customer_since ON users(customer_since);

-- Update existing admin users to have correct role
UPDATE users 
SET role = 'admin' 
WHERE email IN (
  SELECT DISTINCT email 
  FROM users 
  WHERE password_hash IS NOT NULL 
  AND password_hash != ''
);

-- Add comment to table
COMMENT ON TABLE users IS 'Unified user table for customers, administrators, and instructors';
COMMENT ON COLUMN users.role IS 'User role: customer, admin, or instructor';
COMMENT ON COLUMN users.total_bookings IS 'Total number of bookings made by the user';
COMMENT ON COLUMN users.total_spent IS 'Total amount spent by the user across all bookings';
COMMENT ON COLUMN users.customer_since IS 'Date when the user first became a customer';

COMMIT;