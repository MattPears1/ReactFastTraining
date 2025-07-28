-- Script to permanently disable account locking for admin accounts
-- This updates the admin account to bypass all lockout checks

-- First, ensure the columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS bypass_lockout BOOLEAN DEFAULT FALSE;

-- Enable lockout bypass for the admin account
UPDATE users 
SET 
    bypass_lockout = true,
    failed_login_attempts = 0,
    account_locked_until = NULL,
    is_active = true
WHERE 
    email = 'lex@reactfasttraining.co.uk' 
    AND role = 'admin';

-- Verify the update
SELECT 
    email, 
    role, 
    is_active, 
    bypass_lockout,
    failed_login_attempts,
    account_locked_until
FROM users 
WHERE email = 'lex@reactfasttraining.co.uk';

-- Also clear any rate limiting records
DELETE FROM login_attempts WHERE user_id = (
    SELECT id FROM users WHERE email = 'lex@reactfasttraining.co.uk'
);