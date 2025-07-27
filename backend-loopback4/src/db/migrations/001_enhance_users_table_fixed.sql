-- Enhanced users table migration
-- This migration adds customer-specific fields to the users table

BEGIN;

-- Add missing columns for customer data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS county VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS postcode VARCHAR(20);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United Kingdom';

-- Add customer statistics
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS average_booking_value DECIMAL(10,2) DEFAULT 0.00;

-- Add customer preferences
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array of tags for customer segmentation

-- Add payment integration fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

-- Add user tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS source VARCHAR(100); -- How they found us

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_total_bookings ON users(total_bookings);
CREATE INDEX IF NOT EXISTS idx_users_total_spent ON users(total_spent);
CREATE INDEX IF NOT EXISTS idx_users_last_booking_date ON users(last_booking_date);

-- Update existing users to set is_active to true
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

COMMIT;