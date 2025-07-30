-- Activity Logs Table for Admin Dashboard
-- Tracks all important actions in the system

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite index for dashboard queries
CREATE INDEX idx_activity_logs_dashboard ON activity_logs(created_at DESC, action);

-- Function to auto-log booking activities
CREATE OR REPLACE FUNCTION log_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    )
    VALUES (
      NEW.user_id,
      NEW.contact_details->>'email',
      'booking.created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'course_schedule_id', NEW.course_schedule_id,
        'amount', NEW.payment_amount,
        'attendees', NEW.number_of_attendees,
        'status', NEW.status
      ),
      NEW.created_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO activity_logs (
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        created_at
      )
      VALUES (
        NEW.user_id,
        NEW.contact_details->>'email',
        CASE 
          WHEN NEW.status = 'cancelled' THEN 'booking.cancelled'
          WHEN NEW.status = 'confirmed' THEN 'booking.confirmed'
          ELSE 'booking.updated'
        END,
        'booking',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'course_schedule_id', NEW.course_schedule_id
        ),
        CURRENT_TIMESTAMP
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking activities
DROP TRIGGER IF EXISTS trigger_log_booking_activity ON bookings;
CREATE TRIGGER trigger_log_booking_activity
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_activity();

-- Function to auto-log payment activities
CREATE OR REPLACE FUNCTION log_payment_activity()
RETURNS TRIGGER AS $$
DECLARE
  booking_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'succeeded' THEN
    -- Get booking details
    SELECT b.user_id, b.contact_details->>'email' as email, cs.id as session_id
    INTO booking_record
    FROM bookings b
    LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
    WHERE b.id = NEW.booking_id;
    
    INSERT INTO activity_logs (
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    )
    VALUES (
      booking_record.user_id,
      booking_record.email,
      'payment.completed',
      'payment',
      NEW.id,
      jsonb_build_object(
        'amount', NEW.amount,
        'booking_id', NEW.booking_id,
        'payment_method', NEW.payment_method_type,
        'stripe_payment_intent_id', NEW.stripe_payment_intent_id
      ),
      NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment activities
DROP TRIGGER IF EXISTS trigger_log_payment_activity ON payments;
CREATE TRIGGER trigger_log_payment_activity
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION log_payment_activity();

-- Function to auto-log user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      'user.created',
      'user',
      NEW.id,
      jsonb_build_object(
        'role', NEW.role,
        'name', CONCAT(NEW.first_name, ' ', NEW.last_name)
      ),
      NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user activities
DROP TRIGGER IF EXISTS trigger_log_user_activity ON users;
CREATE TRIGGER trigger_log_user_activity
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_activity();

-- Sample data for testing (optional - remove in production)
-- INSERT INTO activity_logs (user_email, action, resource_type, details) VALUES
-- ('test@example.com', 'booking.created', 'booking', '{"course": "EFAW", "amount": 75}'),
-- ('admin@example.com', 'user.login', 'session', '{"ip": "192.168.1.1"}'),
-- ('customer@example.com', 'payment.completed', 'payment', '{"amount": 150}');

-- Grant permissions
GRANT SELECT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO authenticated;

-- Comments
COMMENT ON TABLE activity_logs IS 'Tracks all important user and system activities for audit and dashboard display';
COMMENT ON COLUMN activity_logs.action IS 'Type of action performed (e.g., booking.created, user.login)';
COMMENT ON COLUMN activity_logs.resource_type IS 'Type of resource affected (e.g., booking, user, payment)';
COMMENT ON COLUMN activity_logs.details IS 'Additional context about the activity in JSON format';