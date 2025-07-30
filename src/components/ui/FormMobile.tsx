import React from "react";
import { cn } from "@utils/cn";

// Mobile-optimized form field wrapper
export const FormField: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("mb-6", className)}>{children}</div>
);

// Mobile-optimized label
export const FormLabel: React.FC<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ htmlFor, required, children, className }) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      "block text-base font-medium text-gray-700 dark:text-gray-300 mb-2",
      className,
    )}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// Mobile-optimized input
export const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, error, icon, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      </div>
    )}
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-lg border px-4 py-3",
        "text-base placeholder:text-gray-400",
        "min-h-[48px]",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "transition-colors duration-200",
        icon && "pl-10",
        error
          ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
          : "border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500",
        "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
        className,
      )}
      {...props}
    />
  </div>
));

FormInput.displayName = "FormInput";

// Mobile-optimized select
export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: boolean;
    placeholder?: string;
  }
>(({ className, error, placeholder, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block w-full rounded-lg border px-4 py-3",
      "text-base",
      "min-h-[48px]",
      "appearance-none",
      "bg-white dark:bg-gray-800",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transition-colors duration-200",
      error
        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500",
      "dark:border-gray-600 dark:text-gray-100",
      className,
    )}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {children}
  </select>
));

FormSelect.displayName = "FormSelect";

// Mobile-optimized textarea
export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
  }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "block w-full rounded-lg border px-4 py-3",
      "text-base placeholder:text-gray-400",
      "min-h-[100px]",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transition-colors duration-200",
      "resize-y",
      error
        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500",
      "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
      className,
    )}
    {...props}
  />
));

FormTextarea.displayName = "FormTextarea";

// Mobile-optimized checkbox
export const FormCheckbox: React.FC<{
  id?: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: boolean;
  className?: string;
}> = ({ id, label, checked, onChange, error, className }) => (
  <div className={cn("flex items-start", className)}>
    <div className="flex items-center h-6">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={cn(
          "w-5 h-5 rounded",
          "text-primary-600 focus:ring-2 focus:ring-primary-500",
          "border-gray-300 dark:border-gray-600",
          "dark:bg-gray-800",
          error && "border-red-300",
          "cursor-pointer",
        )}
      />
    </div>
    <label
      htmlFor={id}
      className="ml-3 text-base text-gray-700 dark:text-gray-300 cursor-pointer select-none"
    >
      {label}
    </label>
  </div>
);

// Mobile-optimized radio button
export const FormRadio: React.FC<{
  id?: string;
  name: string;
  label: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}> = ({ id, name, label, value, checked, onChange, className }) => (
  <div className={cn("flex items-start", className)}>
    <div className="flex items-center h-6">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-5 h-5",
          "text-primary-600 focus:ring-2 focus:ring-primary-500",
          "border-gray-300 dark:border-gray-600",
          "dark:bg-gray-800",
          "cursor-pointer",
        )}
      />
    </div>
    <label
      htmlFor={id}
      className="ml-3 text-base text-gray-700 dark:text-gray-300 cursor-pointer select-none"
    >
      {label}
    </label>
  </div>
);

// Mobile-optimized error message
export const FormError: React.FC<{
  message?: string;
  className?: string;
}> = ({ message, className }) => {
  if (!message) return null;

  return (
    <p className={cn("mt-2 text-sm text-red-600 dark:text-red-400", className)}>
      {message}
    </p>
  );
};

// Mobile-optimized helper text
export const FormHelperText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn("mt-2 text-sm text-gray-500 dark:text-gray-400", className)}>
    {children}
  </p>
);

// Mobile-optimized form group for radio/checkbox groups
export const FormGroup: React.FC<{
  legend?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ legend, children, className }) => (
  <fieldset className={cn("space-y-3", className)}>
    {legend && (
      <legend className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
        {legend}
      </legend>
    )}
    {children}
  </fieldset>
);

// Mobile-optimized form actions (button group)
export const FormActions: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "stretch";
}> = ({ children, className, align = "stretch" }) => (
  <div
    className={cn(
      "mt-8 flex gap-3",
      {
        "justify-start": align === "left",
        "justify-center": align === "center",
        "justify-end": align === "right",
        "flex-col sm:flex-row": align === "stretch",
      },
      className,
    )}
  >
    {children}
  </div>
);
