import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const PaediatricCoursePage: React.FC = () => {
  const courseData = {
    courseName: "Paediatric First Aid",
    courseAcronym: "PFA",
    duration: "2 Days",
    price: "£120",
    certificateValidity: "Valid for 3 years",
    groupSize: "Maximum 12 participants",
    description:
      "This is a comprehensive course covering a wide range of first aid emergencies affecting babies and infants. This course is essential for anyone working with children, including those in nurseries, schools, and as childminders, and is compliant with OFSTED and Early Years Foundation Stage (EYFS) requirements.",

    learningOutcomes: [
      "Understand the roles and responsibilities of a paediatric first-aider",
      "Assess an emergency situation involving a child or infant",
      "Use CPR and AED on children and infants",
      "Manage choking, bleeding, shock, and anaphylaxis in children",
      "Treat burns, fractures, head, neck, and spinal injuries",
    ],

    whoShouldAttend: [
      "Childcare professionals and nursery staff",
      "Teachers and teaching assistants",
      "Childminders and nannies",
      "Parents, grandparents, and carers",
      "Youth workers and sports coaches",
      "Anyone responsible for children's welfare",
    ],

    courseContent: [
      {
        title: "Emergency Life Support",
        topics: [
          "Roles and responsibilities of a paediatric first aider",
          "Assessing an emergency situation - primary survey",
          "Infant CPR (under 1 year) techniques",
          "Child CPR (1 year to puberty) techniques",
          "Using an AED on children and infants",
          "Managing an unresponsive infant or child",
          "Recovery position for infants and children",
          "Choking procedures for conscious and unconscious casualties",
        ],
      },
      {
        title: "Injuries and Medical Conditions",
        topics: [
          "Controlling bleeding and treating shock in children",
          "Managing anaphylaxis and severe allergic reactions",
          "Burns and scalds treatment for children",
          "Fractures, dislocations and soft tissue injuries",
          "Head, neck and spinal injuries in children",
          "Managing diabetes emergencies in children",
          "Dealing with asthma attacks",
          "Febrile convulsions and seizures",
          "Electric shock, poisoning and bites/stings",
        ],
      },
    ],

    accreditations: [
      "Ofsted Compliant",
      "EYFS Requirements",
      "RQF Level 3",
      "CPD Certified",
    ],

    whatToExpect: [
      "Paediatric manikins for realistic practice",
      "Focus on age-appropriate techniques",
      "Scenarios based on real childcare settings",
      "Comprehensive course handbook",
      "Continuous assessment approach",
      "Certificate valid for Ofsted registration",
      "Support with EYFS compliance",
    ],

    prerequisites: "None - suitable for all levels of experience",

    seoKeywords:
      "paediatric first aid course, childcare first aid training, EYFS first aid, Ofsted compliant training, baby first aid course",
  };

  return <CourseTemplate {...courseData} />;
};

export default PaediatricCoursePage;
