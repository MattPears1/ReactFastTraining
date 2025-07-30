import React from "react";
import { cn } from "@utils/cn";
import { ReportTab } from "../types";

interface TabNavigationProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

const tabs: { id: ReportTab; label: string }[] = [
  { id: "revenue", label: "Revenue Analysis" },
  { id: "bookings", label: "Booking Trends" },
  { id: "attendance", label: "Attendance Metrics" },
  { id: "courses", label: "Course Performance" },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "text-primary-600 border-primary-600"
                : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};