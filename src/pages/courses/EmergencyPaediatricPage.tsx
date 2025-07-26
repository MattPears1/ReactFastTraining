import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const EmergencyPaediatricPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Emergency Paediatric First Aid"
      courseAcronym="EPFA"
      duration="1 Day"
      price="£100"
      certificateValidity="3 years"
      description="Essential emergency first aid training for those working with infants and children. This 1-day course covers life-saving techniques specifically for babies and young children."
      learningOutcomes={[
        'Perform infant and child CPR',
        'Manage choking in babies and children',
        'Use a paediatric defibrillator',
        'Control bleeding in young casualties',
        'Recognize and manage shock in children',
        'Treat burns and scalds',
        'Handle common childhood emergencies',
        'Understand safeguarding responsibilities'
      ]}
      whoShouldAttend={[
        'Childcare professionals',
        'Nursery staff and childminders',
        'Teachers and teaching assistants',
        'Parents and carers',
        'Youth workers and sports coaches',
        'Anyone working with children'
      ]}
      courseContent={[
        {
          title: 'Morning: Life-Saving Skills',
          topics: [
            'Roles and responsibilities',
            'Infant and child CPR',
            'Choking procedures for different ages',
            'Recovery position for children',
            'Emergency action planning'
          ]
        },
        {
          title: 'Afternoon: Common Emergencies',
          topics: [
            'Bleeding and wound care',
            'Burns and scalds',
            'Managing shock',
            'Common childhood conditions',
            'Record keeping and reporting'
          ]
        }
      ]}
      accreditations={['Ofqual Regulated', 'EYFS Compliant', 'Ofsted Approved']}
      assessmentMethod="Continuous observation and practical demonstration"
      prerequisites="None - suitable for beginners"
      seoKeywords="emergency paediatric first aid, children first aid course, EPFA training Yorkshire, 1 day paediatric first aid Sheffield"
    />
  )
}

export default EmergencyPaediatricPage