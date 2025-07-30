import React from "react";
import { cn } from "@utils/cn";

interface AdminTableMobileProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    align?: "left" | "center" | "right";
    mobileLabel?: string; // Override label for mobile view
    hideOnMobile?: boolean; // Hide this column on mobile
    priority?: "high" | "medium" | "low"; // Display priority on mobile
  }[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

export function AdminTableMobile<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  className = "",
}: AdminTableMobileProps<T>) {
  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="admin-empty-state">
        {emptyIcon && <div className="admin-empty-icon">{emptyIcon}</div>}
        <div className="admin-empty-title">{emptyMessage}</div>
      </div>
    );
  }

  // Sort columns by priority for mobile display
  const mobileColumns = columns
    .filter((col) => !col.hideOnMobile)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || "medium"];
      const bPriority = priorityOrder[b.priority || "medium"];
      return aPriority - bPriority;
    });

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn("hidden lg:block", className)}>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn({
                      "text-left": column.align === "left" || !column.align,
                      "text-center": column.align === "center",
                      "text-right": column.align === "right",
                    })}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={keyExtractor(item)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn({
                        "text-left": column.align === "left" || !column.align,
                        "text-center": column.align === "center",
                        "text-right": column.align === "right",
                      })}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={cn("lg:hidden space-y-4", className)}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3"
          >
            {mobileColumns.map((column, index) => {
              // First item (usually title) gets special treatment
              if (index === 0 && column.priority === "high") {
                return (
                  <div key={column.key} className="mb-3">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      {column.render(item)}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={column.key}
                  className={cn("flex items-start justify-between gap-3", {
                    "flex-col": column.align === "center",
                  })}
                >
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {column.mobileLabel || column.header}:
                  </span>
                  <div
                    className={cn("text-sm text-gray-900 dark:text-gray-100", {
                      "text-right": column.align === "right",
                      "text-center w-full": column.align === "center",
                    })}
                  >
                    {column.render(item)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// Export a wrapper that maintains compatibility with existing AdminTable
export const AdminTable = AdminTableMobile;
