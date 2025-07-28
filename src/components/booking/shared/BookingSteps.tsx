import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { cn } from "@utils/cn";

export type BookingStep =
  | "select-course"
  | "details"
  | "payment"
  | "confirmation";

interface BookingStepsProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
  completedSteps?: BookingStep[];
  variant?: "horizontal" | "vertical";
  className?: string;
}

const steps: Array<{
  id: BookingStep;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}> = [
  {
    id: "select-course",
    label: "Select Course",
    icon: Calendar,
    description: "Choose your training date",
  },
  {
    id: "details",
    label: "Your Details",
    icon: FileText,
    description: "Contact information",
  },
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    description: "Secure payment",
  },
  {
    id: "confirmation",
    label: "Confirmation",
    icon: CheckCircle,
    description: "Booking complete",
  },
];

export const BookingSteps: React.FC<BookingStepsProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
  variant = "horizontal",
  className,
}) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const isStepCompleted = (step: BookingStep) => {
    return completedSteps.includes(step);
  };

  const isStepActive = (step: BookingStep) => {
    return step === currentStep;
  };

  const isStepAccessible = (stepId: BookingStep) => {
    if (!onStepClick) return false;
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    return stepIndex <= currentStepIndex || isStepCompleted(stepId);
  };

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const completed = isStepCompleted(step.id);
          const active = isStepActive(step.id);
          const accessible = isStepAccessible(step.id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                active &&
                  "border-primary-500 bg-primary-50 dark:bg-primary-900/20",
                completed &&
                  !active &&
                  "border-green-500 bg-green-50 dark:bg-green-900/20",
                !active && !completed && "border-gray-200 dark:border-gray-700",
                accessible &&
                  onStepClick &&
                  "cursor-pointer hover:border-gray-300",
                !accessible && "opacity-50",
              )}
              onClick={() => accessible && onStepClick && onStepClick(step.id)}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  active && "bg-primary-500 text-white",
                  completed && !active && "bg-green-500 text-white",
                  !active && !completed && "bg-gray-200 dark:bg-gray-700",
                )}
              >
                {completed && !active ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1">
                <h4
                  className={cn(
                    "font-semibold",
                    active && "text-primary-900 dark:text-primary-100",
                    completed &&
                      !active &&
                      "text-green-900 dark:text-green-100",
                  )}
                >
                  {step.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[28px] top-[72px] w-0.5 h-8",
                    completed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
                  )}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative mb-8">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary-500 transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const completed = isStepCompleted(step.id);
            const active = isStepActive(step.id);
            const accessible = isStepAccessible(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex flex-col items-center",
                  accessible && onStepClick && "cursor-pointer",
                )}
                onClick={() =>
                  accessible && onStepClick && onStepClick(step.id)
                }
              >
                <motion.div
                  whileHover={accessible ? { scale: 1.1 } : {}}
                  whileTap={accessible ? { scale: 0.95 } : {}}
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    active && "bg-primary-500 text-white scale-110 shadow-lg",
                    completed && !active && "bg-green-500 text-white",
                    !active &&
                      !completed &&
                      "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600",
                    !accessible && "opacity-50",
                  )}
                >
                  {completed && !active ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.div>

                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      active && "text-primary-600 dark:text-primary-400",
                      completed &&
                        !active &&
                        "text-green-600 dark:text-green-400",
                      !active &&
                        !completed &&
                        "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
