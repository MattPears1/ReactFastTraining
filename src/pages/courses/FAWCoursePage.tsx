import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const FAWCoursePage: React.FC = () => {
  const courseData = {
    courseName: 'First Aid at Work',
    courseAcronym: 'FAW',
    duration: '3 Days (18 hours)',
    price: 'From £225',
    certificateValidity: 'Valid for 3 years',
    description: 'Comprehensive 3-day first aid training course for workplace appointed first aiders. This HSE approved course provides in-depth knowledge and practical skills to deal with a wide range of workplace emergencies.',
    
    learningOutcomes: [
      'Assess and manage emergency situations confidently',
      'Provide CPR and use an AED (defibrillator)',
      'Deal with wounds, bleeding, and shock',
      'Manage fractures, sprains, and spinal injuries',
      'Treat burns, scalds, and poisoning',
      'Handle medical emergencies including heart attacks, strokes, and epilepsy',
      'Complete accident report forms and understand first aid regulations'
    ],
    
    whoShouldAttend: [
      'Designated workplace first aiders',
      'Health and Safety officers',
      'Team leaders and supervisors',
      'Anyone requiring comprehensive first aid certification',
      'Those working in higher-risk environments',
      'Employees in medium to large organizations'
    ],
    
    courseContent: [
      {
        title: 'Day 1: Foundations',
        topics: [
          'Role and responsibilities of a first aider',
          'Managing incidents and casualties',
          'Basic life support and CPR',
          'AED usage and maintenance',
          'Managing unconscious casualties'
        ]
      },
      {
        title: 'Day 2: Injury Management',
        topics: [
          'Wounds and bleeding control',
          'Shock recognition and treatment',
          'Burns and scalds',
          'Fractures and spinal injuries',
          'Head injuries and concussion'
        ]
      },
      {
        title: 'Day 3: Medical Emergencies',
        topics: [
          'Heart attacks and angina',
          'Strokes and mini-strokes',
          'Epilepsy and seizures',
          'Diabetes emergencies',
          'Asthma and anaphylaxis',
          'Poisoning and substance misuse'
        ]
      }
    ],
    
    accreditations: ['HSE Approved', 'Ofqual Regulated', 'CPD Certified'],
    
    whatToExpect: [
      'Hands-on practical training with realistic scenarios',
      'Small group sizes (maximum 12 participants)',
      'All equipment and materials provided',
      'Comprehensive course manual to keep',
      'Written and practical assessments',
      'Certificate issued on successful completion',
      'Refreshments and lunch provided each day',
      'Free parking at all venues'
    ],
    
    seoKeywords: 'first aid at work course Yorkshire, FAW training Leeds, 3 day first aid course, workplace first aider training, HSE approved first aid'
  }

  return <CourseTemplate {...courseData} />
}

export default FAWCoursePage