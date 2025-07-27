import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Check if venues already exist
  const existingVenues = await knex('venues').count('* as count');
  
  if (Number(existingVenues[0].count) === 0) {
    // Insert Yorkshire training venues
    await knex('venues').insert([
      {
        name: 'Leeds City Centre Training Venue',
        address_line1: '123 Park Lane',
        address_line2: 'City Centre',
        city: 'Leeds',
        postcode: 'LS1 3HL',
        capacity: 20,
        facilities: JSON.stringify(['projector', 'whiteboard', 'kitchen', 'breakout_rooms']),
        parking_info: 'Public car park adjacent (£5 all day)',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sheffield Business Park',
        address_line1: 'Europa Link',
        address_line2: 'Sheffield Business Park',
        city: 'Sheffield',
        postcode: 'S9 1XU',
        capacity: 15,
        facilities: JSON.stringify(['projector', 'whiteboard', 'parking']),
        parking_info: 'Free on-site parking available',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bradford Community Centre',
        address_line1: 'Great Horton Road',
        city: 'Bradford',
        postcode: 'BD7 1AA',
        capacity: 25,
        facilities: JSON.stringify(['projector', 'kitchen', 'disabled_access']),
        parking_info: 'Street parking available',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'York Conference Centre',
        address_line1: 'Tower Street',
        city: 'York',
        postcode: 'YO1 9TW',
        capacity: 30,
        facilities: JSON.stringify(['projector', 'av_equipment', 'catering', 'parking']),
        parking_info: 'Hotel parking £10/day',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Client On-Site Training',
        address_line1: 'Various Locations',
        city: 'Yorkshire',
        postcode: 'Various',
        capacity: 999,
        facilities: JSON.stringify(['varies']),
        parking_info: 'Depends on client site',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
    
    console.log('Training venues seeded successfully');
  } else {
    console.log('Venues already exist, skipping seed');
  }
}