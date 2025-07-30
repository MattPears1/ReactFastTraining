import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const PaediatricRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Paediatric First Aid Requalification"
      courseAcronym="PFAR"
      duration="3 Hours"
      price="£90"
      certificateValidity="3 Years"
      description="Maintain your paediatric first aid qualification with this comprehensive requalification course. Designed for those whose certificate is nearing expiry, this course refreshes all essential skills for providing first aid to infants and children."
      learningOutcomes={[
        "Update your paediatric first aid skills",
        "Maintain Ofsted compliance",
        "Practice latest techniques",
        "Refresh emergency protocols",
      ]}
      courseContent={[
        {
          title: "Course Content Overview",
          topics: [
            "Review of paediatric first aider responsibilities",
            "Updated CPR techniques for infants and children",
            "Latest choking procedures",
            "Managing unconscious casualties",
            "Treating wounds and bleeding",
            "Burns and scalds in children",
            "Managing seizures and febrile convulsions",
            "Anaphylaxis and allergic reactions",
            "Updated protocols for common childhood illnesses",
            "Meningitis recognition",
            "Head injuries in children",
            "Fractures and sprains",
            "Asthma and breathing difficulties",
            "Poisoning and harmful substances",
            "Record keeping requirements",
          ],
        },
      ]}
      whoShouldAttend={[
        "Current paediatric first aid certificate holders",
        "Childcare professionals needing requalification",
        "School staff maintaining certification",
        "Nursery workers",
        "Childminders and nannies",
      ]}
      accreditations={["Ofsted Approved", "HSE Compliant"]}
      whatToExpect={[
        "3-hour comprehensive refresher training",
        "New 3-year certificate",
        "Updated course materials",
        "Practical hands-on sessions",
        "Small group sizes (max 12)",
        "Ofsted compliant certification",
        "Experienced paediatric trainer",
      ]}
      seoKeywords="paediatric first aid requalification, childcare first aid renewal, ofsted approved training"
    />
  );
};

export default PaediatricRequalificationPage;
