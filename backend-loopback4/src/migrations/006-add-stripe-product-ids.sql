-- Add Stripe product and price IDs to courses table
-- Migration: 006-add-stripe-product-ids.sql

-- Add Stripe product and price columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_product_synced_at TIMESTAMP;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_stripe_product_id ON courses(stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_stripe_price_id ON courses(stripe_price_id) WHERE stripe_price_id IS NOT NULL;

-- Create stripe_sync_log table for tracking sync operations
CREATE TABLE IF NOT EXISTS stripe_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('course', 'customer', 'subscription')),
    entity_id VARCHAR(255) NOT NULL,
    stripe_id VARCHAR(255),
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'sync')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for sync log queries
CREATE INDEX idx_stripe_sync_log_entity ON stripe_sync_log(entity_type, entity_id);
CREATE INDEX idx_stripe_sync_log_status ON stripe_sync_log(status) WHERE status = 'failed';
CREATE INDEX idx_stripe_sync_log_created ON stripe_sync_log(created_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON courses TO reactfast_app;
GRANT SELECT, INSERT, UPDATE ON stripe_sync_log TO reactfast_app;