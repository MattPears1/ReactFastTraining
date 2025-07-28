import React from "react";
import { motion } from "framer-motion";

export const SuccessCheckmark: React.FC<{ size?: number }> = ({
  size = 80,
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" className="mx-auto">
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        d="M14 27l8 8 16-16"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
}> = ({ progress, className = "" }) => {
  return (
    <div
      className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};
