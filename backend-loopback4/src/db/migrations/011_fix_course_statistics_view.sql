-- Fix course_statistics view 
-- Use c.max_capacity from courses table instead of cs.max_capacity

DROP VIEW IF EXISTS course_statistics CASCADE;

CREATE OR REPLACE VIEW course_statistics AS
SELECT 
  c.id,
  c.name,
  c.category,
  c.price,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT b.user_id) as unique_students,
  COALESCE(SUM(b.payment_amount), 0) as total_revenue,
  COALESCE(AVG(b.payment_amount), 0) as average_booking_value,
  COUNT(DISTINCT cs.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN cs.start_datetime < NOW() THEN cs.id END) as completed_sessions,
  COUNT(DISTINCT CASE WHEN cs.start_datetime >= NOW() THEN cs.id END) as upcoming_sessions,
  COALESCE(AVG(cs.current_capacity::FLOAT / NULLIF(c.max_capacity, 0) * 100), 0) as average_fill_rate,
  MAX(b.created_at) as last_booking_date,
  MIN(cs.start_datetime) as first_session_date,
  MAX(cs.start_datetime) as last_session_date
FROM courses c
LEFT JOIN course_schedules cs ON c.id = cs.course_id
LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status IN ('confirmed', 'completed')
GROUP BY c.id, c.name, c.category, c.price;

-- Add comment
COMMENT ON VIEW course_statistics IS 'Aggregated statistics for each course (fixed column names)';