import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const CPRAEDPage: React.FC = () => {
  const courseData = {
    courseName: 'CPR and AED',
    courseAcronym: 'CPR/AED',
    duration: 'Half Day (3-4 hours)',
    price: '£60',
    certificateValidity: 'Valid for 1 year',
    description: 'This course provides focused training on performing Cardiopulmonary Resuscitation (CPR) and using an Automated External Defibrillator (AED). It is often aimed at both the general public and healthcare professionals needing annual updates.',
    
    learningOutcomes: [
      'Recognising cardiac arrest',
      'Performing CPR on adults, with variations for children and infants often included',
      'Safe and effective use of an AED',
      'Dealing with an unresponsive casualty'
    ],
    
    whoShouldAttend: [
      'Workplace first aiders needing annual CPR updates',
      'Health and fitness professionals',
      'Care home and healthcare staff',
      'Security personnel',
      'Teachers and school staff',
      'Community volunteers and first responders',
      'Sports coaches and fitness instructors',
      'Anyone wanting essential life-saving skills',
      'Those requiring annual CPR recertification'
    ],
    
    courseContent: [
      {
        title: 'CPR and AED Training Programme',
        topics: [
          'Understanding the chain of survival',
          'Recognising cardiac arrest signs and symptoms',
          'Performing high-quality chest compressions',
          'Delivering effective rescue breaths',
          'Adult CPR techniques - full sequence',
          'Compression-only CPR when appropriate',
          'Introduction to child and infant CPR',
          'Understanding how AEDs work',
          'When and how to use an AED safely',
          'AED pad placement and safety considerations',
          'Combining CPR with AED use',
          'Managing an unresponsive casualty',
          'Recovery position when appropriate',
          'Working as part of a resuscitation team',
          'Post-resuscitation care basics'
        ]
      }
    ],
    
    accreditations: ['Resuscitation Council UK Guidelines', 'HSE Approved', 'First Aid Industry Body (FAIB) Member'],
    
    whatToExpect: [
      'Intensive hands-on practice',
      'Adult, child and infant CPR manikins',
      'Training with real AED trainers',
      'Multiple practice scenarios',
      'Latest resuscitation guidelines',
      'Small group sizes (maximum 12)',
      'Individual coaching and feedback',
      'Certificate valid for 1 year',
      'Annual refresher recommended'
    ],
    
    assessmentMethod: 'Practical demonstration of CPR and AED skills',
    
    prerequisites: 'None - suitable for complete beginners and those needing refresher training',
    
    seoKeywords: 'CPR course Yorkshire, AED training Leeds, defibrillator course Sheffield, CPR certification, resuscitation training'
  }

  return <CourseTemplate {...courseData} />
}

export default CPRAEDPage