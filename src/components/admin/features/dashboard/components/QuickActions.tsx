import React from "react";
import { Plus, Calendar, Users, Mail, FileText, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@utils/cn";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  description: string;
}

export const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      label: "Create Session",
      icon: Plus,
      href: "/admin/sessions/new",
      color: "bg-primary-600 hover:bg-primary-700 text-white",
      description: "Schedule a new training session",
    },
    {
      label: "View Calendar",
      icon: Calendar,
      href: "/admin/calendar",
      color: "bg-green-600 hover:bg-green-700 text-white",
      description: "Manage all sessions",
    },
    {
      label: "Manage Bookings",
      icon: Users,
      href: "/admin/bookings",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      description: "View and edit bookings",
    },
    {
      label: "Send Email",
      icon: Mail,
      href: "/admin/emails",
      color: "bg-purple-600 hover:bg-purple-700 text-white",
      description: "Email clients",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/admin/reports",
      color: "bg-gray-600 hover:bg-gray-700 text-white",
      description: "View analytics",
    },
    {
      label: "Export Data",
      icon: Download,
      href: "/admin/export",
      color: "bg-amber-600 hover:bg-amber-700 text-white",
      description: "Download reports",
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => (
          <Link key={action.label} to={action.href} className="group relative">
            <div
              className={cn(
                "rounded-lg p-4 text-center transition-all duration-200 shadow-sm hover:shadow-md",
                action.color,
              )}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{action.label}</p>
            </div>

            {/* Tooltip */}
            <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
              {action.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
