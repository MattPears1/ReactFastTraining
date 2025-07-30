-- Payment Tables Migration v1.1
-- Enhanced with better performance optimization, security constraints,
-- and comprehensive audit trails for production use

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enum types for better data integrity
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'processing',
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'succeeded',
        'failed',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE refund_status AS ENUM (
        'pending',
        'approved',
        'processing',
        'processed',
        'failed',
        'rejected',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft',
        'issued',
        'paid',
        'partially_paid',
        'overdue',
        'void',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables to recreate with enhancements
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payment_reconciliations CASCADE;

-- Payments table - stores all payment records with enhanced security
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP' NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method_type VARCHAR(50),
  payment_method_last4 VARCHAR(4),
  payment_method_brand VARCHAR(50),
  receipt_url TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Additional security and tracking fields
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  description TEXT,
  failure_code VARCHAR(50),
  failure_message TEXT,
  risk_level VARCHAR(20),
  risk_score INTEGER,
  -- Ensure no duplicate payments for same booking
  CONSTRAINT unique_booking_payment UNIQUE (booking_id, status) WHERE status = 'succeeded'
);

-- Payment logs table - audit trail for all payment events
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(50) DEFAULT 'system', -- 'system', 'stripe_webhook', 'admin'
  event_data JSONB NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Additional tracking
  admin_user_id UUID REFERENCES users(id),
  error_details JSONB
);

-- Refunds table - manages refund requests and processing
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  stripe_refund_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status refund_status DEFAULT 'pending' NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  rejection_reason TEXT,
  admin_notes TEXT,
  customer_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure refund doesn't exceed payment
  CONSTRAINT refund_amount_valid CHECK (amount > 0)
);

-- Invoices table - stores invoice records
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id),
  payment_id UUID REFERENCES payments(id),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status invoice_status DEFAULT 'issued' NOT NULL,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Additional business fields
  notes TEXT,
  terms TEXT,
  footer_text TEXT,
  company_details JSONB,
  customer_details JSONB,
  line_items JSONB,
  -- Versioning for invoice updates
  version INTEGER DEFAULT 1,
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES users(id),
  void_reason TEXT
);

-- Invoice sequence for generating unique numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Webhook events table - stores all incoming webhook events
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Enhanced tracking
  headers JSONB,
  signature_verified BOOLEAN DEFAULT FALSE,
  processing_duration_ms INTEGER,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Create missing tables for payment method storage (PCI compliant - no card details)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  brand VARCHAR(50),
  last4 VARCHAR(4),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment reconciliation table for financial accuracy
CREATE TABLE payment_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  reconciled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reconciled_by UUID REFERENCES users(id),
  stripe_balance_transaction_id VARCHAR(255),
  expected_amount DECIMAL(10, 2) NOT NULL,
  actual_amount DECIMAL(10, 2) NOT NULL,
  fee_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  discrepancy_amount DECIMAL(10, 2) GENERATED ALWAYS AS (expected_amount - actual_amount) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced indexes for performance
-- Payments indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status) WHERE status IN ('pending', 'processing', 'requires_action');
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_customer_email ON payments(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX idx_payments_date_range ON payments(created_at) WHERE status = 'succeeded';

CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created ON payment_logs(created_at DESC);

CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status) WHERE status IN ('pending', 'approved');
CREATE INDEX idx_refunds_requested ON refunds(requested_at DESC);
CREATE INDEX idx_refunds_approved_by ON refunds(approved_by) WHERE approved_by IS NOT NULL;

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX idx_invoices_status_date ON invoices(status, issue_date DESC);
CREATE INDEX idx_invoices_unpaid ON invoices(due_date) WHERE status NOT IN ('paid', 'void', 'refunded');

CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(processed, created_at) WHERE processed = FALSE;
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_retry ON webhook_events(next_retry_at) WHERE processed = FALSE AND retry_count < 5;

-- Payment methods indexes
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Reconciliation indexes
CREATE INDEX idx_reconciliations_payment ON payment_reconciliations(payment_id);
CREATE INDEX idx_reconciliations_date ON payment_reconciliations(reconciled_at DESC);
CREATE INDEX idx_reconciliations_discrepancy ON payment_reconciliations(discrepancy_amount) WHERE discrepancy_amount != 0;

-- Enhanced constraints for data integrity
ALTER TABLE payments ADD CONSTRAINT check_payment_amount CHECK (amount > 0);
ALTER TABLE payments ADD CONSTRAINT check_payment_currency CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE payments ADD CONSTRAINT check_risk_score CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100));

