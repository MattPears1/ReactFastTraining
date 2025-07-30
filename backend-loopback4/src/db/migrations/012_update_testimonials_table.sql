-- Add missing columns to testimonials table for admin interface

-- Add show_on_homepage column
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

-- Add booking_reference column
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(255);

-- Add photo_consent column
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS photo_consent VARCHAR(50) DEFAULT 'not_given' 
CHECK (photo_consent IN ('given', 'not_given', 'pending'));

-- Add approved_at and approved_by columns
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add rejection_reason column
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status check constraint to include 'featured'
ALTER TABLE testimonials 
DROP CONSTRAINT IF EXISTS testimonials_status_check;

ALTER TABLE testimonials 
ADD CONSTRAINT testimonials_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'featured', 'archived'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_testimonials_show_on_homepage ON testimonials(show_on_homepage);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved_by ON testimonials(approved_by);

-- Add comment
COMMENT ON TABLE testimonials IS 'Customer testimonials with moderation workflow';