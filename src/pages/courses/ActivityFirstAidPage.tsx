import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const ActivityFirstAidPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Activity First Aid"
      courseAcronym="AFA"
      duration="2 Days"
      price="£120"
      certificateValidity="3 years"
      description="Specialized first aid training for activity leaders, sports coaches, and outdoor instructors. Learn to manage injuries and emergencies in active and outdoor environments."
      learningOutcomes={[
        'Manage first aid in activity environments',
        'Treat sports and activity-related injuries',
        'Handle outdoor emergency situations',
        'Perform CPR in challenging conditions',
        'Manage fractures and dislocations',
        'Treat environmental injuries (heat/cold)',
        'Improvise first aid equipment',
        'Coordinate emergency evacuations'
      ]}
      whoShouldAttend={[
        'Sports coaches and instructors',
        'Outdoor activity leaders',
        'PE teachers and sports staff',
        'Adventure activity providers',
        'Scout and guide leaders',
        'Youth group leaders',
        'Expedition leaders'
      ]}
      courseContent={[
        {
          title: 'Day 1: Core Activity First Aid',
          topics: [
            'Activity-specific risk assessment',
            'Emergency action planning',
            'CPR in outdoor settings',
            'Major trauma management',
            'Spinal injury management',
            'Head injury protocols'
          ]
        },
        {
          title: 'Day 2: Specialized Skills',
          topics: [
            'Sports injury treatment',
            'Fracture and dislocation management',
            'Environmental emergencies',
            'Improvised first aid techniques',
            'Evacuation procedures',
            'Practical outdoor scenarios'
          ]
        }
      ]}
      accreditations={['HSE Approved', 'Adventure Activities Licensing Authority Recognized', 'Sports England Endorsed']}
      assessmentMethod="Practical scenarios and continuous assessment"
      prerequisites="None - suitable for beginners"
      seoKeywords="activity first aid course, sports first aid training, outdoor first aid Yorkshire, activity instructor first aid Sheffield"
    />
  )
}

export default ActivityFirstAidPage