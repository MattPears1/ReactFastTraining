-- Booking Validation System Migration
-- This migration adds constraints and functions to prevent overbooking and validate bookings

BEGIN;

-- 1. Add user_email column to bookings if not exists (for duplicate detection)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Update user_email from users table for existing bookings
UPDATE bookings 
SET user_email = LOWER(u.email)
FROM users u
WHERE bookings.user_id = u.id
AND bookings.user_email IS NULL;

-- 2. Add capacity constraint to course_schedules
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_capacity_not_exceeded'
    ) THEN
        ALTER TABLE course_schedules
        ADD CONSTRAINT check_capacity_not_exceeded 
        CHECK (current_capacity >= 0 AND current_capacity <= max_capacity);
    END IF;
END $$;

-- 3. Create unique index for duplicate booking prevention
-- This prevents the same email from booking the same session multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_per_session_email 
ON bookings(course_schedule_id, user_email) 
WHERE status NOT IN ('cancelled', 'refunded', 'failed');

-- 4. Create admin alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acknowledged', 'resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  acknowledged_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- Create indexes for admin alerts
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status ON admin_alerts(status);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created ON admin_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON admin_alerts(severity);

-- 5. Create booking validation function
CREATE OR REPLACE FUNCTION validate_booking_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_session RECORD;
  v_available_capacity INTEGER;
BEGIN
  -- Only validate for new bookings or status changes to confirmed
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Lock the session row and get current data
    SELECT * INTO v_session
    FROM course_schedules
    WHERE id = NEW.course_schedule_id
    FOR UPDATE;
    
    -- Calculate available capacity
    v_available_capacity := v_session.max_capacity - v_session.current_capacity;
    
    -- Check if there's enough capacity
    IF v_available_capacity < NEW.number_of_participants THEN
      RAISE EXCEPTION 'Insufficient capacity. Only % spots available', v_available_capacity;
    END IF;
    
    -- Update email field from contact details if not set
    IF NEW.user_email IS NULL AND NEW.contact_details->>'email' IS NOT NULL THEN
      NEW.user_email := LOWER(NEW.contact_details->>'email');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for booking validation
DROP TRIGGER IF EXISTS trigger_validate_booking_capacity ON bookings;
CREATE TRIGGER trigger_validate_booking_capacity
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_booking_capacity();

-- 7. Create function to update session capacity and status
CREATE OR REPLACE FUNCTION update_session_capacity_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_total_participants INTEGER;
  v_session RECORD;
