import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const EFAWRequalificationPage: React.FC = () => {
  const courseData = {
    courseName: "Emergency First Aid at Work Requalification",
    courseAcronym: "EFAW-R",
    duration: "1 Day",
    price: "£70",
    certificateValidity: "Valid for 3 years",
    description:
      "While the one-day EFAW course can be retaken to requalify, this refresher course is designed specifically for those who need to renew their Emergency First Aid at Work certificate. It provides a comprehensive review of emergency first aid skills and updates on any changes in protocols.",

    learningOutcomes: [
      "Refresh the role and responsibilities of an emergency first aider",
      "Update skills in assessing emergency situations",
      "Review and practice CPR techniques for adults",
      "Refresh AED use and maintenance knowledge",
      "Update choking management procedures",
      "Practice recovery position and casualty management",
      "Review bleeding control and shock treatment",
      "Update knowledge on minor injuries and burns",
      "Refresh record keeping and reporting procedures",
    ],

    whoShouldAttend: [
      "Current EFAW certificate holders",
      "Those whose EFAW certificate is due to expire",
      "Workplace emergency first aiders requiring renewal",
      "Anyone needing to maintain their emergency first aid qualification",
      "Note: Certificate must be valid or expired within the last month",
    ],

    courseContent: [
      {
        title: "Full Day Refresher Programme",
        topics: [
          "Review of the emergency first aider role and legal responsibilities",
          "Updated protocols for assessing emergency situations",
          "CPR technique refresher with latest guidelines",
          "AED operation and safety updates",
          "Managing unresponsive casualties - latest best practices",
          "Recovery position techniques and variations",
          "Choking management for conscious and unconscious adults",
          "Bleeding control including severe bleeding",
          "Shock recognition and treatment updates",
          "Minor injuries, burns and scalds refresher",
          "Seizure management protocols",
          "Practical scenarios and assessment",
        ],
      },
    ],

    accreditations: ["HSE Approved", "Ofqual Regulated", "CPD Certified"],

    whatToExpect: [
      "Comprehensive skills refresher in one day",
      "Updates on latest emergency first aid protocols",
      "Extensive practical hands-on practice",
      "Real-world scenario training",
      "Continuous assessment approach",
      "Small group sizes (maximum 12)",
      "Updated reference materials",
      "Certificate issued on successful completion",
    ],

    prerequisites:
      "Valid or recently expired (within 1 month) Emergency First Aid at Work certificate",

    assessmentMethod: "Continuous practical assessment throughout the day",

    seoKeywords:
      "EFAW requalification, emergency first aid renewal, EFAW refresher, 1 day first aid requalification",
  };

  return <CourseTemplate {...courseData} />;
};

export default EFAWRequalificationPage;
