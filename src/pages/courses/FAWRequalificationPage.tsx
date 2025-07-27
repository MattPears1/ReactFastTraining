import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const FAWRequalificationPage: React.FC = () => {
  const courseData = {
    courseName: 'First Aid at Work Requalification',
    courseAcronym: 'FAW-R',
    duration: '5 Hours',
    price: '£150',
    certificateValidity: 'Valid for 3 years',
    description: 'This course is for those who need to renew their FAW certificate. It serves as a comprehensive refresher of the course content, ensuring that first aiders are up-to-date with any changes in protocols and maintain their competency.',
    
    learningOutcomes: [
      'Refresh and update all key first aid skills',
      'Review changes in first aid protocols and best practices',
      'Manage unconscious casualties and use recovery position',
      'Perform CPR and use an AED effectively',
      'Control severe bleeding including catastrophic bleeding',
      'Treat shock, burns, and scalds',
      'Handle fractures, dislocations, and spinal injuries',
      'Respond to medical emergencies including heart attacks, strokes, and seizures',
      'Complete accident records and understand reporting requirements'
    ],
    
    whoShouldAttend: [
      'Current First Aid at Work certificate holders',
      'Those whose FAW certificate is due to expire',
      'Designated workplace first aiders requiring requalification',
      'Anyone needing to maintain their FAW certification',
      'Note: Certificate must be valid or expired within the last month'
    ],
    
    courseContent: [
      {
        title: 'Core Emergency Skills Refresher',
        topics: [
          'Review of roles and responsibilities of a first aider',
          'Updated protocols for managing emergency situations',
          'CPR techniques refresher for adults',
          'AED use and maintenance updates',
          'Managing unconscious casualties',
          'Recovery position techniques',
          'Choking management for conscious and unconscious casualties',
          'Controlling severe and catastrophic bleeding',
          'Recognising and treating shock'
        ]
      },
      {
        title: 'Medical Conditions & Advanced Skills',
        topics: [
          'Burns and scalds treatment updates',
          'Managing fractures and dislocations',
          'Head, neck and spinal injury protocols',
          'Heart attacks and angina management',
          'Stroke recognition and response',
          'Seizure and epilepsy management',
          'Asthma and diabetic emergencies',
          'Anaphylaxis and severe allergic reactions',
          'Record keeping and reporting',
          'Practical and written assessments'
        ]
      }
    ],
    
    accreditations: ['HSE Approved', 'Ofqual Regulated', 'CPD Certified'],
    
    whatToExpect: [
      'Comprehensive review of all FAW topics',
      'Updates on latest first aid guidelines',
      'Extensive hands-on practice',
      'Scenario-based training exercises',
      'Written and practical assessments',
      'Small group sizes for personal attention',
      'Updated course materials to keep',
      'Certificate issued on successful completion'
    ],
    
    prerequisites: 'Valid or recently expired (within 1 month) First Aid at Work certificate',
    
    assessmentMethod: 'Continuous practical assessment throughout the course and written assessment',
    
    seoKeywords: 'first aid at work requalification Yorkshire, FAW refresher course Leeds, FAW renewal Sheffield, first aid requalification training'
  }

  return <CourseTemplate {...courseData} />
}

export default FAWRequalificationPage