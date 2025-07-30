-- Heroku production script to unlock admin account
-- Run this with: heroku pg:psql --app your-app-name < heroku-unlock-admin.sql

-- Ensure columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS bypass_lockout BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;

-- Unlock the admin account
UPDATE users 
SET 
    bypass_lockout = true,
    failed_login_attempts = 0,
    account_locked_until = NULL,
    is_active = true
WHERE 
    email = 'lex@reactfasttraining.co.uk';

-- Show the result
SELECT 
    email, 
    role, 
    is_active, 
    bypass_lockout,
    failed_login_attempts,
    account_locked_until,
    CASE 
        WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'Has password'
        ELSE 'No password'
    END as password_status
FROM users 
WHERE email = 'lex@reactfasttraining.co.uk';