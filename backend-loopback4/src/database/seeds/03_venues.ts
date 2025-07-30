import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('venues').del();
  
  // Insert simplified 3 venues only
  await knex('venues').insert([
    {
      id: 1,
      name: 'Location 1 - Sheffield',
      address_line1: 'Sheffield City Centre',
      address_line2: 'Training Facility',
      city: 'Sheffield',
      postcode: 'S1 2HE',
      capacity: 12,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access', 'refreshments']),
      parking_info: 'Free parking available on-site',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'Location 2 - Sheffield',
      address_line1: 'Sheffield Business District',
      address_line2: 'Professional Training Centre',
      city: 'Sheffield',
      postcode: 'S3 7HS',
      capacity: 12,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access', 'refreshments']),
      parking_info: 'Paid parking nearby (£5 all day)',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      name: 'Location 3 - Yorkshire',
      address_line1: 'To Be Confirmed',
      address_line2: '',
      city: 'Yorkshire',
      postcode: 'TBD',
      capacity: 12,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('Simplified venue setup complete - 3 locations configured');
}