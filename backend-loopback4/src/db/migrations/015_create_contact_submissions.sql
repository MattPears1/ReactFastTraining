-- Create contact_submissions table to store contact form entries
-- This supports the enhanced contact form with number of people and preferred time fields

CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    course VARCHAR(255),
    number_of_people INTEGER,
    preferred_date DATE,
    preferred_time VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by INTEGER REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_course ON contact_submissions(course);

-- Add comment
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions with enhanced fields for course enquiries';