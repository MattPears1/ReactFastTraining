import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const AnnualSkillsRefresherPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Annual Skills Refresher"
      courseAcronym="ASR"
      duration="Half Day (3 hours)"
      price="£60"
      certificateValidity="1 year"
      description="Keep your first aid skills sharp with this annual refresher course. Ideal for maintaining competence between formal requalifications and meeting workplace requirements."
      learningOutcomes={[
        'Refresh core first aid skills',
        'Update knowledge on current guidelines',
        'Practice CPR and recovery position',
        'Review emergency procedures',
        'Refresh wound care techniques',
        'Update choking procedures',
        'Maintain first aid confidence'
      ]}
      whoShouldAttend={[
        'Current first aid certificate holders',
        'Workplace first aiders',
        'Those wanting annual skills practice',
        'Anyone required to maintain first aid competence',
        'Organizations with annual training requirements'
      ]}
      courseContent={[
        {
          title: 'Skills Practice Session',
          topics: [
            'CPR technique review',
            'Recovery position practice',
            'Choking procedure update',
            'Bleeding control refresh',
            'Emergency scenario practice',
            'Q&A on first aid challenges'
          ]
        }
      ]}
      accreditations={['HSE Recommended', 'First Aid Industry Body (FAIB) Endorsed']}
      assessmentMethod="Practical participation and skills demonstration"
      prerequisites="Current valid first aid certificate recommended"
      whatToExpect={[
        'Hands-on practice session',
        'Small group training',
        'Focus on practical skills',
        'Certificate of attendance',
        'Updates on latest guidelines'
      ]}
      seoKeywords="first aid refresher course, annual skills update Yorkshire, first aid practice Sheffield, HSE annual refresher"
    />
  )
}

export default AnnualSkillsRefresherPage