-- Migration: Add corporate clients and renewal reminders
-- Created: 2025-01-28
-- Purpose: Enhanced B2B functionality and automated certificate renewal management

-- =====================================================
-- CORPORATE CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS corporate_clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    primary_contact_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    vat_number VARCHAR(50),
    company_registration_number VARCHAR(50),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_postcode VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'United Kingdom',
    purchase_order_required BOOLEAN DEFAULT false,
    credit_terms INTEGER DEFAULT 0, -- days (0 = immediate payment)
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Indexes for corporate clients
CREATE INDEX idx_corporate_clients_active ON corporate_clients(is_active) WHERE is_active = true;
CREATE INDEX idx_corporate_clients_contact ON corporate_clients(primary_contact_id);
CREATE INDEX idx_corporate_clients_name ON corporate_clients(company_name);

-- =====================================================
-- RENEWAL REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS renewal_reminders (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER REFERENCES certificates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('30_days', '60_days', '90_days', 'expired')),
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    email_clicked_at TIMESTAMP WITH TIME ZONE,
    renewal_booking_id INTEGER REFERENCES bookings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(certificate_id, reminder_type) -- Only one reminder per type per certificate
);

-- Indexes for renewal reminders
CREATE INDEX idx_renewal_reminders_date ON renewal_reminders(reminder_date) WHERE email_sent_at IS NULL;
CREATE INDEX idx_renewal_reminders_certificate ON renewal_reminders(certificate_id);
CREATE INDEX idx_renewal_reminders_user ON renewal_reminders(user_id);

-- =====================================================
-- COURSE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50), -- For UI display (e.g., 'heart', 'shield', 'baby')
    color VARCHAR(7), -- Hex color for UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO course_categories (name, slug, description, display_order, icon, color) VALUES
('Workplace First Aid', 'workplace', 'First aid training for workplace environments', 1, 'briefcase', '#0EA5E9'),
('Paediatric First Aid', 'paediatric', 'Specialized first aid for infants and children', 2, 'baby', '#10B981'),
('Requalification', 'requalification', 'Refresher courses to maintain certification', 3, 'refresh-cw', '#F97316'),
('Specialist Training', 'specialist', 'Advanced and specialized first aid courses', 4, 'star', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add corporate fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS corporate_client_id INTEGER REFERENCES corporate_clients(id),
ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_due_date DATE;

-- Add category to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES course_categories(id),
ADD COLUMN IF NOT EXISTS min_capacity INTEGER DEFAULT 4 CHECK (min_capacity > 0),
ADD COLUMN IF NOT EXISTS early_bird_discount_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS early_bird_discount_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_discount_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS group_discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Update existing courses with categories
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE slug = 'workplace') 
WHERE course_type IN ('EFAW', 'FAW') AND category_id IS NULL;

UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE slug = 'paediatric') 
WHERE course_type LIKE '%Paediatric%' AND category_id IS NULL;

UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE slug = 'requalification') 
WHERE name LIKE '%Requalification%' AND category_id IS NULL;

UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE slug = 'specialist') 
WHERE course_type IN ('Mental Health', 'CPR/AED', 'Oxygen Therapy') AND category_id IS NULL;

-- Add enhanced venue information
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS directions TEXT,
ADD COLUMN IF NOT EXISTS public_transport_info TEXT,
ADD COLUMN IF NOT EXISTS accessibility_info TEXT,
ADD COLUMN IF NOT EXISTS catering_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wifi_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS projector_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whiteboard_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS air_conditioning BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS google_maps_url VARCHAR(500);

-- Add emergency contact to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT; -- Encrypted in application

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_session_status ON bookings(course_schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_certificates_user_expiry ON certificates(user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry_date ON certificates(expiry_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_course_schedules_date_status ON course_schedules(start_datetime, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_corporate ON bookings(corporate_client_id) WHERE corporate_client_id IS NOT NULL;

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_users_active_customers ON users(email) WHERE role = 'customer' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(display_order, name) WHERE is_active = true;

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Add check constraints
ALTER TABLE courses 
ADD CONSTRAINT chk_course_capacity CHECK (max_capacity >= COALESCE(min_capacity, 1));

ALTER TABLE bookings 
ADD CONSTRAINT chk_payment_amount CHECK (payment_amount >= 0);

ALTER TABLE course_schedules 
ADD CONSTRAINT chk_schedule_times CHECK (end_datetime > start_datetime);

ALTER TABLE corporate_clients
ADD CONSTRAINT chk_credit_terms CHECK (credit_terms >= 0 AND credit_terms <= 90);

-- Add unique constraints where missing
ALTER TABLE users 
ADD CONSTRAINT unq_stripe_customer UNIQUE (stripe_customer_id);

-- =====================================================
-- FUNCTIONS FOR AUTOMATED PROCESSES
-- =====================================================

-- Function to create renewal reminders when certificate is issued
CREATE OR REPLACE FUNCTION create_renewal_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create reminders for active certificates
    IF NEW.status = 'active' THEN
        -- 90 days before expiry
        INSERT INTO renewal_reminders (certificate_id, user_id, reminder_date, reminder_type)
        VALUES (NEW.id, NEW.user_id, NEW.expiry_date - INTERVAL '90 days', '90_days')
        ON CONFLICT (certificate_id, reminder_type) DO NOTHING;
        
        -- 60 days before expiry
        INSERT INTO renewal_reminders (certificate_id, user_id, reminder_date, reminder_type)
        VALUES (NEW.id, NEW.user_id, NEW.expiry_date - INTERVAL '60 days', '60_days')
        ON CONFLICT (certificate_id, reminder_type) DO NOTHING;
        
        -- 30 days before expiry
        INSERT INTO renewal_reminders (certificate_id, user_id, reminder_date, reminder_type)
        VALUES (NEW.id, NEW.user_id, NEW.expiry_date - INTERVAL '30 days', '30_days')
        ON CONFLICT (certificate_id, reminder_type) DO NOTHING;
        
        -- On expiry date
        INSERT INTO renewal_reminders (certificate_id, user_id, reminder_date, reminder_type)
        VALUES (NEW.id, NEW.user_id, NEW.expiry_date, 'expired')
        ON CONFLICT (certificate_id, reminder_type) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for renewal reminders
DROP TRIGGER IF EXISTS trg_create_renewal_reminders ON certificates;
CREATE TRIGGER trg_create_renewal_reminders
    AFTER INSERT OR UPDATE OF status ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION create_renewal_reminders();

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Update trigger for corporate_clients
CREATE TRIGGER update_corporate_clients_updated_at 
    BEFORE UPDATE ON corporate_clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for course_categories
CREATE TRIGGER update_course_categories_updated_at 
    BEFORE UPDATE ON course_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANTS (if needed for specific roles)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE ON corporate_clients TO api_user;
-- GRANT SELECT, INSERT, UPDATE ON renewal_reminders TO api_user;
-- GRANT SELECT ON course_categories TO api_user;