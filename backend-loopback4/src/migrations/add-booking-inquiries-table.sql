-- Create booking_inquiries table
CREATE TABLE IF NOT EXISTS booking_inquiries (
  id TEXT PRIMARY KEY,
  inquiry_reference TEXT NOT NULL UNIQUE,
  course_session_id TEXT NOT NULL,
  
  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  
  -- Inquiry Details
  number_of_people INTEGER NOT NULL DEFAULT 1,
  questions TEXT,
  preferred_payment_method TEXT NOT NULL,
  marketing_consent BOOLEAN DEFAULT FALSE,
  
  -- Course Details (stored for reference)
  course_details JSONB NOT NULL,
  
  -- Status and Expiry
  status TEXT NOT NULL DEFAULT 'pending', -- pending, responded, converted, expired
  hold_expires_at TIMESTAMP NOT NULL,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  converted_at TIMESTAMP,
  booking_id TEXT, -- Link to actual booking if converted
  
  -- Response tracking
  instructor_notes TEXT,
  continuation_url TEXT
);

-- Create indexes
CREATE INDEX idx_booking_inquiries_reference ON booking_inquiries(inquiry_reference);
CREATE INDEX idx_booking_inquiries_session ON booking_inquiries(course_session_id);
CREATE INDEX idx_booking_inquiries_status ON booking_inquiries(status);
CREATE INDEX idx_booking_inquiries_expires ON booking_inquiries(hold_expires_at);
CREATE INDEX idx_booking_inquiries_email ON booking_inquiries(email);

-- Add foreign key constraint
ALTER TABLE booking_inquiries 
ADD CONSTRAINT fk_booking_inquiries_session 
FOREIGN KEY (course_session_id) 
REFERENCES course_sessions(id) 
ON DELETE CASCADE;