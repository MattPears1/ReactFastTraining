-- Update course durations to match the correct lengths
-- First Aid at Work: 3 Days
-- Paediatric First Aid: 2 Days  
-- Emergency Paediatric First Aid: 1 Day
-- Oxygen Therapy: 1 Day

-- Update First Aid at Work to 3 days
UPDATE courses 
SET duration = '3 Days',
    duration_hours = 18
WHERE name = 'First Aid at Work' 
   OR title = 'First Aid at Work'
   OR course_type = 'FAW';

-- Update Paediatric First Aid to 2 days
UPDATE courses
SET duration = '2 Days',
    duration_hours = 12
WHERE (name = 'Paediatric First Aid' 
   OR title = 'Paediatric First Aid'
   OR course_type = 'PAEDIATRIC')
   AND NOT (name LIKE '%Emergency%' OR title LIKE '%Emergency%');

-- Update Emergency Paediatric First Aid to 1 day
UPDATE courses
SET duration = '1 Day',
    duration_hours = 6
WHERE name = 'Emergency Paediatric First Aid'
   OR title = 'Emergency Paediatric First Aid'
   OR course_type = 'EMERGENCY_PAEDIATRIC';

-- Update Oxygen Therapy to 1 day
UPDATE courses
SET duration = '1 Day', 
    duration_hours = 6
WHERE name = 'Oxygen Therapy'
   OR title = 'Oxygen Therapy'
   OR title = 'Oxygen Therapy Course'
   OR course_type = 'OXYGEN_THERAPY';

-- Also update the durationDays column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'courses' 
             AND column_name = 'duration_days') THEN
    UPDATE courses SET duration_days = 3 WHERE course_type = 'FAW';
    UPDATE courses SET duration_days = 2 WHERE course_type = 'PAEDIATRIC' AND NOT (name LIKE '%Emergency%' OR title LIKE '%Emergency%');
    UPDATE courses SET duration_days = 1 WHERE course_type IN ('EMERGENCY_PAEDIATRIC', 'OXYGEN_THERAPY', 'EFAW');
  END IF;
END $$;

-- Add comment explaining the durations
COMMENT ON TABLE courses IS 'Course catalog with correct durations: FAW=3 days, Paediatric=2 days, Emergency Paediatric=1 day, EFAW=1 day, Oxygen=1 day';