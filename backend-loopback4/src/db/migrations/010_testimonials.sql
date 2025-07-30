-- Testimonials System Migration
-- Purpose: Create tables for managing customer testimonials and reviews

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Author information (can be anonymous)
    author_name VARCHAR(255) NOT NULL,
    author_location VARCHAR(255),
    author_email VARCHAR(255),
    show_full_name BOOLEAN DEFAULT true,
    
    -- Course information
    course_taken VARCHAR(255) NOT NULL,
    course_date DATE,
    instructor_name VARCHAR(255),
    
    -- Testimonial content
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    
    -- Status and moderation
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP,
    
    -- Verification
    verified_booking BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verified_at TIMESTAMP,
    
    -- Media
    photo_url TEXT,
    video_url TEXT,
    
    -- Metadata
    submission_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX idx_testimonials_course ON testimonials(course_taken);
CREATE INDEX idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX idx_testimonials_booking_id ON testimonials(booking_id);

-- Testimonial responses table (for admin responses)
CREATE TABLE IF NOT EXISTS testimonial_responses (
    id SERIAL PRIMARY KEY,
    testimonial_id INTEGER NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    responder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonial likes/helpful votes
CREATE TABLE IF NOT EXISTS testimonial_votes (
    id SERIAL PRIMARY KEY,
    testimonial_id INTEGER NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    is_helpful BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(testimonial_id, user_id),
    UNIQUE(testimonial_id, ip_address)
);

-- Create function to auto-verify testimonials from confirmed bookings
CREATE OR REPLACE FUNCTION auto_verify_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    -- If a booking_id is provided, auto-verify if booking is confirmed
    IF NEW.booking_id IS NOT NULL THEN
        UPDATE testimonials
        SET verified_booking = true,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id
        AND EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = NEW.booking_id 
            AND status = 'confirmed'
            AND user_id = NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-verification
CREATE TRIGGER testimonial_auto_verify
    AFTER INSERT ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_testimonial();

-- Update timestamp trigger
CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonial_responses_updated_at
    BEFORE UPDATE ON testimonial_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample testimonials for development
INSERT INTO testimonials (
    author_name, author_location, author_email, course_taken, course_date,
    content, rating, status, is_featured, verified_booking, published_at
) VALUES 
(
    'Sarah Johnson', 'Leeds', 'sarah.j@example.com', 'Emergency First Aid at Work',
    '2025-01-15', 'Excellent course! The instructor was knowledgeable and made the content easy to understand. I feel confident in my ability to handle emergency situations now.',
    5, 'approved', true, true, CURRENT_TIMESTAMP
),
(
    'Michael Chen', 'Sheffield', 'michael.c@example.com', 'Paediatric First Aid',
    '2025-01-10', 'As a nursery teacher, this course was invaluable. The hands-on practice with infant and child CPR gave me the confidence I needed. Highly recommend!',
    5, 'approved', false, true, CURRENT_TIMESTAMP
),
(
    'Emma Williams', 'Bradford', 'emma.w@example.com', 'Mental Health First Aid',
    '2025-01-05', 'This course opened my eyes to the importance of mental health support in the workplace. The trainer created a safe space for discussion and learning.',
    5, 'approved', false, true, CURRENT_TIMESTAMP
),
(
    'David Thompson', 'York', 'david.t@example.com', 'First Aid at Work',
    '2024-12-20', 'Comprehensive three-day course that covered everything from minor injuries to serious medical emergencies. Our instructor Lex was fantastic!',
    5, 'approved', false, true, CURRENT_TIMESTAMP
);

-- Create view for public testimonials
CREATE OR REPLACE VIEW public_testimonials AS
SELECT 
    t.id,
    CASE 
        WHEN t.show_full_name THEN t.author_name
        ELSE CONCAT(LEFT(t.author_name, 1), '. ', SUBSTRING(t.author_name FROM POSITION(' ' IN t.author_name) + 1))
    END as display_name,
    t.author_location,
    t.course_taken,
    t.course_date,
    t.content,
    t.rating,
    t.is_featured,
    t.verified_booking,
    t.photo_url,
    t.created_at,
    t.published_at,
    COUNT(DISTINCT tv.id) as helpful_count,
    COUNT(DISTINCT tr.id) as has_response
FROM testimonials t
LEFT JOIN testimonial_votes tv ON t.id = tv.testimonial_id AND tv.is_helpful = true
LEFT JOIN testimonial_responses tr ON t.id = tr.testimonial_id AND tr.is_public = true
WHERE t.status = 'approved'
GROUP BY t.id;

-- Grant permissions
GRANT SELECT ON public_testimonials TO PUBLIC;