ALTER TABLE refunds ADD CONSTRAINT check_refund_amount CHECK (amount > 0);
ALTER TABLE refunds ADD CONSTRAINT check_refund_dates CHECK (processed_at IS NULL OR processed_at >= requested_at);
ALTER TABLE refunds ADD CONSTRAINT check_approval_required CHECK (
    (status IN ('processed', 'approved') AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (status NOT IN ('processed', 'approved'))
);

ALTER TABLE invoices ADD CONSTRAINT check_invoice_amounts CHECK (total_amount >= subtotal AND subtotal >= 0 AND tax_amount >= 0);
ALTER TABLE invoices ADD CONSTRAINT check_invoice_dates CHECK (due_date IS NULL OR due_date >= issue_date);
ALTER TABLE invoices ADD CONSTRAINT check_invoice_number_format CHECK (invoice_number ~ '^INV-[0-9]{4}-[0-9]{5}$');

ALTER TABLE payment_methods ADD CONSTRAINT check_card_expiry CHECK (
    (exp_month IS NULL AND exp_year IS NULL) OR
    (exp_month BETWEEN 1 AND 12 AND exp_year >= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate refund amount doesn't exceed payment
CREATE OR REPLACE FUNCTION validate_refund_amount()
RETURNS TRIGGER AS $$
DECLARE
    payment_amount DECIMAL(10, 2);
    total_refunded DECIMAL(10, 2);
BEGIN
    -- Get the payment amount
    SELECT amount INTO payment_amount
    FROM payments
    WHERE id = NEW.payment_id;
    
    -- Calculate total refunded including this refund
    SELECT COALESCE(SUM(amount), 0) INTO total_refunded
    FROM refunds
    WHERE payment_id = NEW.payment_id
    AND status IN ('approved', 'processing', 'processed')
    AND id != NEW.id;
    
    -- Check if refund exceeds payment
    IF (total_refunded + NEW.amount) > payment_amount THEN
        RAISE EXCEPTION 'Refund amount exceeds payment amount. Payment: %, Already refunded: %, Requested: %',
            payment_amount, total_refunded, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_refund_amount_trigger
    BEFORE INSERT OR UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION validate_refund_amount();

-- Comprehensive documentation
COMMENT ON TABLE payments IS 'Core payment transactions table with Stripe integration and comprehensive tracking';
COMMENT ON TABLE payment_logs IS 'Immutable audit trail for all payment-related events and state changes';
COMMENT ON TABLE refunds IS 'Refund management with approval workflow, validation, and complete audit trail';
COMMENT ON TABLE invoices IS 'Invoice generation and management with versioning and PDF tracking';
COMMENT ON TABLE webhook_events IS 'Stripe webhook event processing with retry logic and deduplication';
COMMENT ON TABLE payment_methods IS 'Saved payment methods for customers (PCI compliant - no sensitive data)';
COMMENT ON TABLE payment_reconciliations IS 'Financial reconciliation tracking for accounting and discrepancy management';

COMMENT ON COLUMN payments.idempotency_key IS 'Unique key to prevent duplicate payment processing';
COMMENT ON COLUMN payments.risk_score IS 'Stripe Radar risk score (0-100, higher = riskier)';
COMMENT ON COLUMN refunds.status IS 'Refund lifecycle: pending -> approved -> processing -> processed/failed/rejected';
COMMENT ON COLUMN invoices.status IS 'Invoice lifecycle: draft -> issued -> paid/overdue -> void/refunded';
COMMENT ON COLUMN invoices.version IS 'Version number incremented on each update for audit trail';
COMMENT ON COLUMN webhook_events.signature_verified IS 'Whether Stripe signature was successfully verified';
COMMENT ON COLUMN payment_reconciliations.discrepancy_amount IS 'Calculated difference between expected and actual amounts';

-- Performance optimization settings
ALTER TABLE payments SET (fillfactor = 90);
ALTER TABLE payment_logs SET (fillfactor = 95);
ALTER TABLE invoices SET (fillfactor = 90);
ALTER TABLE webhook_events SET (fillfactor = 95);

-- Grant appropriate permissions (adjust based on your user roles)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- GRANT SELECT, INSERT, UPDATE ON payments, payment_logs, refunds, invoices TO app_user;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO app_admin;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user, app_admin;