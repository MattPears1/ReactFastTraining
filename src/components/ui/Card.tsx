import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@utils/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?:
    | "default"
    | "bordered"
    | "elevated"
    | "ghost"
    | "3d"
    | "brutalist"
    | "glass";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  depth?: "shallow" | "medium" | "deep";
  gradient?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  depth = "medium",
  gradient = false,
  className,
  ...props
}) => {
  const variants = {
    default:
      "bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-300",
    bordered:
      "bg-white/50 dark:bg-gray-800/50 border-2 border-primary-200 dark:border-primary-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-300",
    elevated: "bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow duration-300",
    ghost:
      "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-300",
    "3d": "bg-white dark:bg-gray-800 shadow-2xl transform-gpu perspective-1000",
    brutalist:
      "bg-white dark:bg-gray-900 border-4 border-primary-900 dark:border-primary-400",
    glass:
      "bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300",
  };

  const paddings = {
    none: "",
    sm: "p-4 sm:p-3 md:p-4",
    md: "p-5 sm:p-4 md:p-6",
    lg: "p-6 sm:p-5 md:p-8",
    xl: "p-8 sm:p-6 md:p-10",
  };

  const depthStyles = {
    shallow: "hover:translate-z-2",
    medium: "hover:translate-z-4",
    deep: "hover:translate-z-8",
  };

  const card3DStyles =
    variant === "3d"
      ? {
          whileHover: {
            rotateX: -10,
            rotateY: 10,
            scale: 1.05,
            z: 50,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 10,
            },
          },
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 20,
          },
        }
      : {};

  const brutalistStyles =
    variant === "brutalist"
      ? {
          whileHover: {
            x: -8,
            y: -8,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 20,
            },
          },
        }
      : {};

  return (
    <motion.div
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300 group",
        variants[variant],
        paddings[padding],
        hover &&
          "hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-pointer",
        variant === "3d" && "card-3d preserve-3d transform-style-preserve-3d",
        variant === "brutalist" &&
          "shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]",
        variant === "brutalist" &&
          hover &&
          "hover:shadow-[12px_12px_0_0_#000] dark:hover:shadow-[12px_12px_0_0_#fff]",
        depthStyles[depth],
        className,
      )}
      {...props}
      {...(variant === "3d" ? card3DStyles : {})}
      {...(variant === "brutalist" ? brutalistStyles : {})}
    >
      {/* Hover shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
      </div>

      {/* Yorkshire-inspired gradient overlay */}
      {gradient && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary-500/8 via-transparent to-secondary-500/8 pointer-events-none"
          animate={{ 
            backgroundPosition: hover ? ["0% 0%", "100% 100%"] : "0% 0%",
          }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        />
      )}

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-300">
        <div className="absolute inset-0 medical-pattern" />
      </div>

      {/* Glass effect highlight */}
      {variant === "glass" && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
          animate={{ opacity: hover ? 0.2 : 0.1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* 3D depth layers */}
      {variant === "3d" && (
        <>
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent"
            style={{ transform: "translateZ(2px)" }}
          />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tl from-secondary-500/10 to-transparent"
            style={{ transform: "translateZ(4px)" }}
          />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default Card;
