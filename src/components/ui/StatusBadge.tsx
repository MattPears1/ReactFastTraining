import React from "react";
import { cn } from "@utils/cn";

// Status badge variants based on semantic meaning
export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "default"
  | "primary"
  | "secondary";

// Common status types across the application
export type StatusType =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "active"
  | "inactive"
  | "published"
  | "draft"
  | "archived"
  | "paid"
  | "refunded"
  | "overdue"
  | "scheduled"
  | "in-progress"
  | "failed";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  status?: StatusType;
  size?: "xs" | "sm" | "md" | "lg";
  pulse?: boolean;
  dot?: boolean;
  className?: string;
}

// Map status types to variants
const statusVariantMap: Record<StatusType, StatusVariant> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "error",
  completed: "success",
  active: "success",
  inactive: "default",
  published: "success",
  draft: "warning",
  archived: "default",
  paid: "success",
  refunded: "warning",
  overdue: "error",
  scheduled: "info",
  "in-progress": "primary",
  failed: "error",
};

// Variant styles
const variantStyles: Record<StatusVariant, string> = {
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  primary:
    "bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400",
  secondary:
    "bg-secondary-100 text-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-400",
};

// Size styles
const sizeStyles = {
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

// Dot color styles
const dotColors: Record<StatusVariant, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  default: "bg-gray-500",
  primary: "bg-primary-500",
  secondary: "bg-secondary-500",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = "default",
  status,
  size = "sm",
  pulse = false,
  dot = false,
  className,
}) => {
  // Determine variant from status if provided
  const effectiveVariant = status ? statusVariantMap[status] : variant;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        variantStyles[effectiveVariant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span className="relative inline-flex">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              dotColors[effectiveVariant],
            )}
          />
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                dotColors[effectiveVariant],
              )}
            />
          )}
        </span>
      )}
      {children}
    </span>
  );
};

// Export status label helpers
export const statusLabels: Record<StatusType, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  active: "Active",
  inactive: "Inactive",
  published: "Published",
  draft: "Draft",
  archived: "Archived",
  paid: "Paid",
  refunded: "Refunded",
  overdue: "Overdue",
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  failed: "Failed",
};

// Helper component for common status patterns
export const StatusBadgeAuto: React.FC<{
  status: StatusType;
  className?: string;
}> = ({ status, className }) => {
  return (
    <StatusBadge status={status} className={className}>
      {statusLabels[status]}
    </StatusBadge>
  );
};
