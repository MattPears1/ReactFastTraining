import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const CPRAEDPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="CPR and AED"
      courseAcronym="CPR/AED"
      duration="Half Day (4 hours)"
      price="£60"
      certificateValidity="1 year"
      description="Essential life-saving skills course focusing on Cardiopulmonary Resuscitation (CPR) and Automated External Defibrillator (AED) use. Perfect for workplace compliance and personal knowledge."
      learningOutcomes={[
        'Perform effective CPR on adults',
        'Use an AED safely and correctly',
        'Recognize cardiac arrest',
        'Understand the chain of survival',
        'Clear airways and check breathing',
        'Perform rescue breaths',
        'Work as part of a resuscitation team',
        'Handle emergency situations confidently'
      ]}
      whoShouldAttend={[
        'Workplace first aiders',
        'Health and fitness professionals',
        'Care home staff',
        'Security personnel',
        'Teachers and school staff',
        'Community volunteers',
        'Anyone wanting life-saving skills'
      ]}
      courseContent={[
        {
          title: 'CPR Fundamentals',
          topics: [
            'Recognizing cardiac arrest',
            'Adult CPR technique',
            'Compression-only CPR',
            'Full CPR with rescue breaths',
            'Two-person CPR',
            'Recovery position'
          ]
        },
        {
          title: 'AED Training',
          topics: [
            'How AEDs work',
            'When to use an AED',
            'Safe AED operation',
            'AED maintenance',
            'Combining CPR with AED use',
            'Practice scenarios'
          ]
        }
      ]}
      accreditations={['Resuscitation Council UK Guidelines', 'HSE Approved', 'First Aid Industry Body (FAIB) Member']}
      assessmentMethod="Practical demonstration of CPR and AED use"
      prerequisites="None - suitable for beginners"
      whatToExpect={[
        'Hands-on practice with CPR mannequins',
        'Training with real AED units',
        'Small group sizes for personal attention',
        'Certificate issued on completion'
      ]}
      seoKeywords="CPR course Yorkshire, AED training Sheffield, defibrillator course, CPR and AED certification, resuscitation training"
    />
  )
}

export default CPRAEDPage