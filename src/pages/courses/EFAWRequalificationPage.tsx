import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const EFAWRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Emergency First Aid at Work Requalification"
      courseAcronym="EFAW-R"
      duration="1 Day"
      price="£70"
      certificateValidity="3 years"
      description="Refresh your Emergency First Aid at Work certification with this 1-day requalification course. Essential for maintaining your workplace first aid skills and HSE compliance."
      learningOutcomes={[
        'Refresh emergency first aid procedures',
        'Update CPR and resuscitation techniques',
        'Review choking management',
        'Practice wound treatment and bandaging',
        'Update shock management skills',
        'Refresh recovery position technique',
        'Review workplace emergency procedures'
      ]}
      whoShouldAttend={[
        'Current EFAW certificate holders',
        'Those whose EFAW certificate is expiring soon',
        'Workplace emergency first aiders',
        'Anyone needing to renew their emergency first aid qualification'
      ]}
      courseContent={[
        {
          title: 'Morning Session: Core Skills Review',
          topics: [
            'Role of the emergency first aider',
            'Managing incidents and casualties',
            'CPR and resuscitation update',
            'Choking procedures',
            'Recovery position practice'
          ]
        },
        {
          title: 'Afternoon Session: Practical Application',
          topics: [
            'Bleeding control refresher',
            'Shock management',
            'Minor injury treatment',
            'Practical scenarios',
            'Assessment'
          ]
        }
      ]}
      accreditations={['HSE Approved', 'Ofqual Regulated', 'First Aid Industry Body (FAIB) Member']}
      assessmentMethod="Continuous practical assessment throughout the day"
      prerequisites="Valid or recently expired (within 1 month) Emergency First Aid at Work certificate"
      seoKeywords="EFAW requalification, emergency first aid renewal, EFAW refresher Yorkshire, 1 day first aid requalification Sheffield"
    />
  )
}

export default EFAWRequalificationPage