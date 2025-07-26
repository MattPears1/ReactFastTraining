import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const FAWRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="First Aid at Work Requalification"
      courseAcronym="FAW-R"
      duration="2 Days"
      price="£150"
      certificateValidity="3 years"
      description="Refresh and update your First Aid at Work qualification before it expires. This 2-day requalification course is for those whose FAW certificate is still valid or has expired within the last month."
      learningOutcomes={[
        'Refresh your emergency first aid skills',
        'Update knowledge on current first aid protocols',
        'Manage unconscious casualties',
        'Perform CPR and use an AED',
        'Control bleeding and treat shock',
        'Treat burns, scalds and other workplace injuries',
        'Handle medical emergencies',
        'Complete accident records'
      ]}
      whoShouldAttend={[
        'Current First Aid at Work certificate holders',
        'Those whose FAW certificate expires within 1 month',
        'Designated workplace first aiders needing requalification',
        'Anyone responsible for emergency first aid in their workplace'
      ]}
      courseContent={[
        {
          title: 'Day 1: Emergency Response Review',
          topics: [
            'Roles and responsibilities update',
            'Managing emergency situations',
            'Unconscious casualty management',
            'CPR and AED refresher',
            'Choking procedures',
            'Bleeding control techniques'
          ]
        },
        {
          title: 'Day 2: Medical Conditions & Assessment',
          topics: [
            'Shock management',
            'Burns and scalds treatment',
            'Medical conditions review',
            'Fractures and spinal injuries',
            'Record keeping',
            'Practical assessment'
          ]
        }
      ]}
      accreditations={['HSE Approved', 'Ofqual Regulated', 'First Aid Industry Body (FAIB) Member']}
      assessmentMethod="Continuous practical assessment and multiple choice questions"
      prerequisites="Valid or recently expired (within 1 month) First Aid at Work certificate"
      seoKeywords="first aid at work requalification, FAW refresher course Yorkshire, first aid renewal Sheffield, FAW requalification training"
    />
  )
}

export default FAWRequalificationPage