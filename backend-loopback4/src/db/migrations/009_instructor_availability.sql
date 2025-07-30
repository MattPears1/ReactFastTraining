-- Migration: Add instructor availability tracking
-- Created: 2025-01-28
-- Purpose: Track instructor availability for better scheduling

-- =====================================================
-- INSTRUCTOR AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS instructor_availability (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Recurring weekly availability
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    -- Specific date availability (overrides weekly)
    specific_date DATE,
    is_available BOOLEAN DEFAULT true,
    -- Availability type
    availability_type VARCHAR(20) NOT NULL DEFAULT 'recurring' CHECK (availability_type IN ('recurring', 'specific', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure either weekly or specific date is set
    CONSTRAINT chk_availability_type CHECK (
        (availability_type = 'recurring' AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND specific_date IS NULL) OR
        (availability_type IN ('specific', 'blocked') AND specific_date IS NOT NULL AND day_of_week IS NULL)
    ),
    -- Ensure end time is after start time for recurring
    CONSTRAINT chk_time_order CHECK (
        availability_type != 'recurring' OR end_time > start_time
    )
);

-- Indexes for instructor availability
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_recurring ON instructor_availability(instructor_id, day_of_week) 
    WHERE availability_type = 'recurring' AND is_available = true;
CREATE INDEX idx_instructor_availability_specific ON instructor_availability(instructor_id, specific_date) 
    WHERE availability_type IN ('specific', 'blocked');

-- =====================================================
-- INSTRUCTOR QUALIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS instructor_qualifications (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification_type VARCHAR(100) NOT NULL,
    qualification_number VARCHAR(100),
    issuing_body VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by INTEGER REFERENCES users(id),
    document_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for instructor qualifications
CREATE INDEX idx_instructor_qualifications_instructor ON instructor_qualifications(instructor_id);
CREATE INDEX idx_instructor_qualifications_expiry ON instructor_qualifications(expiry_date) 
    WHERE expiry_date IS NOT NULL;

-- =====================================================
-- INSTRUCTOR COURSE SPECIALIZATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS instructor_specializations (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    experience_years INTEGER DEFAULT 0,
    last_taught_date DATE,
    total_sessions_taught INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instructor_id, course_id)
);

-- Indexes for instructor specializations
CREATE INDEX idx_instructor_specializations_instructor ON instructor_specializations(instructor_id);
CREATE INDEX idx_instructor_specializations_course ON instructor_specializations(course_id);

-- =====================================================
-- BLACKOUT DATES (Holidays, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS blackout_dates (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    affects_all_instructors BOOLEAN DEFAULT true,
    specific_instructor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(date, specific_instructor_id)
);

-- Indexes for blackout dates
CREATE INDEX idx_blackout_dates_date ON blackout_dates(date);
CREATE INDEX idx_blackout_dates_instructor ON blackout_dates(specific_instructor_id) 
    WHERE specific_instructor_id IS NOT NULL;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if instructor is available for a specific date/time
CREATE OR REPLACE FUNCTION is_instructor_available(
    p_instructor_id INTEGER,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week INTEGER;
    v_is_available BOOLEAN;
BEGIN
    -- Get day of week (0=Sunday, 6=Saturday)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Check blackout dates first
    IF EXISTS (
        SELECT 1 FROM blackout_dates
        WHERE date = p_date
        AND (affects_all_instructors = true OR specific_instructor_id = p_instructor_id)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check specific date availability (overrides recurring)
    SELECT is_available INTO v_is_available
    FROM instructor_availability
    WHERE instructor_id = p_instructor_id
    AND specific_date = p_date
    AND availability_type IN ('specific', 'blocked')
    LIMIT 1;
    
    IF v_is_available IS NOT NULL THEN
        RETURN v_is_available;
    END IF;
    
    -- Check recurring availability
    SELECT true INTO v_is_available
    FROM instructor_availability
    WHERE instructor_id = p_instructor_id
    AND day_of_week = v_day_of_week
    AND availability_type = 'recurring'
    AND is_available = true
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    LIMIT 1;
    
    RETURN COALESCE(v_is_available, FALSE);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA FOR MAIN INSTRUCTOR (Lex)
-- =====================================================

-- Get Lex's user ID (assuming email is lex@reactfasttraining.co.uk)
DO $$
DECLARE
    v_instructor_id INTEGER;
BEGIN
    -- Find Lex's user ID
    SELECT id INTO v_instructor_id
    FROM users
    WHERE email = 'lex@reactfasttraining.co.uk'
    AND role IN ('admin', 'instructor')
    LIMIT 1;
    
    IF v_instructor_id IS NOT NULL THEN
        -- Add recurring availability (Monday to Friday, 9 AM to 5 PM)
        INSERT INTO instructor_availability (instructor_id, day_of_week, start_time, end_time, availability_type)
        VALUES 
            (v_instructor_id, 1, '09:00', '17:00', 'recurring'), -- Monday
            (v_instructor_id, 2, '09:00', '17:00', 'recurring'), -- Tuesday
            (v_instructor_id, 3, '09:00', '17:00', 'recurring'), -- Wednesday
            (v_instructor_id, 4, '09:00', '17:00', 'recurring'), -- Thursday
            (v_instructor_id, 5, '09:00', '17:00', 'recurring')  -- Friday
        ON CONFLICT DO NOTHING;
        
        -- Add some qualifications
        INSERT INTO instructor_qualifications (instructor_id, qualification_type, issuing_body, issue_date, expiry_date, is_verified)
        VALUES 
            (v_instructor_id, 'First Aid Instructor', 'HSE', '2020-01-01', '2025-12-31', true),
            (v_instructor_id, 'Advanced Life Support', 'Resuscitation Council UK', '2022-06-01', '2025-06-01', true),
            (v_instructor_id, 'Paediatric First Aid Instructor', 'TQUK', '2021-03-15', '2024-03-15', true)
        ON CONFLICT DO NOTHING;
        
        -- Add course specializations
        INSERT INTO instructor_specializations (instructor_id, course_id, is_primary, experience_years)
        SELECT v_instructor_id, id, true, 10
        FROM courses
        WHERE is_active = true
        ON CONFLICT (instructor_id, course_id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Update triggers
CREATE TRIGGER update_instructor_availability_updated_at 
    BEFORE UPDATE ON instructor_availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_qualifications_updated_at 
    BEFORE UPDATE ON instructor_qualifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();