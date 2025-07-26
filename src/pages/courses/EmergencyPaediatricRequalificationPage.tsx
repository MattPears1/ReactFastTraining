import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const EmergencyPaediatricRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Emergency Paediatric First Aid Requalification"
      courseAcronym="EPFA-R"
      duration="1 Day"
      price="£70"
      certificateValidity="3 years"
      description="Refresh your Emergency Paediatric First Aid certification with this comprehensive 1-day requalification course. Maintain your skills in providing emergency care to infants and children."
      learningOutcomes={[
        'Refresh infant and child CPR techniques',
        'Update choking management procedures',
        'Review paediatric emergency protocols',
        'Practice updated first aid techniques',
        'Refresh knowledge of childhood conditions',
        'Update safeguarding awareness',
        'Review record keeping requirements'
      ]}
      whoShouldAttend={[
        'Current Emergency Paediatric First Aid certificate holders',
        'Childcare professionals needing requalification',
        'Those whose EPFA certificate is expiring',
        'Anyone working with children requiring certification renewal'
      ]}
      courseContent={[
        {
          title: 'Skills Refresher',
          topics: [
            'Updated paediatric first aid protocols',
            'CPR and resuscitation review',
            'Choking procedures update',
            'Emergency response planning',
            'Practical skills practice'
          ]
        },
        {
          title: 'Assessment & Scenarios',
          topics: [
            'Common emergency scenarios',
            'Updated treatment methods',
            'Safeguarding considerations',
            'Documentation requirements',
            'Practical assessment'
          ]
        }
      ]}
      accreditations={['Ofqual Regulated', 'EYFS Compliant', 'Ofsted Approved']}
      assessmentMethod="Continuous practical assessment"
      prerequisites="Valid or recently expired Emergency Paediatric First Aid certificate"
      seoKeywords="paediatric first aid requalification, EPFA renewal, children first aid refresher Yorkshire, paediatric requalification Sheffield"
    />
  )
}

export default EmergencyPaediatricRequalificationPage