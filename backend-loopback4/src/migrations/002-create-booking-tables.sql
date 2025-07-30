-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  course_type VARCHAR(100) NOT NULL,
  description TEXT,
  duration VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minimum_age INTEGER DEFAULT 16,
  certification_body VARCHAR(100),
  certificate_validity_years INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create course_sessions table
CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  trainer_id UUID,
  max_participants INTEGER DEFAULT 12,
  current_bookings INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'full', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES course_sessions(id),
  booking_reference VARCHAR(10) UNIQUE NOT NULL,
  number_of_attendees INTEGER NOT NULL CHECK (number_of_attendees BETWEEN 1 AND 12),
  total_amount DECIMAL(10, 2) NOT NULL,
  special_requirements TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  terms_accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create booking_attendees table
CREATE TABLE IF NOT EXISTS booking_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create special_requirements table
CREATE TABLE IF NOT EXISTS special_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'standard' CHECK (priority IN ('critical', 'high', 'standard')),
  instructor_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create requirement_templates table
CREATE TABLE IF NOT EXISTS requirement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  requires_details BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_course_sessions_date ON course_sessions(session_date);
CREATE INDEX idx_course_sessions_status ON course_sessions(status);
CREATE INDEX idx_booking_attendees_booking ON booking_attendees(booking_id);
CREATE INDEX idx_special_requirements_booking ON special_requirements(booking_id);

-- Insert predefined requirement templates
INSERT INTO requirement_templates (category, requirement_type, display_name, description, requires_details) VALUES
('accessibility', 'wheelchair', 'Wheelchair Access', 'I require wheelchair accessible facilities', false),
('accessibility', 'hearing', 'Hearing Assistance', 'I have hearing difficulties and may need assistance', true),
('accessibility', 'visual', 'Visual Impairment', 'I have visual impairments that may affect participation', true),
('accessibility', 'mobility', 'Mobility Limitations', 'I have mobility limitations', true),
('dietary', 'vegetarian', 'Vegetarian', 'Vegetarian meals required', false),
('dietary', 'vegan', 'Vegan', 'Vegan meals required', false),
('dietary', 'halal', 'Halal', 'Halal meals required', false),
('dietary', 'kosher', 'Kosher', 'Kosher meals required', false),
('dietary', 'allergy', 'Food Allergy', 'I have food allergies', true),
('dietary', 'gluten_free', 'Gluten Free', 'Gluten-free meals required', false),
('medical', 'medication', 'Emergency Medication', 'I carry emergency medication', true),
('medical', 'pregnancy', 'Pregnancy', 'I am pregnant', true),
('medical', 'condition', 'Medical Condition', 'I have a medical condition that may affect participation', true),
('other', 'language', 'Language Support', 'I may need language support', true),
('other', 'carer', 'Carer/Assistant', 'I will be accompanied by a carer/assistant', true),
('other', 'religious', 'Religious Observance', 'I have religious requirements', true);

-- Insert sample courses
INSERT INTO courses (name, course_type, description, duration, price, certification_body) VALUES
('Emergency First Aid at Work', 'Emergency First Aid at Work', 'HSE approved 1-day course covering emergency first aid skills', '6 hours', 75.00, 'HSE'),
('First Aid at Work', 'First Aid at Work', 'Comprehensive 3-day first aid course for workplace first aiders', '18 hours', 200.00, 'HSE'),
('Paediatric First Aid', 'Paediatric First Aid', 'Specialized first aid course for those working with children', '6 hours', 120.00, 'Ofqual');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();