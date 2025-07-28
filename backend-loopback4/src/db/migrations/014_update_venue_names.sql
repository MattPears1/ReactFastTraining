-- Update all venues to use simplified naming
UPDATE venues 
SET name = 'Location 1', 
    code = 'LOCATION_1',
    address = 'Further location information to be announced',
    city = 'TBA',
    postcode = 'TBA'
WHERE name = 'Leeds City Centre' OR name = 'Location 1 Training Venue' OR code = 'LEEDS_CITY' OR code = 'LOCATION_1';

UPDATE venues 
SET name = 'Location 2', 
    code = 'LOCATION_2',
    address = 'Further location information to be announced',
    city = 'TBA',
    postcode = 'TBA'
WHERE name = 'Sheffield Training Centre' OR code = 'SHEFFIELD';

UPDATE venues 
SET name = 'Location 3', 
    code = 'LOCATION_3',
    address = 'Further location information to be announced',
    city = 'TBA',
    postcode = 'TBA'
WHERE name = 'Bradford Business Park' OR code = 'BRADFORD';

UPDATE venues 
SET name = 'Location 4', 
    code = 'LOCATION_4',
    address = 'Further location information to be announced',
    city = 'TBA',
    postcode = 'TBA'
WHERE name = 'York Community Hall' OR code = 'YORK';