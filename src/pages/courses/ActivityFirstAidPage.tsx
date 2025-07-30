import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const ActivityFirstAidPage: React.FC = () => {
  const courseData = {
    courseName: "Activity First Aid",
    courseAcronym: "AFA",
    duration: "1 Day",
    price: "£120",
    groupSize: "Maximum 12 participants",
    certificateValidity: "Valid for 3 years",
    description:
      "This course is tailored for individuals involved in sports, leisure, and recreational activities. It covers the content of the EFAW course but with a focus on activity-related injuries and emergencies that may occur in outdoor and sporting environments.",

    learningOutcomes: [
      "Demonstrate core first aid skills including CPR, AED use, and managing an unresponsive casualty",
      "Deal with fractures, dislocations, sprains, and strains",
      "Manage head, neck, and spinal injuries",
      "Treat the effects of heat and cold",
      "Respond to major illnesses in activity settings",
    ],

    whoShouldAttend: [
      "Sports coaches and fitness instructors",
      "Outdoor activity leaders and guides",
      "PE teachers and sports staff",
      "Adventure activity providers",
      "Scout, guide and youth group leaders",
      "Expedition and trek leaders",
      "Leisure centre staff",
      "Anyone leading physical activities",
    ],

    courseContent: [
      {
        title: "Core Emergency Skills",
        topics: [
          "Roles and responsibilities in activity settings",
          "Assessing incidents in challenging environments",
          "Adult CPR in outdoor and activity settings",
          "Using an AED in various conditions",
          "Managing an unresponsive casualty",
          "Recovery position adaptations for outdoor settings",
          "Choking management during activities",
          "Controlling severe bleeding in remote locations",
          "Shock management with limited resources",
        ],
      },
      {
        title: "Activity-Specific Injuries",
        topics: [
          "Managing fractures and dislocations",
          "Treating sprains, strains and soft tissue injuries",
          "Head injuries and concussion protocols",
          "Neck and spinal injury management",
          "Heat exhaustion and heat stroke",
          "Hypothermia and cold injuries",
          "Improvised first aid techniques",
          "Major illness recognition in activity settings",
        ],
      },
    ],

    accreditations: [
      "HSE Approved",
      "Adventure Activities Licensing Authority Recognised",
      "Sports England Endorsed",
    ],

    whatToExpect: [
      "Scenario-based training in outdoor settings",
      "Practice with sports and activity injuries",
      "Improvisation techniques for remote locations",
      "Weather-resistant training approaches",
      "Small group sizes for personalised training",
      "Activity-specific risk assessment skills",
      "Comprehensive course manual",
      "Certificate recognised by sports governing bodies",
    ],

    assessmentMethod:
      "Practical scenarios and continuous assessment in activity-based settings",

    prerequisites: "None - suitable for beginners",

    seoKeywords:
      "activity first aid course, sports first aid training, outdoor first aid, activity instructor first aid",
  };

  return <CourseTemplate {...courseData} />;
};

export default ActivityFirstAidPage;
