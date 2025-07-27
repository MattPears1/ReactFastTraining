import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('courses').del();
  
  // Insert all courses from the website
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
      duration: '1 Day',
      duration_hours: 6,
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
      duration: '1 Day',
      duration_hours: 6,
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
    
    // Requalification Courses
    {
      name: 'FAW Requalification',
      description: 'Refresh your First Aid at Work certification before it expires. Updates your skills with the latest protocols and renews your HSE approved certificate for another 3 years.',
      course_type: 'FAW_REQUAL',
      category: 'requalification',
      duration: '1 Day',
      duration_hours: 5,
      price: 150.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'EFAW Requalification',
      description: 'Quick refresh course for Emergency First Aid at Work certificate holders. Same day certificate renewal, HSE compliant with practical assessment.',
      course_type: 'EFAW_REQUAL',
      category: 'requalification',
      duration: '3 Hours',
      duration_hours: 3,
      price: 75.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Paediatric Requalification',
      description: 'Refresh your Paediatric First Aid certification. Updates skills for childcare emergencies and renews your Ofsted/EYFS compliant certificate.',
      course_type: 'PFA_REQUAL',
      category: 'requalification',
      duration: '3 Hours',
      duration_hours: 3,
      price: 100.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Emergency Paediatric Requalification',
      description: 'Quick refresh for Emergency Paediatric First Aid certificate holders. Focused practical assessment with same day renewal.',
      course_type: 'EPFA_REQUAL',
      category: 'requalification',
      duration: '3 Hours',
      duration_hours: 3,
      price: 75.00,
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
      name: 'Activity First Aid Requalification',
      description: 'Refresh your Activity First Aid certification with updated outdoor and sports injury protocols. Quick practical assessment for certificate renewal.',
      course_type: 'ACTIVITY_REQUAL',
      category: 'specialist',
      duration: '3 Hours',
      duration_hours: 3,
      price: 100.00,
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
      name: 'Annual Skills Refresher',
      description: 'Annual update course to maintain first aid skills between requalifications. Covers latest guidelines, practice scenarios, and skill maintenance.',
      course_type: 'REFRESHER',
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
      duration: '3 Hours',
      duration_hours: 3,
      price: 75.00,
      max_capacity: 12,
      certification_validity_years: 3,
      is_active: false, // Currently inactive as per the admin courses page
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('All 13 courses seeded successfully');
}