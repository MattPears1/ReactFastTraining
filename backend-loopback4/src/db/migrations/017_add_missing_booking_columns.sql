-- Add missing columns to bookings table that are referenced in queries

-- Add special_requirements column if it doesn't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Add number_of_attendees column if it doesn't exist  
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS number_of_attendees INTEGER DEFAULT 1 CHECK (number_of_attendees >= 1 AND number_of_attendees <= 20);

-- Add payment_intent_id column if it doesn't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Update existing bookings to have 1 attendee if null
UPDATE bookings 
SET number_of_attendees = 1 
WHERE number_of_attendees IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN bookings.special_requirements IS 'Special requirements or notes for the booking';
COMMENT ON COLUMN bookings.number_of_attendees IS 'Number of attendees for this booking (1-20)';
COMMENT ON COLUMN bookings.payment_intent_id IS 'Stripe payment intent ID for tracking payments';