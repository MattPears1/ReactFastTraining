import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const OxygenTherapyPage: React.FC = () => {
  const courseData = {
    courseName: "Oxygen Therapy Course",
    courseAcronym: "O2",
    duration: "3 Hours",
    price: "£60",
    certificateValidity: "Valid for 3 years",
    description:
      "This specialised course is for qualified first aiders and healthcare professionals who may need to administer oxygen during a medical emergency. Learn the safe use, storage, and handling of oxygen equipment in emergency situations.",

    learningOutcomes: [
      "The indications for and contraindications of oxygen therapy",
      "Health and safety guidelines for the use, storage, and handling of oxygen",
      "Operational checks of oxygen equipment",
      "Administering oxygen using various delivery devices like non-rebreather masks and bag-valve masks",
    ],

    whoShouldAttend: [
      "Qualified first aiders requiring oxygen administration skills",
      "Sports injury therapists and physiotherapists",
      "Dive center staff and dive masters",
      "Care home and nursing staff",
      "Industrial first aiders in high-risk environments",
      "Event and festival medical staff",
      "Ambulance community first responders",
      "Anyone responsible for emergency oxygen equipment",
    ],

    courseContent: [
      {
        title: "Oxygen Therapy Training Programme",
        topics: [
          "Understanding hypoxia and oxygen deficiency",
          "Indications for emergency oxygen therapy",
          "Contraindications and precautions",
          "Types of oxygen delivery systems",
          "Oxygen cylinder types and identification",
          "Health and safety in oxygen use",
          "Storage and handling regulations",
          "Pre-use equipment safety checks",
          "Flow rate calculations and settings",
          "Using non-rebreather masks",
          "Bag-valve-mask (BVM) techniques",
          "Nasal cannula and simple face masks",
          "Monitoring oxygen saturation",
          "Documentation and record keeping",
          "Dealing with oxygen emergencies",
          "Maintenance and testing schedules",
        ],
      },
    ],

    accreditations: [
      "BOC Medical Approved",
      "First Aid Industry Body (FAIB) Recognized",
      "CPD Certified",
    ],

    whatToExpect: [
      "Comprehensive theory on oxygen physiology",
      "Hands-on practice with various oxygen equipment",
      "Safety protocols and risk assessment training",
      "Multiple delivery device familiarization",
      "Cylinder changing and safety procedures",
      "Practical scenarios with oxygen administration",
      "Written and practical assessments",
      "Reference manual to keep",
      "Certificate valid for 3 years",
    ],

    assessmentMethod:
      "Written assessment and practical demonstration of safe oxygen administration",

    prerequisites:
      "Current first aid certificate (FAW, EFAW or equivalent) required",

    seoKeywords:
      "oxygen therapy course Yorkshire, emergency oxygen training South Yorkshire, O2 administration South Yorkshire, medical oxygen first aid",
  };

  return <CourseTemplate {...courseData} />;
};

export default OxygenTherapyPage;
