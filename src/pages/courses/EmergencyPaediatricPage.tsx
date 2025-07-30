import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const EmergencyPaediatricPage: React.FC = () => {
  const courseData = {
    courseName: "Emergency Paediatric First Aid (EPFA)",
    courseAcronym: "EPFA",
    duration: "1 Day",
    price: "£100",
    certificateValidity: "Valid for 3 years",
    description:
      "This course focuses on emergency scenarios involving infants and children and is suitable for those who do not require the two-day paediatric first aid qualification. It provides essential skills for managing emergency situations with babies and young children.",

    learningOutcomes: [
      "Assess an emergency and prioritize actions",
      "Use CPR and AED for children and infants",
      "Manage an unresponsive casualty, choking, bleeding, and shock",
    ],

    whoShouldAttend: [
      "Childcare professionals requiring basic paediatric first aid",
      "Nursery staff and childminders",
      "Teachers and teaching assistants",
      "Parents, grandparents and carers",
      "Youth workers and sports coaches",
      "Anyone working with or caring for children",
      "Those requiring EYFS compliance (partial)",
    ],

    courseContent: [
      {
        title: "Course Overview",
        topics: [
          "Assessing an emergency situation involving children",
          "Prioritising actions in an emergency",
          "Infant CPR techniques (under 1 year)",
          "Child CPR techniques (1 year to puberty)",
          "Using an AED on children and infants",
          "Managing an unresponsive infant or child",
          "Recovery position for infants and children",
          "Choking procedures for conscious infants",
          "Choking procedures for conscious children",
          "Managing unconscious choking casualties",
          "Controlling bleeding in children",
          "Recognising and treating shock in children",
          "Basic wound care for children",
          "Recording and reporting incidents",
        ],
      },
    ],

    accreditations: [
      "Ofqual Regulated",
      "EYFS Compliant",
      "Ofsted Approved",
      "CPD Certified",
    ],

    whatToExpect: [
      "Focused emergency skills training",
      "Age-appropriate techniques for infants and children",
      "Hands-on practice with paediatric manikins",
      "Real-world scenarios relevant to childcare settings",
      "Small group sizes for individual attention",
      "Course materials designed for childcare contexts",
      "Continuous assessment throughout the day",
      "Certificate valid for EYFS requirements",
    ],

    assessmentMethod: "Continuous observation and practical demonstration",

    prerequisites: "None - suitable for beginners",

    groupSize: "Maximum 12 participants",

    seoKeywords:
      "emergency paediatric first aid, EPFA course, 1 day children first aid, emergency childcare first aid",
  };

  return <CourseTemplate {...courseData} />;
};

export default EmergencyPaediatricPage;
