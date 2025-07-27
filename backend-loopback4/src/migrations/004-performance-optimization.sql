-- Performance Optimization Migration
-- This migration adds indexes, materialized views, and other performance improvements

-- ========================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ========================================

-- Booking queries optimization
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_created 
ON bookings(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_session_status 
ON bookings(session_id, status) 
WHERE status IN ('CONFIRMED', 'PAID');

CREATE INDEX IF NOT EXISTS idx_bookings_reference_email 
ON bookings(booking_reference, (contact_details->>'email'));

-- Session availability queries
CREATE INDEX IF NOT EXISTS idx_sessions_date_status_capacity 
ON course_sessions(session_date, status, max_capacity) 
WHERE status = 'PUBLISHED' AND session_date >= CURRENT_DATE;

-- Attendee queries
CREATE INDEX IF NOT EXISTS idx_attendees_email_booking 
ON booking_attendees(email, booking_id);

CREATE INDEX IF NOT EXISTS idx_attendees_special_requirements 
ON booking_attendees(booking_id) 
WHERE special_requirements IS NOT NULL;

-- Payment queries
CREATE INDEX IF NOT EXISTS idx_payments_intent_status 
ON payments(stripe_payment_intent_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_booking_created 
ON payments(booking_id, created_at DESC);

-- Special requirements priority queries
CREATE INDEX IF NOT EXISTS idx_requirements_priority_session 
ON special_requirements(priority, session_id) 
WHERE priority IN ('critical', 'high');

-- ========================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ========================================

-- Active sessions (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_active_sessions 
ON course_sessions(session_date, id) 
WHERE status = 'PUBLISHED' 
  AND session_date >= CURRENT_DATE 
  AND session_date <= CURRENT_DATE + INTERVAL '90 days';

-- Pending bookings cleanup
CREATE INDEX IF NOT EXISTS idx_pending_bookings_cleanup 
ON bookings(created_at) 
WHERE status = 'PENDING';

-- Unpaid bookings follow-up
CREATE INDEX IF NOT EXISTS idx_unpaid_bookings 
ON bookings(created_at, user_id) 
WHERE status = 'CONFIRMED' 
  AND id NOT IN (SELECT booking_id FROM payments WHERE status = 'succeeded');

-- ========================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ========================================

-- Session availability view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_session_availability AS
SELECT 
  cs.id as session_id,
  cs.session_date,
  cs.location,
  c.id as course_id,
  c.name as course_name,
  c.category,
  cs.max_capacity,
  COALESCE(SUM(b.number_of_attendees), 0) as booked_count,
  cs.max_capacity - COALESCE(SUM(b.number_of_attendees), 0) as available_spots,
  cs.price_per_person,
  cs.status,
  t.name as trainer_name
FROM course_sessions cs
JOIN courses c ON cs.course_id = c.id
LEFT JOIN trainers t ON cs.trainer_id = t.id
LEFT JOIN bookings b ON cs.id = b.session_id 
  AND b.status IN ('CONFIRMED', 'PAID')
WHERE cs.status = 'PUBLISHED'
  AND cs.session_date >= CURRENT_DATE
GROUP BY cs.id, cs.session_date, cs.location, c.id, c.name, 
         c.category, cs.max_capacity, cs.price_per_person, cs.status, t.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_session_availability_id 
ON mv_session_availability(session_id);

CREATE INDEX IF NOT EXISTS idx_mv_session_availability_date 
ON mv_session_availability(session_date);

CREATE INDEX IF NOT EXISTS idx_mv_session_availability_spots 
ON mv_session_availability(available_spots) 
WHERE available_spots > 0;

-- Revenue analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_analytics AS
SELECT 
  DATE_TRUNC('month', b.created_at) as month,
  c.id as course_id,
  c.name as course_name,
  c.category,
  COUNT(DISTINCT b.id) as booking_count,
  SUM(b.number_of_attendees) as total_attendees,
  SUM(b.total_amount) as gross_revenue,
  SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END) as refunded_amount,
  SUM(b.total_amount) - COALESCE(SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END), 0) as net_revenue,
  AVG(b.total_amount) as avg_booking_value
FROM bookings b
JOIN course_sessions cs ON b.session_id = cs.id
JOIN courses c ON cs.course_id = c.id
LEFT JOIN refunds r ON b.id = r.booking_id
WHERE b.status IN ('CONFIRMED', 'PAID')
GROUP BY DATE_TRUNC('month', b.created_at), c.id, c.name, c.category;

CREATE INDEX IF NOT EXISTS idx_mv_revenue_month 
ON mv_revenue_analytics(month DESC);

CREATE INDEX IF NOT EXISTS idx_mv_revenue_course 
ON mv_revenue_analytics(course_id);

-- ========================================
-- FUNCTION INDEXES
-- ========================================

-- Email search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_bookings_email_lower 
ON bookings(LOWER(contact_details->>'email'));

CREATE INDEX IF NOT EXISTS idx_attendees_email_lower 
ON booking_attendees(LOWER(email));

-- Date-based indexes
CREATE INDEX IF NOT EXISTS idx_sessions_year_month 
ON course_sessions(
  EXTRACT(YEAR FROM session_date), 
  EXTRACT(MONTH FROM session_date)
);

-- ========================================
-- PERFORMANCE FUNCTIONS
-- ========================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_session_availability;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_analytics;
END;
$$ LANGUAGE plpgsql;

-- Automated refresh trigger
CREATE OR REPLACE FUNCTION trigger_refresh_views()
RETURNS trigger AS $$
BEGIN
  -- Async refresh to avoid blocking
  PERFORM pg_notify('refresh_views', 'booking_update');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS refresh_views_on_booking_change ON bookings;
CREATE TRIGGER refresh_views_on_booking_change
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_views();

DROP TRIGGER IF EXISTS refresh_views_on_session_change ON course_sessions;
CREATE TRIGGER refresh_views_on_session_change
AFTER INSERT OR UPDATE OR DELETE ON course_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_views();

-- ========================================
-- QUERY OPTIMIZATION SETTINGS
-- ========================================

-- Table statistics configuration
ALTER TABLE bookings SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE bookings SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE course_sessions SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE course_sessions SET (autovacuum_analyze_scale_factor = 0.05);

-- ========================================
-- PARTITIONING (for future growth)
-- ========================================

-- Prepare for partitioning bookings by year
-- Note: This is commented out as it requires data migration
-- Uncomment and customize when ready to implement

-- CREATE TABLE bookings_partitioned (LIKE bookings INCLUDING ALL)
-- PARTITION BY RANGE (created_at);
-- 
-- CREATE TABLE bookings_2025 PARTITION OF bookings_partitioned
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
-- 
-- CREATE TABLE bookings_2026 PARTITION OF bookings_partitioned
-- FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ========================================
-- CLEANUP OLD DATA FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete pending bookings older than 24 hours
  WITH deleted AS (
    DELETE FROM bookings
    WHERE status = 'PENDING'
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log the cleanup
  INSERT INTO system_logs (event_type, event_data, created_at)
  VALUES ('booking_cleanup', jsonb_build_object('deleted_count', deleted_count), NOW());
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MONITORING QUERIES
-- ========================================

-- View for slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- View for table sizes and bloat
CREATE OR REPLACE VIEW v_table_maintenance AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- PERFORMANCE HINTS
-- ========================================

COMMENT ON INDEX idx_bookings_user_status_created IS 'Optimizes user booking history queries';
COMMENT ON INDEX idx_sessions_date_status_capacity IS 'Optimizes available session searches';
COMMENT ON INDEX idx_active_sessions IS 'Partial index for frequently accessed upcoming sessions';
COMMENT ON MATERIALIZED VIEW mv_session_availability IS 'Pre-computed session availability - refresh every 5 minutes';
COMMENT ON MATERIALIZED VIEW mv_revenue_analytics IS 'Revenue reporting data - refresh daily';

-- Initial refresh of materialized views
REFRESH MATERIALIZED VIEW mv_session_availability;
REFRESH MATERIALIZED VIEW mv_revenue_analytics;