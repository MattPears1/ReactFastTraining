-- Payment System Tables Migration
-- This migration creates the payment tracking system tables

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  booking_id INTEGER REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Payment Details
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Amount Information
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  stripe_fee DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  
  -- Payment Method
  payment_method VARCHAR(50) NOT NULL,
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  
  -- Status
  status VARCHAR(50) NOT NULL,
  failure_reason TEXT,
  
  -- Invoice Information
  invoice_number VARCHAR(100),
  invoice_issued_date DATE,
  invoice_due_date DATE,
  
  -- Metadata
  description TEXT,
  payment_date TIMESTAMP,
  processed_by INTEGER REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_stripe_ids ON payments(stripe_payment_intent_id, stripe_charge_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);

-- 2. Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  payment_id UUID REFERENCES payments(id),
  booking_id INTEGER REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Refund Details
  refund_reference VARCHAR(100) UNIQUE NOT NULL,
  stripe_refund_id VARCHAR(255),
  
  -- Amount Information
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_fee DECIMAL(10,2) DEFAULT 0,
  net_refund_amount DECIMAL(10,2),
  
  -- Refund Information
  reason VARCHAR(50) NOT NULL,
  reason_details TEXT,
  status VARCHAR(50) NOT NULL,
  
  -- Processing Information
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for refunds
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_reference ON refunds(refund_reference);

-- 3. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id),
  
  -- Stripe Information
  stripe_payment_method_id VARCHAR(255) UNIQUE,
  
  -- Card Details (for display only)
  card_brand VARCHAR(50),
  card_last_four VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

-- Indexes for payment_methods
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);

-- 4. Payment Reconciliations Table
CREATE TABLE IF NOT EXISTS payment_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Period Information
  reconciliation_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Totals
  total_payments_count INTEGER,
  total_payments_amount DECIMAL(10,2),
  total_refunds_count INTEGER,
  total_refunds_amount DECIMAL(10,2),
  total_fees DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  
  -- Stripe Reconciliation
  stripe_payout_id VARCHAR(255),
  stripe_payout_amount DECIMAL(10,2),
  stripe_payout_date DATE,
  
  -- Status
  status VARCHAR(50),
  discrepancy_notes TEXT,
  
  -- Audit
  reconciled_by INTEGER REFERENCES users(id),
  reconciled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_reconciliations
CREATE INDEX idx_reconciliations_date ON payment_reconciliations(reconciliation_date);
CREATE INDEX idx_reconciliations_status ON payment_reconciliations(status);

-- 5. Payment Events Log
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  payment_id UUID REFERENCES payments(id),
  refund_id UUID REFERENCES refunds(id),
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(50),
  event_data JSONB,
  
  -- Stripe Event Information
  stripe_event_id VARCHAR(255),
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_events
CREATE INDEX idx_payment_events_payment ON payment_events(payment_id);
CREATE INDEX idx_payment_events_refund ON payment_events(refund_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_created ON payment_events(created_at);
CREATE INDEX idx_payment_events_stripe_event ON payment_events(stripe_event_id);

-- 6. Add payment tracking to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Create indexes on bookings payment fields
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to payments table
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to refunds table
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create payment reference generation function
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS VARCHAR AS $$
DECLARE
    new_ref VARCHAR;
    ref_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate reference: PAY-YYYYMMDD-XXXX
        new_ref := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                   UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
        
        -- Check if reference already exists
        SELECT EXISTS(SELECT 1 FROM payments WHERE payment_reference = new_ref) INTO ref_exists;
        
        EXIT WHEN NOT ref_exists;
    END LOOP;
    
    RETURN new_ref;
END;
$$ LANGUAGE plpgsql;

-- 9. Create refund reference generation function
CREATE OR REPLACE FUNCTION generate_refund_reference()
RETURNS VARCHAR AS $$
DECLARE
    new_ref VARCHAR;
    ref_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate reference: REF-YYYYMMDD-XXXX
        new_ref := 'REF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                   UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
        
        -- Check if reference already exists
        SELECT EXISTS(SELECT 1 FROM refunds WHERE refund_reference = new_ref) INTO ref_exists;
        
        EXIT WHEN NOT ref_exists;
    END LOOP;
    
    RETURN new_ref;
END;
$$ LANGUAGE plpgsql;

-- 10. Create view for payment summary
CREATE VIEW payment_summary AS
SELECT 
    p.id,
    p.payment_reference,
    p.amount,
    p.status,
    p.payment_method,
    p.payment_date,
    b.booking_reference,
    u.email as customer_email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    c.name as course_name,
    cs.start_datetime as course_date
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
LEFT JOIN courses c ON cs.course_id = c.id;

-- 11. Create view for refund summary
CREATE VIEW refund_summary AS
SELECT 
    r.id,
    r.refund_reference,
    r.refund_amount,
    r.status,
    r.reason,
    r.created_at as refund_date,
    p.payment_reference,
    p.amount as original_amount,
    b.booking_reference,
    u.email as customer_email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name
FROM refunds r
LEFT JOIN payments p ON r.payment_id = p.id
LEFT JOIN bookings b ON r.booking_id = b.id
LEFT JOIN users u ON r.user_id = u.id;

-- Grant permissions if needed (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;