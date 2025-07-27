import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('venues').del();
  
  // Insert placeholder venues for all Yorkshire locations
  await knex('venues').insert([
    // Sheffield Locations
    {
      name: 'Sheffield Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Sheffield',
      postcode: 'S1 1AA',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Sheffield Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Sheffield',
      postcode: 'S2 2BB',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Leeds Locations
    {
      name: 'Leeds Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Leeds',
      postcode: 'LS1 1AA',
      capacity: 20,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Leeds Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Leeds',
      postcode: 'LS2 2BB',
      capacity: 20,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Bradford Locations
    {
      name: 'Bradford Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Bradford',
      postcode: 'BD1 1AA',
      capacity: 18,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Bradford Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Bradford',
      postcode: 'BD2 2BB',
      capacity: 18,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // York Locations
    {
      name: 'York Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'York',
      postcode: 'YO1 1AA',
      capacity: 16,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'York Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'York',
      postcode: 'YO2 2BB',
      capacity: 16,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Huddersfield Locations
    {
      name: 'Huddersfield Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Huddersfield',
      postcode: 'HD1 1AA',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Huddersfield Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Huddersfield',
      postcode: 'HD2 2BB',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Wakefield Locations
    {
      name: 'Wakefield Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Wakefield',
      postcode: 'WF1 1AA',
      capacity: 14,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Wakefield Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Wakefield',
      postcode: 'WF2 2BB',
      capacity: 14,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Halifax Locations
    {
      name: 'Halifax Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Halifax',
      postcode: 'HX1 1AA',
      capacity: 14,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Halifax Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Halifax',
      postcode: 'HX2 2BB',
      capacity: 14,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Harrogate Locations
    {
      name: 'Harrogate Location 1 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Harrogate',
      postcode: 'HG1 1AA',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Harrogate Location 2 - To Be Announced',
      address_line1: 'To Be Announced',
      city: 'Harrogate',
      postcode: 'HG2 2BB',
      capacity: 15,
      facilities: JSON.stringify(['projector', 'whiteboard', 'parking', 'disabled_access']),
      parking_info: 'Details to be confirmed',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Client On-Site Training Option
    {
      name: 'Client On-Site Training',
      address_line1: 'Your Location',
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
  
  console.log('Training venues seeded successfully - all placeholder locations ready for future updates');
}