BEGIN
  -- Get session details
  SELECT * INTO v_session
  FROM course_schedules
  WHERE id = COALESCE(NEW.course_schedule_id, OLD.course_schedule_id);
  
  -- Calculate total participants for this session
  SELECT COALESCE(SUM(number_of_participants), 0) INTO v_total_participants
  FROM bookings
  WHERE course_schedule_id = v_session.id
  AND status IN ('confirmed', 'pending');
  
  -- Update session capacity and status
  UPDATE course_schedules
  SET 
    current_capacity = v_total_participants,
    status = CASE 
      WHEN v_total_participants >= max_capacity THEN 'full'
      WHEN status = 'full' AND v_total_participants < max_capacity THEN 'published'
      ELSE status
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_session.id;
  
  -- Create alert if session is getting full (>80% capacity)
  IF v_total_participants > (v_session.max_capacity * 0.8) AND 
     v_total_participants < v_session.max_capacity THEN
    INSERT INTO admin_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'session_nearly_full',
      'medium',
      'Course Session Nearly Full',
      FORMAT('Session %s is at %s%% capacity', v_session.id, 
             ROUND((v_total_participants::NUMERIC / v_session.max_capacity) * 100)),
      jsonb_build_object(
        'session_id', v_session.id,
        'current_capacity', v_total_participants,
        'max_capacity', v_session.max_capacity,
        'percentage_full', ROUND((v_total_participants::NUMERIC / v_session.max_capacity) * 100)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to update capacity after booking changes
DROP TRIGGER IF EXISTS trigger_update_session_capacity ON bookings;
CREATE TRIGGER trigger_update_session_capacity
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_session_capacity_on_booking();

-- 9. Create function to detect duplicate bookings
CREATE OR REPLACE FUNCTION check_duplicate_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_count INTEGER;
BEGIN
  -- Only check for new bookings or status changes
  IF (TG_OP = 'INSERT' OR 
      (TG_OP = 'UPDATE' AND OLD.status != NEW.status)) AND
     NEW.status NOT IN ('cancelled', 'refunded', 'failed') THEN
    
    -- Count existing bookings for same email and session
    SELECT COUNT(*) INTO v_existing_count
    FROM bookings
    WHERE course_schedule_id = NEW.course_schedule_id
    AND user_email = NEW.user_email
    AND status NOT IN ('cancelled', 'refunded', 'failed')
    AND id != NEW.id;
    
    -- If duplicate found, create alert
    IF v_existing_count > 0 THEN
      INSERT INTO admin_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'duplicate_booking_detected',
        'high',
        'Duplicate Booking Detected',
        FORMAT('Email %s has multiple bookings for session %s', NEW.user_email, NEW.course_schedule_id),
        jsonb_build_object(
          'session_id', NEW.course_schedule_id,
          'email', NEW.user_email,
          'booking_id', NEW.id,
          'booking_reference', NEW.booking_reference,
          'existing_bookings', v_existing_count + 1
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for duplicate detection
DROP TRIGGER IF EXISTS trigger_check_duplicate_booking ON bookings;
CREATE TRIGGER trigger_check_duplicate_booking
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_booking();

-- 11. Create function to validate payment amount
CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_course_price DECIMAL(10,2);
  v_expected_amount DECIMAL(10,2);
  v_tolerance DECIMAL(10,2) := 0.01; -- 1 penny tolerance for rounding
BEGIN
  -- Get course price
  SELECT c.price INTO v_course_price
  FROM bookings b
  JOIN course_schedules cs ON b.course_schedule_id = cs.id
  JOIN courses c ON cs.course_id = c.id
  WHERE b.id = NEW.booking_id;
  
  -- Calculate expected amount
  SELECT b.number_of_participants * v_course_price INTO v_expected_amount
  FROM bookings b
  WHERE b.id = NEW.booking_id;
  
  -- Validate amount (with small tolerance for rounding)
  IF ABS(NEW.amount::DECIMAL - v_expected_amount) > v_tolerance THEN
    -- Create alert for amount mismatch
    INSERT INTO admin_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'payment_amount_mismatch',
      'high',
      'Payment Amount Mismatch',
      FORMAT('Payment amount £%s does not match expected £%s for booking %s', 
             NEW.amount, v_expected_amount, NEW.booking_id),
      jsonb_build_object(
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'payment_amount', NEW.amount,
        'expected_amount', v_expected_amount,
        'difference', ABS(NEW.amount::DECIMAL - v_expected_amount)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for payment validation
DROP TRIGGER IF EXISTS trigger_validate_payment_amount ON payments;
CREATE TRIGGER trigger_validate_payment_amount
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_amount();

-- 13. Create view for session availability
CREATE OR REPLACE VIEW session_availability AS
SELECT 
  cs.id as session_id,
  cs.course_id,
  c.name as course_name,
  cs.start_datetime,
  cs.status,
  cs.max_capacity,
  cs.current_capacity,
  (cs.max_capacity - cs.current_capacity) as available_spots,
  CASE 
    WHEN cs.current_capacity >= cs.max_capacity THEN true
    ELSE false
  END as is_full,
  ROUND((cs.current_capacity::NUMERIC / NULLIF(cs.max_capacity, 0)) * 100, 2) as percentage_full
FROM course_schedules cs
JOIN courses c ON cs.course_id = c.id;

-- 14. Create function to recalculate all session capacities
CREATE OR REPLACE FUNCTION recalculate_all_capacities()
RETURNS void AS $$
DECLARE
  v_session RECORD;
  v_total_participants INTEGER;
BEGIN
  FOR v_session IN SELECT id FROM course_schedules LOOP
    -- Calculate actual capacity
    SELECT COALESCE(SUM(number_of_participants), 0) INTO v_total_participants
    FROM bookings
    WHERE course_schedule_id = v_session.id
    AND status IN ('confirmed', 'pending');
    
    -- Update capacity
    UPDATE course_schedules
    SET 
      current_capacity = v_total_participants,
      status = CASE 
        WHEN v_total_participants >= max_capacity THEN 'full'
        WHEN status = 'full' AND v_total_participants < max_capacity THEN 'published'
        ELSE status
      END
    WHERE id = v_session.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 15. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_session_status ON bookings(course_schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_course_schedules_status_capacity ON course_schedules(status, current_capacity, max_capacity);

-- 16. Grant permissions (adjust based on your users)
-- GRANT SELECT ON session_availability TO your_app_user;
-- GRANT SELECT, INSERT ON admin_alerts TO your_app_user;
-- GRANT EXECUTE ON FUNCTION recalculate_all_capacities() TO your_app_user;

COMMIT;