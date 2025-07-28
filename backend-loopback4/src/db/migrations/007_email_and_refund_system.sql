-- Email and Refund System Migration
-- Adds comprehensive email notification and refund tracking

-- ========================================
-- EMAIL TEMPLATES
-- ========================================

CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]', -- List of available template variables
  category VARCHAR(50) NOT NULL CHECK (category IN ('booking', 'cancellation', 'reminder', 'admin', 'marketing')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EMAIL QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  from_email VARCHAR(255) DEFAULT 'info@reactfasttraining.co.uk',
  from_name VARCHAR(255) DEFAULT 'React Fast Training',
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_id INTEGER REFERENCES email_templates(id),
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC, scheduled_for ASC);

-- ========================================
-- CANCELLATION REASONS
-- ========================================

CREATE TABLE IF NOT EXISTS cancellation_reasons (
  id SERIAL PRIMARY KEY,
  reason VARCHAR(255) NOT NULL,
  requires_details BOOLEAN DEFAULT FALSE,
  is_refundable BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SESSION CANCELLATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS session_cancellations (
  id SERIAL PRIMARY KEY,
  course_schedule_id INTEGER NOT NULL REFERENCES course_schedules(id),
  cancelled_by INTEGER NOT NULL REFERENCES users(id),
  cancellation_reason_id INTEGER REFERENCES cancellation_reasons(id),
  reason_details TEXT,
  affected_bookings INTEGER DEFAULT 0,
  total_refund_amount DECIMAL(10,2) DEFAULT 0,
  notification_sent BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_cancellations_schedule ON session_cancellations(course_schedule_id);

-- ========================================
-- REFUND LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS refund_logs (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  stripe_payment_intent_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  initiated_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refund_logs_booking ON refund_logs(booking_id);
CREATE INDEX idx_refund_logs_user ON refund_logs(user_id);
CREATE INDEX idx_refund_logs_status ON refund_logs(status);

-- ========================================
-- SESSION WAITLIST
-- ========================================

CREATE TABLE IF NOT EXISTS session_waitlist (
  id SERIAL PRIMARY KEY,
  course_schedule_id INTEGER NOT NULL REFERENCES course_schedules(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  position INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notified_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired', 'cancelled')),
  CONSTRAINT unique_waitlist_entry UNIQUE(course_schedule_id, user_id)
);

CREATE INDEX idx_session_waitlist_schedule ON session_waitlist(course_schedule_id);
CREATE INDEX idx_session_waitlist_user ON session_waitlist(user_id);
CREATE INDEX idx_session_waitlist_position ON session_waitlist(course_schedule_id, position);

-- ========================================
-- NOTIFICATION PREFERENCES
-- ========================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
  email_reminders BOOLEAN DEFAULT TRUE,
  email_confirmations BOOLEAN DEFAULT TRUE,
  email_cancellations BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_reminders BOOLEAN DEFAULT FALSE,
  reminder_hours INTEGER[] DEFAULT ARRAY[24, 2], -- Hours before session to send reminders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- DEFAULT EMAIL TEMPLATES
-- ========================================

INSERT INTO email_templates (name, subject, body_html, body_text, variables, category) VALUES
(
  'booking_confirmation',
  'Booking Confirmation - {{courseName}}',
  '<h2>Booking Confirmed!</h2><p>Dear {{userName}},</p><p>Your booking for <strong>{{courseName}}</strong> has been confirmed.</p><p><strong>Date:</strong> {{sessionDate}}<br><strong>Time:</strong> {{sessionTime}}<br><strong>Location:</strong> {{venueName}}<br>{{venueAddress}}</p><p>Total paid: £{{amountPaid}}</p><p>Please arrive 10 minutes early for registration.</p><p>Best regards,<br>React Fast Training Team</p>',
  'Booking Confirmed!\n\nDear {{userName}},\n\nYour booking for {{courseName}} has been confirmed.\n\nDate: {{sessionDate}}\nTime: {{sessionTime}}\nLocation: {{venueName}}\n{{venueAddress}}\n\nTotal paid: £{{amountPaid}}\n\nPlease arrive 10 minutes early for registration.\n\nBest regards,\nReact Fast Training Team',
  '["userName", "courseName", "sessionDate", "sessionTime", "venueName", "venueAddress", "amountPaid"]'::jsonb,
  'booking'
),
(
  'session_cancellation',
  'Important: Session Cancelled - {{courseName}}',
  '<h2>Session Cancellation Notice</h2><p>Dear {{userName}},</p><p>We regret to inform you that your session for <strong>{{courseName}}</strong> scheduled for {{sessionDate}} has been cancelled.</p><p><strong>Reason:</strong> {{cancellationReason}}</p><p>A full refund of £{{refundAmount}} will be processed within 5-7 business days.</p><p>We apologize for any inconvenience. Please visit our website to book an alternative date.</p><p>Best regards,<br>React Fast Training Team</p>',
  'Session Cancellation Notice\n\nDear {{userName}},\n\nWe regret to inform you that your session for {{courseName}} scheduled for {{sessionDate}} has been cancelled.\n\nReason: {{cancellationReason}}\n\nA full refund of £{{refundAmount}} will be processed within 5-7 business days.\n\nWe apologize for any inconvenience. Please visit our website to book an alternative date.\n\nBest regards,\nReact Fast Training Team',
  '["userName", "courseName", "sessionDate", "cancellationReason", "refundAmount"]'::jsonb,
  'cancellation'
),
(
  'session_reminder_24h',
  'Reminder: {{courseName}} Tomorrow',
  '<h2>Session Reminder</h2><p>Dear {{userName}},</p><p>This is a friendly reminder that you have a training session tomorrow:</p><p><strong>Course:</strong> {{courseName}}<br><strong>Date:</strong> {{sessionDate}}<br><strong>Time:</strong> {{sessionTime}}<br><strong>Location:</strong> {{venueName}}<br>{{venueAddress}}</p><p><strong>What to bring:</strong><br>- Photo ID<br>- Pen and notepad<br>- Comfortable clothing</p><p>If you need to cancel or reschedule, please contact us immediately.</p><p>See you tomorrow!<br>React Fast Training Team</p>',
  'Session Reminder\n\nDear {{userName}},\n\nThis is a friendly reminder that you have a training session tomorrow:\n\nCourse: {{courseName}}\nDate: {{sessionDate}}\nTime: {{sessionTime}}\nLocation: {{venueName}}\n{{venueAddress}}\n\nWhat to bring:\n- Photo ID\n- Pen and notepad\n- Comfortable clothing\n\nIf you need to cancel or reschedule, please contact us immediately.\n\nSee you tomorrow!\nReact Fast Training Team',
  '["userName", "courseName", "sessionDate", "sessionTime", "venueName", "venueAddress"]'::jsonb,
  'reminder'
);

-- ========================================
-- DEFAULT CANCELLATION REASONS
-- ========================================

INSERT INTO cancellation_reasons (reason, requires_details, is_refundable, display_order) VALUES
('Instructor unavailable', FALSE, TRUE, 1),
('Venue unavailable', FALSE, TRUE, 2),
('Insufficient bookings', FALSE, TRUE, 3),
('Weather conditions', FALSE, TRUE, 4),
('Technical issues', TRUE, TRUE, 5),
('Other', TRUE, TRUE, 99);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to queue email
CREATE OR REPLACE FUNCTION queue_email(
  p_to_email VARCHAR,
  p_subject VARCHAR,
  p_body_html TEXT,
  p_body_text TEXT DEFAULT NULL,
  p_template_id INTEGER DEFAULT NULL,
  p_variables JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS INTEGER AS $$
DECLARE
  v_email_id INTEGER;
BEGIN
  INSERT INTO email_queue (
    to_email, subject, body_html, body_text, 
    template_id, variables, priority, scheduled_for
  ) VALUES (
    p_to_email, p_subject, p_body_html, p_body_text,
    p_template_id, p_variables, p_priority, p_scheduled_for
  ) RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
  p_booking_id INTEGER,
  p_amount DECIMAL(10,2),
  p_reason VARCHAR,
  p_initiated_by INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_refund_id INTEGER;
  v_user_id INTEGER;
  v_stripe_intent_id VARCHAR;
BEGIN
  -- Get user and payment info
  SELECT user_id, stripe_payment_intent_id
  INTO v_user_id, v_stripe_intent_id
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Create refund log
  INSERT INTO refund_logs (
    booking_id, user_id, stripe_payment_intent_id,
    amount, reason, initiated_by
  ) VALUES (
    p_booking_id, v_user_id, v_stripe_intent_id,
    p_amount, p_reason, p_initiated_by
  ) RETURNING id INTO v_refund_id;
  
  RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at 
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANTS
-- ========================================

GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_queue TO authenticated;
GRANT ALL ON cancellation_reasons TO authenticated;
GRANT ALL ON session_cancellations TO authenticated;
GRANT ALL ON refund_logs TO authenticated;
GRANT ALL ON session_waitlist TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE email_templates IS 'Email templates for automated notifications';
COMMENT ON TABLE email_queue IS 'Queue for outgoing emails';
COMMENT ON TABLE cancellation_reasons IS 'Standard reasons for session cancellations';
COMMENT ON TABLE session_cancellations IS 'Log of cancelled sessions';
COMMENT ON TABLE refund_logs IS 'Track all refund transactions';
COMMENT ON TABLE session_waitlist IS 'Waitlist for fully booked sessions';
COMMENT ON TABLE notification_preferences IS 'User notification preferences';