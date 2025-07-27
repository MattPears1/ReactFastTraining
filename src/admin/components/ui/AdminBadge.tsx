import React from 'react';
import { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface AdminBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  variant,
  children,
  icon: Icon,
  className = '',
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'admin-badge-success';
      case 'warning':
        return 'admin-badge-warning';
      case 'danger':
        return 'admin-badge-danger';
      case 'info':
        return 'admin-badge-info';
      case 'neutral':
        return 'admin-badge-neutral';
      default:
        return 'admin-badge-neutral';
    }
  };

  return (
    <span className={`admin-badge ${getVariantClass()} ${className}`}>
      {Icon && <Icon className="admin-icon-sm" />}
      {children}
    </span>
  );
};