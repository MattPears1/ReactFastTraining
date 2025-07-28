import {ReactFastTrainingApiApplication} from './application';
import {
  CourseRepository,
  TrainerRepository,
  LocationRepository,
} from './repositories';
import {CourseType, CertificationBody, TrainerStatus, LocationType, YorkshireArea} from './models';

async function seed() {
  const app = new ReactFastTrainingApiApplication();
  await app.boot();

  const courseRepo = await app.getRepository(CourseRepository);
  const trainerRepo = await app.getRepository(TrainerRepository);
  const locationRepo = await app.getRepository(LocationRepository);

  // Create courses
  const courses = [
    {
      type: CourseType.EFAW,
      name: 'Emergency First Aid at Work',
      description: 'This one-day course covers the essential skills needed to act as an emergency first aider in the workplace. Ideal for low-risk environments and smaller companies.',
      durationDays: 1,
      pricePerPerson: 85,
      maxParticipants: 12,
      minParticipants: 4,
      minimumAge: 16,
      requiresEnglishLevel2: true,
      certificationBody: CertificationBody.OFQUAL,
      certificateValidityYears: 3,
      learningOutcomes: [
        'Understand the role of the first aider',
        'Assess an incident and provide treatment',
        'Perform CPR and use an AED',
        'Deal with choking',
        'Manage bleeding and shock',
        'Treat burns, epilepsy, and other conditions',
      ],
      prerequisites: ['None - suitable for beginners'],
      groupDiscounts: {
        '8': 0.05,
        '10': 0.10,
        '15': 0.15,
      },
      availableOnsite: true,
      active: true,
    },
    {
      type: CourseType.FAW,
      name: 'First Aid at Work',
      description: 'This comprehensive 3-day course provides extensive training for workplace first aiders. Suitable for higher-risk environments and larger organizations.',
      durationDays: 3,
      pricePerPerson: 250,
      maxParticipants: 12,
      minParticipants: 4,
      minimumAge: 16,
      requiresEnglishLevel2: true,
      certificationBody: CertificationBody.OFQUAL,
      certificateValidityYears: 3,
      learningOutcomes: [
        'All EFAW content plus:',
        'Conduct a secondary survey',
        'Use first aid equipment',
        'Recognize and treat various injuries',
        'Manage spinal injuries',
        'Treat eye injuries and poisoning',
        'Provide treatment for major illnesses',
      ],
      prerequisites: ['None - suitable for beginners'],
      groupDiscounts: {
        '6': 0.05,
        '8': 0.10,
        '12': 0.15,
      },
      availableOnsite: true,
      active: true,
    },
    {
      type: CourseType.FAW_REQUALIFICATION,
      name: 'First Aid at Work Requalification',
      description: 'This 2-day requalification course is for those whose First Aid at Work certificate is due to expire. Must be completed before current certificate expires.',
      durationDays: 2,
      pricePerPerson: 175,
      maxParticipants: 12,
      minParticipants: 4,
      minimumAge: 16,
      requiresEnglishLevel2: true,
      certificationBody: CertificationBody.OFQUAL,
      certificateValidityYears: 3,
      learningOutcomes: [
        'Refresh all FAW skills',
        'Update on current first aid procedures',
        'Practice emergency scenarios',
        'Demonstrate competency in all areas',
      ],
      prerequisites: ['Valid or recently expired (within 28 days) FAW certificate'],
      groupDiscounts: {
        '6': 0.05,
        '8': 0.10,
        '12': 0.15,
      },
      availableOnsite: true,
      active: true,
    },
    {
      type: CourseType.PAEDIATRIC,
      name: 'Paediatric First Aid',
      description: 'Essential 2-day training for those working with children. Covers specific first aid techniques for infants and children.',
      durationDays: 2,
      pricePerPerson: 195,
      maxParticipants: 12,
      minParticipants: 4,
      minimumAge: 16,
      requiresEnglishLevel2: true,
      certificationBody: CertificationBody.OFQUAL,
      certificateValidityYears: 3,
      learningOutcomes: [
        'Assess emergency situations with children',
        'Perform CPR on infants and children',
        'Treat choking in different age groups',
        'Manage childhood illnesses and injuries',
        'Recognize signs of meningitis',
        'Deal with asthma and allergic reactions',
      ],
      prerequisites: ['None - suitable for beginners'],
      groupDiscounts: {
        '6': 0.05,
        '8': 0.10,
        '12': 0.15,
      },
      availableOnsite: true,
      active: true,
    },
  ];

  for (const course of courses) {
    await courseRepo.create(course);
  }
  console.log('✅ Courses created');

  // Create trainers
  const trainers = [
    {
      firstName: 'Lex',
      lastName: 'Thompson',
      email: 'lex@reactfasttraining.co.uk',
      phone: '07700 900123',
      qualifications: [
        'Level 3 Award in First Aid at Work',
        'Level 3 Award in Education and Training',
        'Former NHS Paramedic (10 years)',
      ],
      specializations: ['Emergency Medicine', 'Trauma Care', 'Paediatric First Aid'],
      bio: 'With over 15 years of experience in emergency medicine and first aid training, Lex founded React Fast Training to provide high-quality, practical first aid education throughout Yorkshire.',
      status: TrainerStatus.ACTIVE,
      coverageAreas: Object.values(YorkshireArea),
      canTrainOnsite: true,
      isOwner: true,
    },
    {
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah@reactfasttraining.co.uk',
      phone: '07700 900456',
      qualifications: [
        'Level 3 Award in First Aid at Work',
        'Level 3 Award in Education and Training',
        'Registered Nurse (RGN)',
      ],
      specializations: ['Paediatric First Aid', 'Mental Health First Aid'],
      bio: 'Sarah brings 12 years of nursing experience to her training, specializing in paediatric care and mental health support.',
      status: TrainerStatus.ACTIVE,
      coverageAreas: [
        YorkshireArea.LEEDS,
        YorkshireArea.BRADFORD,
        YorkshireArea.HARROGATE,
        YorkshireArea.YORK,
      ],
      canTrainOnsite: true,
      isOwner: false,
    },
  ];

  for (const trainer of trainers) {
    await trainerRepo.create(trainer);
  }
  console.log('✅ Trainers created');

  // Create locations
  const locations = [
    {
      name: 'React Fast Training Centre - Leeds',
      type: LocationType.TRAINING_CENTER,
      addressLine1: '45 Park Square',
      city: 'Leeds',
      area: YorkshireArea.LEEDS,
      postcode: 'LS1 2NP',
      parkingInfo: 'Free parking available on-site for up to 15 vehicles',
      publicTransportInfo: 'Leeds train station 10 min walk. Bus stops on nearby Wellington Street.',
      facilities: [
        'Wheelchair accessible',
        'Free parking',
        'Refreshments provided',
        'Training equipment',
        'Air conditioning',
        'Break room',
      ],
      maxCapacity: 16,
      active: true,
    },
    {
      name: 'Bradford Business Park Training Room',
      type: LocationType.PUBLIC_VENUE,
      addressLine1: 'Enterprise Way',
      addressLine2: 'Bradford Business Park',
      city: 'Bradford',
      area: YorkshireArea.BRADFORD,
      postcode: 'BD3 7DB',
      parkingInfo: 'Ample free parking available',
      publicTransportInfo: 'Bus route 615 stops at business park entrance',
      facilities: [
        'Wheelchair accessible',
        'Free parking',
        'Catering available',
        'Modern facilities',
      ],
      maxCapacity: 20,
      active: true,
    },
    {
      name: 'York Conference Centre',
      type: LocationType.PUBLIC_VENUE,
      addressLine1: '1 Tower Street',
      city: 'York',
      area: YorkshireArea.YORK,
      postcode: 'YO1 9WD',
      parkingInfo: 'Public parking nearby (charges apply)',
      publicTransportInfo: 'York train station 15 min walk. Park & Ride available.',
      facilities: [
        'Wheelchair accessible',
        'City centre location',
        'Refreshments available',
        'Professional environment',
      ],
      maxCapacity: 14,
      active: true,
    },
  ];

  for (const location of locations) {
    await locationRepo.create(location);
  }
  console.log('✅ Locations created');

  console.log('✅ Seed data created successfully');
  process.exit(0);
}

seed().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});