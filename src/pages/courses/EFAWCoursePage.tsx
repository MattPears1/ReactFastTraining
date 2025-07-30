import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const EFAWCoursePage: React.FC = () => {
  const courseData = {
    courseName: "Emergency First Aid at Work",
    courseAcronym: "EFAW",
    duration: "1 Day",
    price: "£100",
    certificateValidity: "Valid for 3 years",
    description:
      "This course is designed for individuals in lower-risk workplaces, such as offices, shops, and restaurants. It provides the essential skills to manage an emergency until professional help arrives.",

    learningOutcomes: [
      "Understand the role of an emergency first aider",
      "Assess an emergency situation",
      "Use CPR and AED on adults",
      "Manage an unresponsive casualty and use the recovery position",
      "Treat choking, seizures, shock, and bleeding",
      "Deal with minor injuries and burns",
    ],

    whoShouldAttend: [
      "Designated workplace first aiders in low-risk environments",
      "Employees in small to medium organisations",
      "Anyone requiring basic first aid certification",
      "Those working in shops, offices, and restaurants",
    ],

    courseContent: [
      {
        title: "Course Overview",
        topics: [
          "The role of the emergency first aider - responsibilities and legal aspects",
          "Assessing an emergency situation - scene safety and primary survey",
          "Adult CPR (Cardiopulmonary Resuscitation) techniques",
          "Using an Automated External Defibrillator (AED) safely and effectively",
          "Managing an unresponsive casualty including the recovery position",
          "Treating choking casualties - conscious and unconscious",
          "Managing seizures and shock",
          "Controlling bleeding and treating wounds",
          "Dealing with minor injuries including burns and scalds",
          "Recording incidents and accident reporting",
        ],
      },
    ],

    accreditations: ["HSE Approved", "Ofqual Regulated", "CPD Certified"],

    whatToExpect: [
      "Hands-on practical training with realistic scenarios",
      "Maximum 12 participants",
      "All equipment and materials provided",
      "Course manual to keep for reference",
      "Written and practical assessments",
      "Certificate issued on successful completion",
    ],

    seoKeywords:
      "emergency first aid at work, EFAW course, 1 day first aid training, workplace first aid, EFAW certification",

    groupSize: "Maximum 12 participants",
  };

  return <CourseTemplate {...courseData} />;
};

export default EFAWCoursePage;
