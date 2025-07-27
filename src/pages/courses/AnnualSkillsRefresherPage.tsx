import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const AnnualSkillsRefresherPage: React.FC = () => {
  const courseData = {
    courseName: 'Annual Skills Refresher',
    courseAcronym: 'ASR',
    duration: '3 Hours',
    price: '£60',
    certificateValidity: 'Certificate of Attendance',
    description: 'The HSE strongly recommends that qualified first aiders complete an annual refresher course to maintain their skills and confidence. This is not a formal requalification but a skills update designed to keep first aiders competent between their formal requalification courses.',
    
    learningOutcomes: [
      'A recap of key life-saving skills such as CPR and AED use',
      'Managing an unresponsive casualty, choking, severe bleeding, and shock'
    ],
    
    whoShouldAttend: [
      'Current first aid certificate holders (FAW, EFAW, or Paediatric)',
      'Workplace first aiders between requalifications',
      'Those wanting to maintain confidence and competence',
      'Anyone required by their employer to complete annual updates',
      'Organizations following HSE best practice guidelines',
      'First aiders who haven\'t used their skills recently'
    ],
    
    courseContent: [
      {
        title: 'Annual Skills Update Programme',
        topics: [
          'Review of first aider roles and responsibilities',
          'CPR technique review and practice with latest guidelines',
          'AED refresher - operation and safety',
          'Recovery position variations and practice',
          'Choking management update for adults and children',
          'Severe bleeding control techniques',
          'Shock recognition and treatment review',
          'Managing an unresponsive casualty',
          'Updates on any protocol changes',
          'Scenario-based practice sessions',
          'Q&A session on workplace incidents',
          'Confidence building exercises'
        ]
      }
    ],
    
    accreditations: ['HSE Recommended', 'First Aid Industry Body (FAIB) Endorsed', 'CPD Points Available'],
    
    whatToExpect: [
      'Intensive hands-on practice session',
      'Focus on skills most likely to be needed',
      'Small group sizes for personal attention',
      'Opportunity to ask questions about real incidents',
      'Practice with latest equipment',
      'Updates on any guideline changes',
      'Confidence assessment and feedback',
      'Certificate of attendance for records',
      'Counts towards CPD requirements'
    ],
    
    assessmentMethod: 'Practical participation and skills demonstration - no formal assessment',
    
    prerequisites: 'Current valid first aid certificate (FAW, EFAW, or equivalent) recommended',
    
    seoKeywords: 'first aid refresher Yorkshire, annual skills update Leeds, HSE recommended refresher Sheffield, first aid skills practice'
  }

  return <CourseTemplate {...courseData} />
}

export default AnnualSkillsRefresherPage