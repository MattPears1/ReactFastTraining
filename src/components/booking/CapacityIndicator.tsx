import React from "react";
import { Users, AlertCircle } from "lucide-react";
import { cn } from "@utils/cn";

interface CapacityIndicatorProps {
  current: number;
  max: number;
  size?: "sm" | "md" | "lg";
  showNumbers?: boolean;
  className?: string;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  current,
  max,
  size = "md",
  showNumbers = true,
  className = "",
}) => {
  // Ensure max capacity never exceeds 12 (hard limit per requirements)
  const maxCapacity = Math.min(max, 12);
  const percentage = (current / maxCapacity) * 100;
  const remaining = maxCapacity - current;
  const isFull = remaining === 0;
  const isAlmostFull = remaining <= 3 && remaining > 0;

  const sizeClasses = {
    sm: { bar: "h-2", text: "text-xs", icon: "w-3 h-3" },
    md: { bar: "h-3", text: "text-sm", icon: "w-4 h-4" },
    lg: { bar: "h-4", text: "text-base", icon: "w-5 h-5" },
  };

  const getColorClasses = () => {
    if (isFull) return { bg: "bg-red-500", text: "text-red-600" };
    if (isAlmostFull) return { bg: "bg-yellow-500", text: "text-yellow-600" };
    if (percentage >= 50) return { bg: "bg-blue-500", text: "text-blue-600" };
    return { bg: "bg-green-500", text: "text-gray-700" };
  };

  const colors = getColorClasses();
  const currentSize = sizeClasses[size];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress Bar */}
      <div
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          currentSize.bar,
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            colors.bg,
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Text Info */}
      {showNumbers && (
        <div
          className={cn(
            "flex items-center justify-between",
            currentSize.text,
            colors.text,
          )}
        >
          <span className="flex items-center gap-1">
            <Users className={currentSize.icon} />
            <span className="font-medium">
              {current}/{maxCapacity} booked
            </span>
          </span>
          <span className="font-semibold">
            {isFull ? (
              <>
                <AlertCircle className={cn("inline mr-1", currentSize.icon)} />
                FULLY BOOKED
              </>
            ) : isAlmostFull ? (
              <>Only {remaining} spots left!</>
            ) : (
              <>{remaining} spots available</>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
