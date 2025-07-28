-- Add display_order column to courses table
-- This fixes the admin courses page which expects this column

-- Add display_order column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set default order based on course type
UPDATE courses
SET display_order = 
  CASE 
    WHEN course_type = 'EFAW' THEN 1
    WHEN course_type = 'FAW' THEN 2
    WHEN course_type = 'PAEDIATRIC' THEN 3
    ELSE 99
  END
WHERE display_order IS NULL OR display_order = 0;

-- Add other missing columns the admin interface expects
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS accreditation_body VARCHAR(255) DEFAULT 'HSE';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_courses_display_order 
ON courses(display_order);

-- Add comment
COMMENT ON COLUMN courses.display_order IS 'Order in which courses should be displayed';