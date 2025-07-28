import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const MentalHealthCoursePage: React.FC = () => {
  const courseData = {
    courseName: "Mental Health First Aid",
    courseAcronym: "MHFA",
    duration: "1 Day",
    price: "From £200",
    certificateValidity: "Valid for 3 years",
    description:
      "Become a certified Mental Health First Aider and support wellbeing in your workplace. This MHFA England approved course teaches you to recognize signs of mental health issues and provide initial support.",

    learningOutcomes: [
      "Recognize signs and symptoms of common mental health issues",
      "Provide initial help to someone experiencing a mental health crisis",
      "Guide someone towards appropriate professional help",
      "Reduce stigma around mental health in the workplace",
      "Promote wellbeing and self-care strategies",
      "Understand the role of a Mental Health First Aider",
      "Develop confidence in having supportive conversations",
    ],

    whoShouldAttend: [
      "HR professionals and managers",
      "Team leaders and supervisors",
      "Workplace wellbeing champions",
      "Health and safety representatives",
      "Anyone interested in mental health advocacy",
      "Employees in high-stress environments",
    ],

    courseContent: [
      {
        title: "Understanding Mental Health",
        topics: [
          "Mental health continuum",
          "Factors affecting mental health",
          "Stigma and discrimination",
          "Recovery and treatment",
          "The role of MHFA",
          "Self-care strategies",
        ],
      },
      {
        title: "Common Conditions",
        topics: [
          "Depression and anxiety",
          "Suicide and self-harm",
          "Psychosis and schizophrenia",
          "Bipolar disorder",
          "Eating disorders",
          "Substance misuse",
        ],
      },
      {
        title: "MHFA Skills",
        topics: [
          "ALGEE action plan",
          "Active listening techniques",
          "Non-judgmental approach",
          "Crisis first aid",
          "Signposting to support",
          "Boundaries and self-care",
        ],
      },
    ],

    accreditations: ["MHFA England Approved", "CPD Certified", "RQF Level 3"],

    whatToExpect: [
      "Interactive and discussion-based learning",
      "Mix of presentations, videos, and activities",
      "Safe space for open conversations",
      "Comprehensive MHFA manual and workbook",
      "Action planning for your workplace",
      "Certificate of attendance",
      "Access to MHFA England resources",
      "Ongoing support network",
    ],

    prerequisites: "None - open to everyone aged 16+",

    assessmentMethod:
      "Continuous assessment through participation and engagement",

    seoKeywords:
      "mental health first aid course Yorkshire, MHFA training South Yorkshire, workplace mental health, wellbeing training, mental health awareness course",
  };

  return <CourseTemplate {...courseData} />;
};

export default MentalHealthCoursePage;
