-- Script to unlock admin account
-- Run this on Heroku: heroku pg:psql -a react-fast-training < backend-loopback4/src/scripts/unlock-admin-prod.sql

-- Unlock the admin account for lex@reactfasttraining.co.uk
UPDATE users 
SET 
    failed_login_attempts = 0,
    last_failed_login = NULL,
    account_locked_until = NULL,
    is_active = true,
    updated_at = NOW()
WHERE 
    email = 'lex@reactfasttraining.co.uk' 
    AND role = 'admin';

-- Show the result
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role,
    is_active, 
    failed_login_attempts,
    account_locked_until,
    last_login,
    updated_at
FROM users 
WHERE email = 'lex@reactfasttraining.co.uk';

-- Clear any recent login attempts
DELETE FROM login_attempts 
WHERE user_id = (
    SELECT id FROM users WHERE email = 'lex@reactfasttraining.co.uk'
) 
AND created_at > NOW() - INTERVAL '24 hours';

-- Confirm the account is unlocked
SELECT 
    CASE 
        WHEN is_active = true AND (account_locked_until IS NULL OR account_locked_until < NOW())
        THEN '✅ Account is UNLOCKED and ready to use!'
        ELSE '❌ Account is still locked'
    END as status,
    email,
    is_active,
    failed_login_attempts,
    account_locked_until
FROM users 
WHERE email = 'lex@reactfasttraining.co.uk';