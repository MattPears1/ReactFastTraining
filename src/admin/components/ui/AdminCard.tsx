import React from "react";
import { LucideIcon } from "lucide-react";

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "success" | "accent" | "danger";
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  loading?: boolean;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "primary",
  actions,
  children,
  className = "",
  noPadding = false,
  loading = false,
}) => {
  const getIconColorClass = () => {
    switch (iconColor) {
      case "primary":
        return "text-primary-500";
      case "success":
        return "text-secondary-500";
      case "accent":
        return "text-accent-500";
      case "danger":
        return "text-red-500";
      default:
        return "text-primary-500";
    }
  };

  return (
    <div className={`admin-card admin-fade-in ${className}`}>
      {(title || actions) && (
        <div className="admin-card-header">
          <div className="admin-flex-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`${getIconColorClass()}`}>
                  <Icon className="admin-icon-lg" />
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="admin-text-small admin-text-muted admin-mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-card-body">
          <div className="space-y-3">
            <div className="admin-skeleton h-4 w-3/4"></div>
            <div className="admin-skeleton h-4 w-1/2"></div>
            <div className="admin-skeleton h-4 w-5/6"></div>
          </div>
        </div>
      ) : (
        <div className={noPadding ? "" : "admin-card-body"}>{children}</div>
      )}
    </div>
  );
};
