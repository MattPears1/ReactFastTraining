import React from "react";
import { Building2, Users, Bell, Shield, CreditCard } from "lucide-react";
import { cn } from "@utils/cn";
import { SettingsSection } from "../types";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  hasChanges: boolean;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  hasChanges,
}) => {
  const sections = [
    {
      id: "business" as const,
      label: "Business",
      icon: Building2,
      description: "Company information and details",
    },
    {
      id: "course" as const,
      label: "Courses",
      icon: Users,
      description: "Course settings and configuration",
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
      description: "Email and alert preferences",
    },
    {
      id: "security" as const,
      label: "Security",
      icon: Shield,
      description: "Security and access settings",
    },
    {
      id: "payment" as const,
      label: "Payment",
      icon: CreditCard,
      description: "Payment methods and policies",
    },
  ];

  return (
    <div className="w-64 bg-white rounded-lg border border-gray-200 p-2">
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => {
                if (hasChanges) {
                  const confirmed = window.confirm(
                    "You have unsaved changes. Do you want to discard them?",
                  );
                  if (!confirmed) return;
                }
                onSectionChange(section.id);
              }}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mt-0.5",
                  isActive ? "text-primary-600" : "text-gray-400",
                )}
              />
              <div className="flex-1">
                <div
                  className={cn(
                    "font-medium text-sm",
                    isActive ? "text-primary-900" : "text-gray-900",
                  )}
                >
                  {section.label}
                </div>
                <div
                  className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-primary-600" : "text-gray-500",
                  )}
                >
                  {section.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
