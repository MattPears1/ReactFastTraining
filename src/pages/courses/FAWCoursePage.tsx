import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const FAWCoursePage: React.FC = () => {
  const courseData = {
    courseName: 'First Aid at Work',
    courseAcronym: 'FAW',
    duration: '1 Day',
    price: '£200',
    certificateValidity: 'Valid for 3 years',
    description: 'This is the most comprehensive workplace first aid course, designed for individuals in higher-risk environments such as factories, construction sites, and manufacturing facilities. It equips first aiders to handle a wide array of injuries and medical emergencies.',
    
    learningOutcomes: [
      'Understand the roles and responsibilities of a first aider',
      'Assess an incident and manage the scene safely',
      'Provide Cardiopulmonary Resuscitation (CPR) and use an Automated External Defibrillator (AED) for adults',
      'Manage an unresponsive casualty effectively',
      'Treat choking, bleeding (including catastrophic bleeding), shock, and burns',
      'Manage fractures, dislocations, and head, neck, and spinal injuries',
      'Respond to medical emergencies such as heart attacks, strokes, seizures, asthma, and diabetic emergencies',
      'Handle eye injuries and poisoning',
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
        title: 'Emergency Response & Life Support',
        topics: [
          'Roles and responsibilities of a first aider',
          'Assessing an incident and managing the scene safely',
          'Cardiopulmonary Resuscitation (CPR) for adults',
          'Automated External Defibrillator (AED) use and maintenance',
          'Managing an unresponsive casualty',
          'Recovery position techniques'
        ]
      },
      {
        title: 'Trauma & Injury Management',
        topics: [
          'Treating choking in conscious and unconscious casualties',
          'Managing bleeding including catastrophic bleeding',
          'Recognising and treating shock',
          'Burns and scalds treatment',
          'Managing fractures and dislocations',
          'Head, neck and spinal injury protocols'
        ]
      },
      {
        title: 'Medical Conditions & Assessment',
        topics: [
          'Heart attacks, angina and cardiac emergencies',
          'Strokes - recognition using FAST protocol',
          'Seizures, epilepsy and convulsions',
          'Asthma attacks and breathing difficulties',
          'Diabetic emergencies - hypo and hyperglycemia',
          'Eye injuries, poisoning and anaphylaxis',
          'Practical assessment and certification'
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
      'Refreshments and lunch provided',
      'Free parking at all venues'
    ],
    
    seoKeywords: 'first aid at work course Yorkshire, FAW training South Yorkshire, full day first aid course, workplace first aider training, HSE approved first aid'
  }

  return <CourseTemplate {...courseData} />
}

export default FAWCoursePage