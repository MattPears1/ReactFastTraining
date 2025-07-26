import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const OxygenTherapyPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Oxygen Therapy Course"
      courseAcronym="O2"
      duration="Half Day (4 hours)"
      price="£60"
      certificateValidity="3 years"
      description="Learn to safely administer emergency oxygen therapy. This course covers the use of oxygen equipment and is essential for first aiders in high-risk environments."
      learningOutcomes={[
        'Understand when oxygen therapy is needed',
        'Safely operate oxygen equipment',
        'Recognize oxygen therapy indications',
        'Identify contraindications and risks',
        'Perform safety checks',
        'Maintain oxygen equipment',
        'Document oxygen administration',
        'Handle oxygen emergencies'
      ]}
      whoShouldAttend={[
        'First aiders in high-risk workplaces',
        'Sports injury therapists',
        'Dive center staff',
        'Care home personnel',
        'Industrial first aiders',
        'Event medical staff',
        'Anyone using emergency oxygen'
      ]}
      courseContent={[
        {
          title: 'Theory and Practice',
          topics: [
            'Physiology of oxygen therapy',
            'When to give oxygen',
            'Types of oxygen delivery systems',
            'Safety considerations',
            'Practical oxygen administration',
            'Equipment maintenance',
            'Legal considerations',
            'Documentation requirements'
          ]
        }
      ]}
      accreditations={['BOC Medical Approved', 'First Aid Industry Body (FAIB) Recognized']}
      assessmentMethod="Written assessment and practical demonstration"
      prerequisites="Current first aid certificate recommended"
      whatToExpect={[
        'Hands-on practice with oxygen equipment',
        'Safety protocols training',
        'Equipment familiarization',
        'Certificate valid for 3 years'
      ]}
      seoKeywords="oxygen therapy course Yorkshire, emergency oxygen training Sheffield, O2 administration course, first aid oxygen therapy"
    />
  )
}

export default OxygenTherapyPage