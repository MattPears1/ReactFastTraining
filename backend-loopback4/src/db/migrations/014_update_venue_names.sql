-- First check if venues table exists and has the code column
DO $$
BEGIN
    -- Check if venues table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venues') THEN
        -- Check if code column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'code') THEN
            -- Update venues with code column
            UPDATE venues 
            SET name = 'Location 1', 
                code = 'LOCATION_1',
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Leeds City Centre' OR name = 'Location 1 Training Venue' OR code = 'LEEDS_CITY' OR code = 'LOCATION_1';

            UPDATE venues 
            SET name = 'Location 2', 
                code = 'LOCATION_2',
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Sheffield Training Centre' OR code = 'SHEFFIELD';

            UPDATE venues 
            SET name = 'Location 3', 
                code = 'LOCATION_3',
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Bradford Business Park' OR code = 'BRADFORD';

            UPDATE venues 
            SET name = 'Location 4', 
                code = 'LOCATION_4',
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'York Community Hall' OR code = 'YORK';
        ELSE
            -- Update venues without code column
            UPDATE venues 
            SET name = 'Location 1', 
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Leeds City Centre' OR name = 'Location 1 Training Venue';

            UPDATE venues 
            SET name = 'Location 2', 
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Sheffield Training Centre';

            UPDATE venues 
            SET name = 'Location 3', 
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'Bradford Business Park';

            UPDATE venues 
            SET name = 'Location 4', 
                address_line1 = 'Further location information to be announced',
                city = 'TBA',
                postcode = 'TBA'
            WHERE name = 'York Community Hall';
        END IF;
    END IF;
END $$;