import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const PaediatricCoursePage: React.FC = () => {
  const courseData = {
    courseName: 'Paediatric First Aid',
    courseAcronym: 'PFA',
    duration: 'Full Day (6 hours)',
    price: '£120',
    certificateValidity: 'Valid for 3 years',
    description: 'This is a comprehensive course covering a wide range of first aid emergencies affecting infants and children. It\'s often delivered in a blended format, with online theory and in-person practical sessions. This course is essential for anyone working with children, including those in nurseries, schools, and as childminders, and is compliant with OFSTED and Early Years Foundation Stage (EYFS) requirements.',
    
    learningOutcomes: [
      'Roles and responsibilities of a paediatric first aider',
      'Assessing an emergency situation involving a child or infant',
      'CPR and AED use on children and infants',
      'Managing choking, bleeding, shock, and anaphylaxis in children',
      'Treating burns, fractures, and head, neck, and spinal injuries',
      'Recognising and responding to medical conditions like meningitis, diabetes, asthma, and febrile convulsions'
    ],
    
    whoShouldAttend: [
      'Childcare professionals and nursery staff',
      'Teachers and teaching assistants',
      'Childminders and nannies',
      'Parents and grandparents',
      'Youth workers and sports coaches',
      'Anyone responsible for children\'s welfare',
      'Those requiring OFSTED compliance'
    ],
    
    courseContent: [
      {
        title: 'Emergency Life Support',
        topics: [
          'Roles and responsibilities of a paediatric first aider',
          'Assessing an emergency situation - primary survey',
          'Infant CPR (under 1 year) techniques',
          'Child CPR (1 year to puberty) techniques',
          'Using an AED on children and infants',
          'Managing an unresponsive infant or child',
          'Recovery position for infants and children',
          'Choking procedures for conscious and unconscious casualties'
        ]
      },
      {
        title: 'Injuries and Medical Conditions',
        topics: [
          'Controlling bleeding and treating shock in children',
          'Managing anaphylaxis and severe allergic reactions',
          'Burns and scalds treatment for children',
          'Fractures, dislocations and soft tissue injuries',
          'Head, neck and spinal injuries in children',
          'Recognising meningitis symptoms',
          'Managing diabetes emergencies in children',
          'Dealing with asthma attacks',
          'Febrile convulsions and seizures',
          'Electric shock, poisoning and bites/stings'
        ]
      }
    ],
    
    accreditations: ['Ofsted Compliant', 'EYFS Requirements', 'RQF Level 3', 'CPD Certified'],
    
    whatToExpect: [
      'Child-friendly training environment',
      'Pediatric manikins for realistic practice',
      'Blended learning options available (6 hours online + 6 hours practical)',
      'Focus on age-appropriate techniques',
      'Scenarios based on real childcare settings',
      'Comprehensive course handbook',
      'Continuous assessment approach',
      'Certificate valid for Ofsted registration',
      'Support with EYFS compliance'
    ],
    
    prerequisites: 'None - suitable for all levels of experience',
    
    seoKeywords: 'paediatric first aid course Yorkshire, childcare first aid training, EYFS first aid, Ofsted compliant training, baby first aid course'
  }

  return <CourseTemplate {...courseData} />
}

export default PaediatricCoursePage