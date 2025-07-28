-- Add max_capacity column to course_schedules table
-- This fixes the admin schedule page which expects this column

-- Add max_capacity column with a default value
ALTER TABLE course_schedules 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 20;

-- Update existing rows to set max_capacity based on course type if possible
UPDATE course_schedules cs
SET max_capacity = 
  CASE 
    WHEN c.course_type = 'EFAW' THEN 16
    WHEN c.course_type = 'FAW' THEN 12
    WHEN c.course_type = 'PAEDIATRIC' THEN 12
    ELSE 20
  END
FROM courses c
WHERE cs.course_id = c.id
AND cs.max_capacity IS NULL;

-- Add check constraint to ensure capacity values are valid
ALTER TABLE course_schedules
ADD CONSTRAINT check_capacity_values 
CHECK (max_capacity > 0 AND current_capacity >= 0 AND current_capacity <= max_capacity);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_course_schedules_capacity 
ON course_schedules(max_capacity, current_capacity);

-- Add comment
COMMENT ON COLUMN course_schedules.max_capacity IS 'Maximum number of participants allowed for this session';