import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const PaediatricCoursePage: React.FC = () => {
  const courseData = {
    courseName: 'Paediatric First Aid',
    courseAcronym: 'PFA',
    duration: '2 Days (12 hours)',
    price: '£120',
    certificateValidity: 'Valid for 3 years',
    description: 'Essential first aid training for anyone working with babies and children. This Ofsted compliant course covers emergency procedures and common childhood illnesses, meeting EYFS requirements.',
    
    learningOutcomes: [
      'Assess and prioritize emergency situations involving children',
      'Perform CPR on infants and children',
      'Manage choking in babies and young children',
      'Deal with childhood illnesses and injuries',
      'Recognize and respond to meningitis symptoms',
      'Handle allergic reactions and anaphylaxis in children',
      'Understand safeguarding and reporting procedures'
    ],
    
    whoShouldAttend: [
      'Childcare professionals and nursery staff',
      'Teachers and teaching assistants',
      'Childminders and nannies',
      'Parents and grandparents',
      'Youth workers and sports coaches',
      'Anyone responsible for children\'s welfare'
    ],
    
    courseContent: [
      {
        title: 'Emergency Procedures',
        topics: [
          'Roles and responsibilities',
          'Infant and child CPR',
          'Choking procedures',
          'Recovery position for children',
          'Managing unconscious children',
          'Calling emergency services'
        ]
      },
      {
        title: 'Common Injuries',
        topics: [
          'Cuts, grazes and bruises',
          'Burns and scalds',
          'Fractures and head injuries',
          'Foreign objects',
          'Bites and stings',
          'Nosebleeds'
        ]
      },
      {
        title: 'Medical Conditions',
        topics: [
          'Febrile convulsions',
          'Meningitis recognition',
          'Asthma in children',
          'Diabetes in children',
          'Severe allergic reactions',
          'Common childhood illnesses'
        ]
      }
    ],
    
    accreditations: ['Ofsted Compliant', 'EYFS Requirements', 'RQF Level 3', 'CPD Certified'],
    
    whatToExpect: [
      'Child-friendly training environment',
      'Pediatric manikins for realistic practice',
      'Focus on age-appropriate techniques',
      'Scenarios based on real childcare settings',
      'Comprehensive course handbook',
      'Continuous assessment approach',
      'Certificate valid for Ofsted registration',
      'Support with EYFS compliance'
    ],
    
    prerequisites: 'None - suitable for all levels of experience',
    
    seoKeywords: 'paediatric first aid course Yorkshire, childcare first aid training, EYFS first aid, Ofsted compliant training, baby first aid course'
  }

  return <CourseTemplate {...courseData} />
}

export default PaediatricCoursePage