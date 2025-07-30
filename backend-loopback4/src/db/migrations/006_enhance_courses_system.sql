-- Enhanced Courses System Migration
-- Adds comprehensive course management features

-- ========================================
-- COURSE ENHANCEMENTS
-- ========================================

-- Add missing fields to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS included_materials JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS accreditation_body VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS accreditation_number VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS min_attendees INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS early_bird_discount_percentage INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS early_bird_days_before INTEGER DEFAULT 7;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS group_discount_percentage INTEGER DEFAULT 10;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS group_size_minimum INTEGER DEFAULT 4;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS color_theme VARCHAR(50) DEFAULT 'blue';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS popular_times JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_updated_by INTEGER REFERENCES users(id);

-- Update slug for existing courses
UPDATE courses 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
WHERE slug IS NULL;

-- ========================================
-- COURSE MATERIALS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS course_materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('manual', 'presentation', 'video', 'assessment', 'certificate_template', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(50),
  is_downloadable BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  access_level VARCHAR(50) DEFAULT 'student' CHECK (access_level IN ('public', 'student', 'instructor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX idx_course_materials_type ON course_materials(material_type);

-- ========================================
-- COURSE STATISTICS VIEW
-- ========================================

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
  COALESCE(AVG(cs.current_capacity::FLOAT / NULLIF(cs.max_capacity, 0) * 100), 0) as average_fill_rate,
  MAX(b.created_at) as last_booking_date,
  MIN(cs.start_datetime) as first_session_date,
  MAX(cs.start_datetime) as last_session_date
FROM courses c
LEFT JOIN course_schedules cs ON c.id = cs.course_id
LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status IN ('confirmed', 'completed')
GROUP BY c.id, c.name, c.category, c.price;

-- ========================================
-- COURSE TEMPLATES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS course_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  course_data JSONB NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_course_templates_category ON course_templates(category);
CREATE INDEX idx_course_templates_active ON course_templates(is_active);

-- ========================================
-- COURSE PREREQUISITES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS course_prerequisites (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_course_prerequisite UNIQUE(course_id, prerequisite_course_id),
  CONSTRAINT no_self_prerequisite CHECK (course_id != prerequisite_course_id)
);

CREATE INDEX idx_course_prerequisites_course ON course_prerequisites(course_id);
CREATE INDEX idx_course_prerequisites_prereq ON course_prerequisites(prerequisite_course_id);

-- ========================================
-- COURSE REVIEWS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS course_reviews (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  booking_id INTEGER REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  materials_rating INTEGER CHECK (materials_rating >= 1 AND materials_rating <= 5),
  is_verified BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_course_reviews_published ON course_reviews(is_published);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to update course statistics
CREATE OR REPLACE FUNCTION update_course_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'course_reviews' THEN
    UPDATE courses 
    SET 
      average_rating = (
        SELECT AVG(rating) 
        FROM course_reviews 
        WHERE course_id = NEW.course_id AND is_published = TRUE
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM course_reviews 
        WHERE course_id = NEW.course_id AND is_published = TRUE
      )
    WHERE id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating course statistics
DROP TRIGGER IF EXISTS update_course_stats_on_review ON course_reviews;
CREATE TRIGGER update_course_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON course_reviews
FOR EACH ROW
EXECUTE FUNCTION update_course_statistics();

-- Function to check if course can be deleted
CREATE OR REPLACE FUNCTION check_course_deletion()
RETURNS TRIGGER AS $$
DECLARE
  active_bookings_count INTEGER;
  upcoming_sessions_count INTEGER;
BEGIN
  -- Check for active bookings
  SELECT COUNT(*)
  INTO active_bookings_count
  FROM bookings b
  JOIN course_schedules cs ON b.course_schedule_id = cs.id
  WHERE cs.course_id = OLD.id
    AND b.status IN ('confirmed', 'pending')
    AND cs.start_datetime >= NOW();
    
  IF active_bookings_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete course with % active bookings', active_bookings_count;
  END IF;
  
  -- Check for upcoming sessions
  SELECT COUNT(*)
  INTO upcoming_sessions_count
  FROM course_schedules
  WHERE course_id = OLD.id
    AND start_datetime >= NOW()
    AND status != 'cancelled';
    
  IF upcoming_sessions_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete course with % upcoming sessions', upcoming_sessions_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent unsafe course deletion
DROP TRIGGER IF EXISTS prevent_unsafe_course_deletion ON courses;
CREATE TRIGGER prevent_unsafe_course_deletion
BEFORE DELETE ON courses
FOR EACH ROW
EXECUTE FUNCTION check_course_deletion();

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category_active ON courses(category, is_active);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order, name);

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Add learning outcomes to existing courses
UPDATE courses 
SET learning_outcomes = jsonb_build_array(
  'Understand the role and responsibilities of a first aider',
  'Assess an incident and provide appropriate first aid',
  'Perform CPR and use an AED',
  'Manage bleeding, burns, and fractures',
  'Recognize and treat shock'
)
WHERE course_type = 'EFAW' AND learning_outcomes = '[]';

-- Add materials to courses
INSERT INTO course_materials (course_id, material_type, title, description, is_required)
SELECT 
  id,
  'manual',
  'First Aid at Work Manual',
  'Comprehensive guide covering all aspects of workplace first aid',
  TRUE
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_materials 
  WHERE course_materials.course_id = courses.id 
    AND material_type = 'manual'
);

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT ON course_statistics TO authenticated;
GRANT ALL ON course_materials TO authenticated;
GRANT ALL ON course_templates TO authenticated;
GRANT ALL ON course_prerequisites TO authenticated;
GRANT ALL ON course_reviews TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE course_materials IS 'Stores all training materials associated with courses';
COMMENT ON TABLE course_templates IS 'Pre-configured course templates for quick course creation';
COMMENT ON TABLE course_prerequisites IS 'Defines prerequisite relationships between courses';
COMMENT ON TABLE course_reviews IS 'Student reviews and ratings for courses';
COMMENT ON VIEW course_statistics IS 'Aggregated statistics for each course';