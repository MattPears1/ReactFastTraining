-- Create attendance table for tracking session attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'PARTIAL')),
  notes TEXT,
  marked_by UUID,
  marked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one attendance record per booking
  UNIQUE(booking_id, session_id)
);

-- Add indexes for performance
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Add column to course_sessions for better capacity tracking
ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 12 CHECK (max_capacity <= 12),
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0 CHECK (current_bookings >= 0);

-- Create a view for available sessions
CREATE OR REPLACE VIEW available_sessions AS
SELECT 
  cs.*,
  (cs.max_capacity - cs.current_bookings) as available_spots,
  CASE 
    WHEN cs.current_bookings >= cs.max_capacity THEN 'FULL'
    WHEN cs.current_bookings >= (cs.max_capacity - 3) THEN 'ALMOST_FULL'
    ELSE 'AVAILABLE'
  END as availability_status
FROM course_sessions cs
WHERE cs.status = 'SCHEDULED'
  AND cs.start_date >= CURRENT_DATE
  AND cs.current_bookings < cs.max_capacity;