-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  postcode VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create course_schedules table
CREATE TABLE IF NOT EXISTS course_schedules (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id INTEGER NOT NULL,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  venue_id INTEGER REFERENCES venues(id),
  instructor_id INTEGER,
  max_capacity INTEGER NOT NULL DEFAULT 12,
  current_capacity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'full', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default venues
INSERT INTO venues (name, code, address, city, postcode) VALUES 
  ('Location 1', 'LOCATION_1', 'Further location information to be announced', 'TBA', 'TBA'),
  ('Location 2', 'LOCATION_2', 'Further location information to be announced', 'TBA', 'TBA'),
  ('Location 3', 'LOCATION_3', 'Further location information to be announced', 'TBA', 'TBA'),
  ('Location 4', 'LOCATION_4', 'Further location information to be announced', 'TBA', 'TBA')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_schedules_start_datetime ON course_schedules(start_datetime);
CREATE INDEX IF NOT EXISTS idx_course_schedules_status ON course_schedules(status);
CREATE INDEX IF NOT EXISTS idx_course_schedules_venue ON course_schedules(venue_id);

-- Add foreign key constraints if courses table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        ALTER TABLE course_schedules ADD CONSTRAINT fk_course_schedules_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints if users table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE course_schedules ADD CONSTRAINT fk_course_schedules_instructor 
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;