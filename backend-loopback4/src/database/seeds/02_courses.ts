import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('courses').del();
  
  // Insert seed entries
  await knex('courses').insert([
    {
      name: 'Emergency First Aid at Work',
      description: 'This one-day course covers the essential skills needed to act as an emergency first aider in the workplace. Includes CPR, choking, bleeding control, and managing an unresponsive casualty.',
      course_type: 'EFAW',
      duration_hours: 6,
      price: 75.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'First Aid at Work',
      description: 'Comprehensive 3-day first aid course covering all aspects of workplace first aid. Suitable for appointed workplace first aiders. Includes all EFAW content plus additional injuries and illnesses.',
      course_type: 'FAW',
      duration_hours: 18,
      price: 95.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Paediatric First Aid',
      description: 'Essential first aid course for those working with children. Covers child and infant CPR, choking, common childhood illnesses and injuries. Meets Ofsted requirements.',
      course_type: 'Paediatric',
      duration_hours: 6,
      price: 85.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}