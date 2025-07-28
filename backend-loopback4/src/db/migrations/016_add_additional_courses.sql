-- Add Additional Courses Migration
-- Adds Emergency Paediatric, Activity First Aid, CPR and AED, Annual Skills Refresher, and Oxygen Therapy courses

-- First, ensure we have all the required columns
DO $$ 
BEGIN
  -- Add slug column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'slug') THEN
    ALTER TABLE courses ADD COLUMN slug VARCHAR(255) UNIQUE;
  END IF;
  
  -- Add accreditation_body column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'accreditation_body') THEN
    ALTER TABLE courses ADD COLUMN accreditation_body VARCHAR(100);
  END IF;
  
  -- Add learning_outcomes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'learning_outcomes') THEN
    ALTER TABLE courses ADD COLUMN learning_outcomes JSONB DEFAULT '[]';
  END IF;
  
  -- Add display_order column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'display_order') THEN
    ALTER TABLE courses ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Insert the additional courses (only if they don't already exist)
INSERT INTO courses (
  name, 
  description, 
  course_type, 
  category, 
  duration, 
  duration_hours, 
  price, 
  max_capacity, 
  certification_validity_years, 
  is_active
) VALUES 
-- Emergency Paediatric First Aid
(
  'Emergency Paediatric First Aid',
  'Essential emergency care for infants and children. This 1-day course provides vital skills for those working with young children.',
  'EPFA',
  'paediatric',
  '1 Day',
  6,
  100.00,
  12,
  3,
  true
),
-- Activity First Aid
(
  'Activity First Aid',
  'Specialized first aid training for sports and outdoor activities. Perfect for coaches, activity leaders, and outdoor instructors.',
  'AFA',
  'specialist',
  '1 Day',
  6,
  120.00,
  12,
  3,
  true
),
-- CPR and AED
(
  'CPR and AED',
  'Life-saving CPR and defibrillator training. Essential skills that could save a life in cardiac emergencies.',
  'CPR_AED',
  'specialist',
  '3 Hours',
  3,
  60.00,
  12,
  1,
  true
),
-- Annual Skills Refresher
(
  'Annual Skills Refresher', 
  'Keep your first aid skills current with this essential refresher course. HSE strongly recommends annual refresher training to maintain competence.',
  'ASR',
  'requalification',
  '3 Hours',
  3,
  60.00,
  12,
  1,
  true
),
-- Oxygen Therapy Course
(
  'Oxygen Therapy Course',
  'Learn the safe administration of emergency oxygen. Essential for first aiders in high-risk environments.',
  'O2',
  'specialist', 
  '3 Hours',
  3,
  60.00,
  12,
  3,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Update additional fields for courses that were just inserted
UPDATE courses SET 
  slug = CASE 
    WHEN name = 'Emergency Paediatric First Aid' THEN 'emergency-paediatric'
    WHEN name = 'Activity First Aid' THEN 'activity-first-aid'
    WHEN name = 'CPR and AED' THEN 'cpr-aed'
    WHEN name = 'Annual Skills Refresher' THEN 'annual-skills-refresher'
    WHEN name = 'Oxygen Therapy Course' THEN 'oxygen-therapy'
  END,
  accreditation_body = CASE 
    WHEN name IN ('Emergency Paediatric First Aid', 'Activity First Aid', 'Oxygen Therapy Course') THEN 'OFQUAL'
    WHEN name IN ('CPR and AED', 'Annual Skills Refresher') THEN 'HSE'
  END,
  learning_outcomes = CASE 
    WHEN name = 'Emergency Paediatric First Aid' THEN jsonb_build_array(
      'Assess emergency situations with children',
      'Perform CPR on infants and children', 
      'Treat choking in different age groups',
      'Manage childhood injuries and shock',
      'Recognize signs of serious illness',
      'EYFS and Ofsted compliant training'
    )
    WHEN name = 'Activity First Aid' THEN jsonb_build_array(
      'First aid for outdoor environments',
      'Managing sports-related injuries',
      'Environmental hazards and hypothermia',
      'Moving casualties safely',
      'Improvising first aid equipment',
      'Adventure activity specific scenarios'
    )
    WHEN name = 'CPR and AED' THEN jsonb_build_array(
      'Adult CPR techniques',
      'Using an Automated External Defibrillator (AED)',
      'Recovery position',
      'Choking procedures',
      'Chain of survival',
      'Hands-on practice with training equipment'
    )
    WHEN name = 'Annual Skills Refresher' THEN jsonb_build_array(
      'Refresh essential first aid skills',
      'Update on current best practices',
      'CPR and recovery position practice',
      'Review of common workplace injuries',
      'Confidence building through scenarios',
      'HSE recommended annual update'
    )
    WHEN name = 'Oxygen Therapy Course' THEN jsonb_build_array(
      'Understanding oxygen therapy principles',
      'Safe handling of oxygen equipment',
      'When and how to administer oxygen',
      'Oxygen safety and storage',
      'Legal and ethical considerations',
      'Practical equipment training'
    )
  END,
  display_order = CASE 
    WHEN name = 'Emergency Paediatric First Aid' THEN 4
    WHEN name = 'Activity First Aid' THEN 5
    WHEN name = 'CPR and AED' THEN 6
    WHEN name = 'Annual Skills Refresher' THEN 7
    WHEN name = 'Oxygen Therapy Course' THEN 8
  END
WHERE name IN (
  'Emergency Paediatric First Aid',
  'Activity First Aid',
  'CPR and AED',
  'Annual Skills Refresher',
  'Oxygen Therapy Course'
);

-- Update display order for existing courses if needed
UPDATE courses SET display_order = 1 WHERE course_type = 'EFAW' AND display_order IS NULL;
UPDATE courses SET display_order = 2 WHERE course_type = 'FAW' AND display_order IS NULL;
UPDATE courses SET display_order = 3 WHERE course_type = 'PAEDIATRIC' AND display_order IS NULL;

-- Create indexes only if columns exist
DO $$ 
BEGIN
  -- Create index on display_order if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'courses' AND column_name = 'display_order') THEN
    CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order, name);
  END IF;
  
  -- Create index on slug if column exists  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'courses' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
  END IF;
END $$;