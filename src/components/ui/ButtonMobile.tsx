import React from "react";
import { motion } from "framer-motion";
import { cn } from "@utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const ButtonMobile = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = "left",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-95
    `;

    const variants = {
      primary: `
        bg-primary-600 text-white 
        hover:bg-primary-700 
        focus:ring-primary-500
        dark:bg-primary-500 dark:hover:bg-primary-600
      `,
      secondary: `
        bg-secondary-600 text-white 
        hover:bg-secondary-700 
        focus:ring-secondary-500
        dark:bg-secondary-500 dark:hover:bg-secondary-600
      `,
      outline: `
        border-2 border-gray-300 text-gray-700 bg-transparent
        hover:bg-gray-50 hover:border-gray-400
        focus:ring-gray-500
        dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800
      `,
      ghost: `
        text-gray-700 bg-transparent
        hover:bg-gray-100
        focus:ring-gray-500
        dark:text-gray-300 dark:hover:bg-gray-800
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700
        focus:ring-red-500
        dark:bg-red-500 dark:hover:bg-red-600
      `,
    };

    // Mobile-optimized sizes with minimum touch targets
    const sizes = {
      sm: "text-sm px-4 py-2 min-h-[44px] min-w-[44px]",
      md: "text-base px-6 py-3 min-h-[48px] min-w-[48px]",
      lg: "text-lg px-8 py-4 min-h-[56px] min-w-[56px]",
    };

    // Mobile-specific responsive adjustments
    const mobileStyles = `
      ${size === "sm" ? "text-base sm:text-sm" : ""}
      ${size === "md" ? "text-base sm:text-base" : ""}
      ${size === "lg" ? "text-lg sm:text-lg" : ""}
    `;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          mobileStyles,
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="mr-2 flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="ml-2 flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  },
);

ButtonMobile.displayName = "ButtonMobile";

export default ButtonMobile;

// Export a set of pre-configured mobile buttons
export const MobileButtons = {
  Primary: (props: Omit<ButtonProps, "variant">) => (
    <ButtonMobile variant="primary" {...props} />
  ),
  Secondary: (props: Omit<ButtonProps, "variant">) => (
    <ButtonMobile variant="secondary" {...props} />
  ),
  Outline: (props: Omit<ButtonProps, "variant">) => (
    <ButtonMobile variant="outline" {...props} />
  ),
  Ghost: (props: Omit<ButtonProps, "variant">) => (
    <ButtonMobile variant="ghost" {...props} />
  ),
  Danger: (props: Omit<ButtonProps, "variant">) => (
    <ButtonMobile variant="danger" {...props} />
  ),
  FullWidth: (props: ButtonProps) => <ButtonMobile fullWidth {...props} />,
};
