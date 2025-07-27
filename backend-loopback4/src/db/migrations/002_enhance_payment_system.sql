-- Enhanced Payment System Tables Migration
-- This migration enhances the existing payment infrastructure with additional tables

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create payments table that extends payment_transactions
-- This provides a more comprehensive payment tracking system
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to existing payment_transactions for backward compatibility
  payment_transaction_id INTEGER REFERENCES payment_transactions(id),
  
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

-- Indexes for payments (only if table was created)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_payments_stripe_ids ON payments(stripe_payment_intent_id, stripe_charge_id);
    CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
  END IF;
END $$;

-- 2. Enhance existing refunds table with missing columns
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_details TEXT;

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
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

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
CREATE INDEX IF NOT EXISTS idx_reconciliations_date ON payment_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON payment_reconciliations(status);

-- 5. Payment Events Log
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  payment_id UUID REFERENCES payments(id),
  payment_transaction_id INTEGER REFERENCES payment_transactions(id),
  refund_id INTEGER REFERENCES refunds(id),
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(50),
  event_data JSONB,
  
  -- Stripe Event Information
  stripe_event_id VARCHAR(255) UNIQUE,
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_events
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_transaction ON payment_events(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_refund ON payment_events(refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event ON payment_events(stripe_event_id);

-- 6. Stripe webhook events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created ON stripe_webhook_events(created_at);

-- 7. Add payment tracking to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Create indexes on bookings payment fields
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to payments table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 9. Create payment reference generation function
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

-- 10. Create invoice number generation function
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    new_num VARCHAR;
    num_exists BOOLEAN;
    year_month VARCHAR;
    seq_num INTEGER;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10 FOR 4) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM payments
    WHERE invoice_number LIKE 'INV-' || year_month || '-%';
    
    -- Generate invoice number: INV-YYYYMM-XXXX
    new_num := 'INV-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN new_num;
END;
$$ LANGUAGE plpgsql;

-- 11. Create view for comprehensive payment summary
CREATE OR REPLACE VIEW payment_summary_view AS
SELECT 
    COALESCE(p.id::TEXT, pt.id::TEXT) as payment_id,
    COALESCE(p.payment_reference, 'PT-' || pt.id::TEXT) as payment_reference,
    COALESCE(p.amount, pt.amount) as amount,
    COALESCE(p.status, pt.status) as status,
    COALESCE(p.payment_method, pt.payment_method) as payment_method,
    COALESCE(p.payment_date, pt.created_at) as payment_date,
    COALESCE(p.stripe_payment_intent_id, pt.stripe_payment_intent_id) as stripe_payment_intent_id,
    b.booking_reference,
    u.email as customer_email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    c.name as course_name,
    cs.start_datetime as course_date
FROM bookings b
LEFT JOIN payment_transactions pt ON pt.booking_id = b.id
LEFT JOIN payments p ON p.booking_id = b.id
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
LEFT JOIN courses c ON cs.course_id = c.id
WHERE pt.id IS NOT NULL OR p.id IS NOT NULL;

-- 12. Create view for refund summary with enhanced details
CREATE OR REPLACE VIEW refund_summary_view AS
SELECT 
    r.id,
    r.refund_reference,
    r.amount as refund_amount,
    r.status,
    r.reason,
    r.created_at as refund_date,
    p.payment_reference,
    COALESCE(p.amount, pt.amount) as original_amount,
    b.booking_reference,
    u.email as customer_email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    req_user.email as requested_by_email,
    proc_user.email as processed_by_email
FROM refunds r
LEFT JOIN bookings b ON r.booking_id = b.id
LEFT JOIN payment_transactions pt ON pt.booking_id = b.id
LEFT JOIN payments p ON r.payment_id = p.id OR p.booking_id = b.id
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN users req_user ON r.created_by_id = req_user.id
LEFT JOIN users proc_user ON r.processed_by_id = proc_user.id;

-- 13. Create function to migrate payment_transactions to payments table
CREATE OR REPLACE FUNCTION migrate_payment_transactions()
RETURNS void AS $$
DECLARE
    trans RECORD;
    new_payment_id UUID;
BEGIN
    FOR trans IN 
        SELECT pt.*, b.user_id 
        FROM payment_transactions pt
        LEFT JOIN bookings b ON pt.booking_id = b.id
        WHERE NOT EXISTS (
            SELECT 1 FROM payments p 
            WHERE p.payment_transaction_id = pt.id
        )
    LOOP
        -- Generate new payment record
        INSERT INTO payments (
            payment_transaction_id,
            booking_id,
            user_id,
            payment_reference,
            stripe_payment_intent_id,
            stripe_charge_id,
            amount,
            currency,
            payment_method,
            status,
            failure_reason,
            payment_date,
            created_at
        ) VALUES (
            trans.id,
            trans.booking_id,
            trans.user_id,
            generate_payment_reference(),
            trans.stripe_payment_intent_id,
            trans.stripe_charge_id,
            trans.amount,
            trans.currency,
            trans.payment_method,
            trans.status,
            trans.failure_reason,
            trans.created_at,
            trans.created_at
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions if needed (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;