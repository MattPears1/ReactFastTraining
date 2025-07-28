import React from "react";
import { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`admin-empty-state ${className}`}>
      <Icon className="admin-empty-icon mx-auto" />
      <h3 className="admin-empty-title">{title}</h3>
      {description && <p className="admin-empty-description">{description}</p>}
      {action && <div className="admin-mt-6">{action}</div>}
    </div>
  );
};
