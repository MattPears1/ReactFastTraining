import React from 'react'
import CourseTemplate from '@components/templates/CourseTemplate'

const PaediatricRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      title="Paediatric First Aid Requalification"
      subtitle="Refresh your paediatric first aid certification"
      duration="2 Days"
      price="£90"
      certification="3 Years"
      description="Maintain your paediatric first aid qualification with this comprehensive requalification course. Designed for those whose certificate is nearing expiry, this course refreshes all essential skills for providing first aid to infants and children."
      highlights={[
        'Update your paediatric first aid skills',
        'Maintain Ofsted compliance',
        'Practice latest techniques',
        'Refresh emergency protocols'
      ]}
      courseContent={[
        'Review of paediatric first aider responsibilities',
        'Updated CPR techniques for infants and children',
        'Latest choking procedures',
        'Managing unconscious casualties',
        'Treating wounds and bleeding',
        'Burns and scalds in children',
        'Managing seizures and febrile convulsions',
        'Anaphylaxis and allergic reactions',
        'Updated protocols for common childhood illnesses',
        'Meningitis recognition',
        'Head injuries in children',
        'Fractures and sprains',
        'Asthma and breathing difficulties',
        'Poisoning and harmful substances',
        'Record keeping requirements'
      ]}
      whoShouldAttend={[
        'Current paediatric first aid certificate holders',
        'Childcare professionals needing requalification',
        'School staff maintaining certification',
        'Nursery workers',
        'Childminders and nannies'
      ]}
      whatYouGet={[
        '2-day comprehensive refresher training',
        'New 3-year certificate',
        'Updated course materials',
        'Practical hands-on sessions',
        'Small group sizes (max 12)',
        'Ofsted compliant certification',
        'Experienced paediatric trainer'
      ]}
      ctaTitle="Ready to Renew Your Certification?"
      ctaDescription="Don't let your paediatric first aid certificate expire. Book your requalification course today."
    />
  )
}

export default PaediatricRequalificationPage