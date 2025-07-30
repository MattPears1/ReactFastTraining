import React from "react";
import { AdminCard } from "../../../components/ui/AdminCard";
import { SettingSection } from "../types";

interface SettingsNavigationProps {
  sections: SettingSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <AdminCard noPadding>
      <nav className="space-y-1 p-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors ${
              activeSection === section.id
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div
              className={
                activeSection === section.id
                  ? "text-primary-500"
                  : "text-gray-400"
              }
            >
              {section.icon}
            </div>
            <div className="text-left">
              <div className="font-medium">{section.title}</div>
              <div className="admin-text-small admin-text-muted">
                {section.description}
              </div>
            </div>
          </button>
        ))}
      </nav>
    </AdminCard>
  );
};