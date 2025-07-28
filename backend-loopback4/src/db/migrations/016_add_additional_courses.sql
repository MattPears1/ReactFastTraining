-- Add Additional Courses Migration
-- Adds Emergency Paediatric, Activity First Aid, CPR and AED, Annual Skills Refresher, and Oxygen Therapy courses

-- First, ensure we have all the course types we need
-- Since course_type is now a flexible varchar(100), we can add any course type

-- Insert the additional courses
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
  is_active,
  slug,
  accreditation_body,
  learning_outcomes,
  display_order
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
  true,
  'emergency-paediatric',
  'OFQUAL',
  jsonb_build_array(
    'Assess emergency situations with children',
    'Perform CPR on infants and children', 
    'Treat choking in different age groups',
    'Manage childhood injuries and shock',
    'Recognize signs of serious illness',
    'EYFS and Ofsted compliant training'
  ),
  4
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
  true,
  'activity-first-aid',
  'OFQUAL',
  jsonb_build_array(
    'First aid for outdoor environments',
    'Managing sports-related injuries',
    'Environmental hazards and hypothermia',
    'Moving casualties safely',
    'Improvising first aid equipment',
    'Adventure activity specific scenarios'
  ),
  5
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
  true,
  'cpr-aed',
  'HSE',
  jsonb_build_array(
    'Adult CPR techniques',
    'Using an Automated External Defibrillator (AED)',
    'Recovery position',
    'Choking procedures',
    'Chain of survival',
    'Hands-on practice with training equipment'
  ),
  6
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
  true,
  'annual-skills-refresher',
  'HSE',
  jsonb_build_array(
    'Refresh essential first aid skills',
    'Update on current best practices',
    'CPR and recovery position practice',
    'Review of common workplace injuries',
    'Confidence building through scenarios',
    'HSE recommended annual update'
  ),
  7
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
  true,
  'oxygen-therapy',
  'OFQUAL',
  jsonb_build_array(
    'Understanding oxygen therapy principles',
    'Safe handling of oxygen equipment',
    'When and how to administer oxygen',
    'Oxygen safety and storage',
    'Legal and ethical considerations',
    'Practical equipment training'
  ),
  8
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  course_type = EXCLUDED.course_type,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  duration_hours = EXCLUDED.duration_hours,
  price = EXCLUDED.price,
  learning_outcomes = EXCLUDED.learning_outcomes,
  display_order = EXCLUDED.display_order,
  updated_at = CURRENT_TIMESTAMP;

-- Update display order for existing courses to maintain proper ordering
UPDATE courses SET display_order = 1 WHERE course_type = 'EFAW' AND display_order IS NULL;
UPDATE courses SET display_order = 2 WHERE course_type = 'FAW' AND display_order IS NULL;
UPDATE courses SET display_order = 3 WHERE course_type = 'PAEDIATRIC' AND display_order IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order, name);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);

-- Add comments
COMMENT ON COLUMN courses.display_order IS 'Order in which courses appear on the website';