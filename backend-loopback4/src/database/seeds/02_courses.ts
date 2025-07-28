import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // First, delete any course_schedules that reference requalification courses
  const requalCourseIds = await knex('courses')
    .where('course_type', 'like', '%REQUAL%')
    .orWhere('category', '=', 'requalification')
    .pluck('id');
  
  if (requalCourseIds.length > 0) {
    await knex('course_schedules').whereIn('course_id', requalCourseIds).del();
  }
  
  // Then delete ALL existing course entries
  await knex('courses').del();
  
  // Insert all courses from the website (removing all requalification courses)
  await knex('courses').insert([
    // Workplace First Aid
    {
      name: 'Emergency First Aid at Work',
      description: 'This one-day course covers the essential skills needed to act as an emergency first aider in the workplace. Includes CPR, choking, bleeding control, and managing an unresponsive casualty. HSE approved and includes a 3-year certificate.',
      course_type: 'EFAW',
      category: 'workplace',
      duration: '1 Day',
      duration_hours: 6,
      price: 100.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'First Aid at Work',
      description: 'Comprehensive first aid course covering all aspects of workplace first aid. Suitable for appointed workplace first aiders. Includes all EFAW content plus additional injuries, illnesses, and advanced techniques. HSE approved with 3-year certification.',
      course_type: 'FAW',
      category: 'workplace',
      duration: '3 Days',
      duration_hours: 18,
      price: 200.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Paediatric First Aid
    {
      name: 'Paediatric First Aid',
      description: 'Essential first aid course for those working with children. Covers child and infant CPR, choking, common childhood illnesses and injuries. Meets Ofsted and EYFS requirements with 3-year certification.',
      course_type: 'PFA',
      category: 'paediatric',
      duration: '2 Days',
      duration_hours: 12,
      price: 120.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Emergency Paediatric First Aid',
      description: 'Focused paediatric first aid course covering essential skills for childcare emergencies. Includes child CPR, choking, and emergency response. EYFS compliant with practical focus.',
      course_type: 'EPFA',
      category: 'paediatric',
      duration: '1 Day',
      duration_hours: 6,
      price: 100.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Specialist Courses
    {
      name: 'Activity First Aid',
      description: 'Specialized first aid training for outdoor and activity providers. Covers sports injuries, remote scenarios, and adventure activities. Ideal for sports coaches and outdoor instructors.',
      course_type: 'ACTIVITY',
      category: 'specialist',
      duration: '1 Day',
      duration_hours: 5,
      price: 175.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'CPR and AED',
      description: 'Life-saving skills course focusing on cardiopulmonary resuscitation and automated external defibrillator use. Hands-on practice with essential knowledge for emergency response.',
      course_type: 'CPR_AED',
      category: 'specialist',
      duration: '3 Hours',
      duration_hours: 3,
      price: 50.00,
      max_capacity: 12,
      certification_validity_years: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Oxygen Therapy',
      description: 'Specialized training in the safe administration of emergency oxygen. Covers equipment use, safety protocols, and when to administer oxygen therapy.',
      course_type: 'OXYGEN',
      category: 'specialist',
      duration: '1 Day',
      duration_hours: 6,
      price: 60.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true, // Active course
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('All 7 courses seeded successfully');
}