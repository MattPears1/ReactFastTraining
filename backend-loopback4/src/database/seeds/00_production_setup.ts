import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

/**
 * Production Setup Seed
 * 
 * This seed file contains the initial production data for React Fast Training.
 * It should be run once during initial setup.
 */

export async function seed(knex: Knex): Promise<void> {
  // Only run in production or when explicitly requested
  if (process.env.NODE_ENV !== 'production' && process.env.FORCE_PRODUCTION_SEED !== 'true') {
    console.log('⚠️  Skipping production seed (not in production environment)');
    return;
  }

  console.log('🌱 Running production setup seed...');

  // 1. Create admin user
  const adminExists = await knex('users').where('email', 'lex@reactfasttraining.co.uk').first();
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMeImmediately!', 10);
    
    await knex('users').insert({
      id: knex.raw('gen_random_uuid()'),
      email: 'lex@reactfasttraining.co.uk',
      password: hashedPassword,
      name: 'Lex',
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Admin user created');
  }

  // 2. Insert courses
  const courses = [
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Emergency First Aid at Work',
      slug: 'emergency-first-aid-at-work',
      description: 'This QA Level 2 Award in Emergency First Aid at Work (RQF) qualification is ideal for those who want to become an emergency first aider in the workplace.',
      price: 75.00,
      duration: '6 hours',
      maxStudents: 12,
      certificateValidity: '3 years',
      features: JSON.stringify([
        'HSE approved training',
        'Ofqual regulated qualification',
        'Certificate valid for 3 years',
        'Experienced instructors',
        'Practical hands-on training',
        'Compliant with Health & Safety regulations'
      ]),
      learningOutcomes: JSON.stringify([
        'Understand the role of the first aider',
        'Assess an incident safely',
        'Manage an unresponsive casualty',
        'Perform CPR',
        'Deal with choking',
        'Manage shock',
        'Control external bleeding',
        'Treat burns and scalds'
      ]),
      category: 'workplace',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'First Aid at Work',
      slug: 'first-aid-at-work',
      description: 'This comprehensive 3-day course provides thorough training in workplace first aid.',
      price: 225.00,
      duration: '3 days (18 hours)',
      maxStudents: 12,
      certificateValidity: '3 years',
      features: JSON.stringify([
        'HSE approved comprehensive training',
        'Ofqual regulated qualification',
        'Certificate valid for 3 years',
        'Covers all workplace scenarios',
        'Includes emergency first aid',
        'Detailed practical assessments'
      ]),
      learningOutcomes: JSON.stringify([
        'All content from Emergency First Aid',
        'Manage fractures and spinal injuries',
        'Treat eye injuries',
        'Manage chest injuries',
        'Deal with severe allergic reactions',
        'Recognize major illnesses',
        'Manage head injuries',
        'Complete accident reports'
      ]),
      category: 'workplace',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Paediatric First Aid',
      slug: 'paediatric-first-aid',
      description: 'Essential first aid training for those working with infants and children.',
      price: 95.00,
      duration: '6 hours',
      maxStudents: 12,
      certificateValidity: '3 years',
      features: JSON.stringify([
        'Ofsted compliant',
        'EYFS requirements covered',
        'Suitable for childcare settings',
        'Practical baby and child CPR',
        'Common childhood emergencies',
        'Interactive training methods'
      ]),
      learningOutcomes: JSON.stringify([
        'Assess emergency situations with children',
        'Perform CPR on infants and children',
        'Deal with choking in babies and children',
        'Manage bleeding and shock',
        'Treat burns and scalds',
        'Manage febrile convulsions',
        'Deal with allergic reactions',
        'Recognize meningitis symptoms'
      ]),
      category: 'childcare',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Insert courses if they don't exist
  for (const course of courses) {
    const exists = await knex('courses').where('slug', course.slug).first();
    if (!exists) {
      await knex('courses').insert(course);
      console.log(`✅ Course created: ${course.title}`);
    }
  }

  // 3. Insert venues
  const venues = [
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'React Fast Training Centre - Leeds',
      address: 'Wellington Street',
      city: 'Leeds',
      postcode: 'LS1 1BA',
      capacity: 12,
      facilities: JSON.stringify([
        'Free parking',
        'Wheelchair accessible',
        'Tea and coffee facilities',
        'City centre location',
        'Near public transport'
      ]),
      directions: 'Located in Leeds city centre, 5 minutes walk from Leeds train station.',
      parkingInfo: 'Free on-site parking available for all attendees.',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'React Fast Training Centre - Sheffield',
      address: 'Division Street',
      city: 'Sheffield',
      postcode: 'S1 4GF',
      capacity: 12,
      facilities: JSON.stringify([
        'City centre location',
        'Nearby parking',
        'Wheelchair accessible',
        'Modern training facilities',
        'Refreshments provided'
      ]),
      directions: 'Central Sheffield location, close to the Cathedral tram stop.',
      parkingInfo: 'Multiple pay and display car parks within 5 minutes walk.',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Insert venues if they don't exist
  for (const venue of venues) {
    const exists = await knex('venues').where('name', venue.name).first();
    if (!exists) {
      await knex('venues').insert(venue);
      console.log(`✅ Venue created: ${venue.name}`);
    }
  }

  // 4. Insert trainers
  const trainers = [
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Lex Thompson',
      email: 'lex@reactfasttraining.co.uk',
      bio: 'Lead trainer and founder of React Fast Training with over 10 years of experience in emergency medical training.',
      qualifications: JSON.stringify([
        'Level 3 Award in Education and Training',
        'First Aid at Work Instructor',
        'Former NHS Paramedic',
        'Advanced Life Support Instructor'
      ]),
      specialties: JSON.stringify(['Emergency First Aid', 'Paediatric First Aid', 'Mental Health First Aid']),
      imageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Insert trainers if they don't exist
  for (const trainer of trainers) {
    const exists = await knex('trainers').where('email', trainer.email).first();
    if (!exists) {
      await knex('trainers').insert(trainer);
      console.log(`✅ Trainer created: ${trainer.name}`);
    }
  }

  // 5. Insert initial settings
  const settings = [
    {
      id: knex.raw('gen_random_uuid()'),
      key: 'booking_terms',
      value: JSON.stringify({
        cancellationPeriod: 7,
        cancellationPolicy: 'Full refund if cancelled at least 7 days before the course start date.',
        termsAndConditions: 'By booking a course you agree to our terms and conditions...'
      }),
      category: 'booking',
      description: 'Booking terms and policies',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      key: 'email_settings',
      value: JSON.stringify({
        sendBookingConfirmation: true,
        sendReminderEmail: true,
        reminderDaysBefore: 2,
        sendCertificateEmail: true
      }),
      category: 'email',
      description: 'Email notification settings',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      key: 'company_info',
      value: JSON.stringify({
        name: 'React Fast Training',
        registrationNumber: 'TBC',
        vatNumber: 'TBC',
        address: 'Wellington Street, Leeds, LS1 1BA',
        phone: 'TBC',
        email: 'info@reactfasttraining.co.uk'
      }),
      category: 'company',
      description: 'Company information',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Insert settings if they don't exist
  for (const setting of settings) {
    const exists = await knex('settings').where('key', setting.key).first();
    if (!exists) {
      await knex('settings').insert(setting);
      console.log(`✅ Setting created: ${setting.key}`);
    }
  }

  console.log('✅ Production setup seed completed');
}