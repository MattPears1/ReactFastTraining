import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success:
    "bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/10 text-secondary-800 dark:text-secondary-200 border-secondary-300 dark:border-secondary-700",
  error:
    "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 border-error/20 dark:border-error/20",
  warning:
    "bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/10 text-accent-800 dark:text-accent-200 border-accent-300 dark:border-accent-700",
  info: "bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-800 dark:text-primary-200 border-primary-300 dark:border-primary-700",
};

const iconColors = {
  success: "text-secondary-600 dark:text-secondary-400",
  error: "text-error dark:text-error-light",
  warning: "text-accent-600 dark:text-accent-400",
  info: "text-primary-600 dark:text-primary-400",
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const Icon = icons[type];
  const [progress, setProgress] = React.useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - (100 / (duration / 100));
        });
      }, 100);

      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "pointer-events-auto w-[calc(100vw-2rem)] sm:w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm relative",
        "transition-all duration-300 hover:shadow-xl",
        colors[type],
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className={clsx("h-6 w-6", iconColors[type])} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-base sm:text-sm font-medium">{title}</p>
            {message && <p className="mt-1 text-base sm:text-sm opacity-90 break-words">{message}</p>}
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <motion.button
              className="inline-flex rounded-md p-2 sm:p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 items-center justify-center"
              onClick={() => onClose(id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className={clsx(
              "h-full transition-all duration-100",
              type === "success" && "bg-secondary-500",
              type === "error" && "bg-red-500",
              type === "warning" && "bg-accent-500",
              type === "info" && "bg-primary-500"
            )}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = "top-right",
}) => {
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-center": "top-0 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={clsx(
        "pointer-events-none fixed z-50 flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 w-full sm:w-auto",
        positionClasses[position],
        "safe-area-inset",
      )}
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
