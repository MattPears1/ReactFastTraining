import React from "react";
import {
  Package,
  Users,
  Calendar,
  FileText,
  Search,
  Inbox,
  AlertCircle,
  Plus,
  Upload,
  FolderOpen,
} from "lucide-react";
import { Button } from "./Button";
import { cn } from "@utils/cn";

// Common empty state types
export type EmptyStateType =
  | "no-data"
  | "no-results"
  | "no-bookings"
  | "no-clients"
  | "no-sessions"
  | "no-documents"
  | "no-notifications"
  | "error"
  | "custom";

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

// Default configurations for common empty states
const emptyStateConfig: Record<
  EmptyStateType,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
  }
> = {
  "no-data": {
    icon: <FolderOpen className="h-12 w-12" />,
    title: "No data yet",
    description: "Get started by adding your first item.",
  },
  "no-results": {
    icon: <Search className="h-12 w-12" />,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },
  "no-bookings": {
    icon: <Calendar className="h-12 w-12" />,
    title: "No bookings",
    description: "You don't have any bookings yet.",
  },
  "no-clients": {
    icon: <Users className="h-12 w-12" />,
    title: "No clients",
    description: "Start building your client base.",
  },
  "no-sessions": {
    icon: <Package className="h-12 w-12" />,
    title: "No sessions scheduled",
    description: "Create your first training session.",
  },
  "no-documents": {
    icon: <FileText className="h-12 w-12" />,
    title: "No documents",
    description: "Upload or create your first document.",
  },
  "no-notifications": {
    icon: <Inbox className="h-12 w-12" />,
    title: "All caught up!",
    description: "You have no new notifications.",
  },
  error: {
    icon: <AlertCircle className="h-12 w-12" />,
    title: "Something went wrong",
    description: "We encountered an error loading this content.",
  },
  custom: {
    icon: null,
    title: "",
    description: "",
  },
};

const sizeStyles = {
  sm: {
    container: "py-8 px-4",
    icon: "[&>svg]:h-8 [&>svg]:w-8",
    title: "text-base",
    description: "text-sm",
    actions: "gap-2",
  },
  md: {
    container: "py-12 px-6",
    icon: "[&>svg]:h-12 [&>svg]:w-12",
    title: "text-lg",
    description: "text-base",
    actions: "gap-3",
  },
  lg: {
    container: "py-16 px-8",
    icon: "[&>svg]:h-16 [&>svg]:w-16",
    title: "text-xl",
    description: "text-base",
    actions: "gap-4",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "no-data",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
}) => {
  const config = emptyStateConfig[type];
  const styles = sizeStyles[size];

  // Use provided values or fall back to config
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className,
      )}
    >
      {displayIcon && (
        <div
          className={cn("text-gray-400 dark:text-gray-600 mb-4", styles.icon)}
        >
          {displayIcon}
        </div>
      )}

      {displayTitle && (
        <h3
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-2",
            styles.title,
          )}
        >
          {displayTitle}
        </h3>
      )}

      {displayDescription && (
        <p
          className={cn(
            "text-gray-600 dark:text-gray-400 max-w-sm mb-6",
            styles.description,
          )}
        >
          {displayDescription}
        </p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center",
            styles.actions,
          )}
        >
          {action && (
            <Button
              onClick={action.onClick}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Specific empty state components for common use cases
export const NoDataEmptyState: React.FC<{
  onAction?: () => void;
  actionLabel?: string;
}> = ({ onAction, actionLabel = "Get Started" }) => (
  <EmptyState
    type="no-data"
    action={
      onAction
        ? {
            label: actionLabel,
            onClick: onAction,
            icon: <Plus className="h-4 w-4" />,
          }
        : undefined
    }
  />
);

export const NoResultsEmptyState: React.FC<{
  onClearFilters?: () => void;
}> = ({ onClearFilters }) => (
  <EmptyState
    type="no-results"
    action={
      onClearFilters
        ? { label: "Clear Filters", onClick: onClearFilters }
        : undefined
    }
  />
);

export const ErrorEmptyState: React.FC<{
  onRetry?: () => void;
  error?: string;
}> = ({ onRetry, error }) => (
  <EmptyState
    type="error"
    description={error || "We encountered an error loading this content."}
    action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
  />
);
