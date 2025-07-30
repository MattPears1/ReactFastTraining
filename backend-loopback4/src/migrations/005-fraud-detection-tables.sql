-- Fraud detection and blacklist tables
-- Migration: 005-fraud-detection-tables.sql

-- Create fraud blacklist table
CREATE TABLE IF NOT EXISTS fraud_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'ip', 'card', 'device')),
    value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT true,
    removed_at TIMESTAMP,
    removed_by VARCHAR(255),
    removed_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create fraud attempts table
CREATE TABLE IF NOT EXISTS fraud_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    signals JSONB NOT NULL DEFAULT '[]',
    blocked BOOLEAN NOT NULL DEFAULT false,
    reviewed BOOLEAN NOT NULL DEFAULT false,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    review_decision VARCHAR(20) CHECK (review_decision IN ('approve', 'reject', 'escalate')),
    review_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_fraud_blacklist_type_value ON fraud_blacklist(type, value) WHERE active = true;
CREATE INDEX idx_fraud_blacklist_active ON fraud_blacklist(active);
CREATE INDEX idx_fraud_blacklist_added_at ON fraud_blacklist(added_at);

CREATE INDEX idx_fraud_attempts_transaction ON fraud_attempts(transaction_id);
CREATE INDEX idx_fraud_attempts_user ON fraud_attempts(user_id);
CREATE INDEX idx_fraud_attempts_risk_level ON fraud_attempts(risk_level);
CREATE INDEX idx_fraud_attempts_blocked ON fraud_attempts(blocked) WHERE blocked = true;
CREATE INDEX idx_fraud_attempts_reviewed ON fraud_attempts(reviewed) WHERE reviewed = false;
CREATE INDEX idx_fraud_attempts_created ON fraud_attempts(created_at);

-- Add fraud detection fields to payments table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'fraud_score') THEN
        ALTER TABLE payments ADD COLUMN fraud_score INTEGER;
        ALTER TABLE payments ADD COLUMN fraud_signals JSONB DEFAULT '[]';
        ALTER TABLE payments ADD COLUMN fraud_checked BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_fraud_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fraud_blacklist_updated_at
    BEFORE UPDATE ON fraud_blacklist
    FOR EACH ROW
    EXECUTE FUNCTION update_fraud_updated_at();

CREATE TRIGGER update_fraud_attempts_updated_at
    BEFORE UPDATE ON fraud_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_fraud_updated_at();

-- Sample blacklist entries (commented out for production)
-- INSERT INTO fraud_blacklist (type, value, reason) VALUES
-- ('email', 'test@tempmail.com', 'Disposable email domain'),
-- ('ip', '192.168.1.1', 'Test IP address');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON fraud_blacklist TO reactfast_app;
GRANT SELECT, INSERT, UPDATE ON fraud_attempts TO reactfast_app;