import React from "react";
import CourseTemplate from "@components/templates/CourseTemplate";

const ActivityFirstAidRequalificationPage: React.FC = () => {
  return (
    <CourseTemplate
      courseName="Activity First Aid Requalification"
      courseAcronym="AFA-R"
      duration="1 Day"
      price="£90"
      certificateValidity="3 years"
      description="Refresh your Activity First Aid certification with this intensive 1-day requalification course. Maintain your skills for managing emergencies in sports and outdoor activity settings."
      learningOutcomes={[
        "Update activity-specific first aid skills",
        "Refresh outdoor emergency procedures",
        "Review sports injury management",
        "Practice CPR in challenging scenarios",
        "Update environmental injury treatment",
        "Refresh evacuation procedures",
        "Review current best practices",
      ]}
      whoShouldAttend={[
        "Current Activity First Aid certificate holders",
        "Sports coaches needing requalification",
        "Outdoor instructors with expiring certificates",
        "Activity leaders requiring certification renewal",
      ]}
      courseContent={[
        {
          title: "Morning: Core Skills Update",
          topics: [
            "Updated activity first aid protocols",
            "Emergency response review",
            "CPR and trauma refresher",
            "Sports injury update",
            "Risk assessment review",
          ],
        },
        {
          title: "Afternoon: Practical Application",
          topics: [
            "Outdoor scenario practice",
            "Environmental emergency review",
            "Evacuation procedure update",
            "Equipment improvisation",
            "Assessment scenarios",
          ],
        },
      ]}
      accreditations={[
        "HSE Approved",
        "Adventure Activities Licensing Authority Recognized",
        "Sports England Endorsed",
      ]}
      assessmentMethod="Practical demonstration and scenario-based assessment"
      prerequisites="Valid or recently expired Activity First Aid certificate"
      seoKeywords="activity first aid requalification, AFA renewal, sports first aid refresher Yorkshire, outdoor first aid requalification South Yorkshire"
    />
  );
};

export default ActivityFirstAidRequalificationPage;
