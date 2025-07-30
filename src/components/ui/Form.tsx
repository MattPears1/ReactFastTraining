import React from "react";
import { motion } from "framer-motion";
import { cn } from "@utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className,
  htmlFor,
  helpText,
}) => {
  const fieldId = htmlFor || React.useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <motion.div 
      className={cn("form-group", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label htmlFor={fieldId} className="form-label text-base sm:text-sm">
        {label}
        {required && (
          <span className="text-error-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {helpText && (
        <p
          id={helpId}
          className="text-base sm:text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2"
        >
          {helpText}
        </p>
      )}
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        "aria-describedby":
          [helpText && helpId, error && errorId].filter(Boolean).join(" ") ||
          undefined,
        "aria-invalid": error ? "true" : undefined,
        "aria-required": required ? "true" : undefined,
      })}
      {error && (
        <motion.p 
          id={errorId} 
          className="form-error" 
          role="alert"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <motion.input
      className={cn(
        "form-input transition-all duration-300",
        error && "border-error-500 focus:border-error-500 focus:ring-error-500 animate-shake",
        isFocused && "shadow-lg",
        className,
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      whileFocus={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    />
  );
};

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  className,
  ...props
}) => {
  return (
    <textarea
      className={cn(
        "form-textarea",
        error && "border-error-500 focus:border-error-500 focus:ring-error-500",
        className,
      )}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  error,
  options,
  placeholder = "Select an option",
  className,
  ...props
}) => {
  return (
    <select
      className={cn(
        "form-select",
        error && "border-error-500 focus:border-error-500 focus:ring-error-500",
        className,
      )}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  ...props
}) => {
  const checkboxId = props.id || React.useId();
  const [isChecked, setIsChecked] = React.useState(props.checked || false);

  return (
    <motion.div 
      className={cn("flex items-center gap-3 group", className)}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative">
        <input
          id={checkboxId}
          type="checkbox"
          className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200"
          onChange={(e) => {
            setIsChecked(e.target.checked);
            props.onChange?.(e);
          }}
          {...props}
        />
        <motion.div 
          className="absolute inset-0 rounded bg-primary-500/20 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={isChecked ? { scale: 1.5, opacity: 0 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <label
        htmlFor={checkboxId}
        className="text-base sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 py-2 sm:py-0"
      >
        {label}
      </label>
    </motion.div>
  );
};

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio: React.FC<RadioProps> = ({ label, className, ...props }) => {
  const radioId = props.id || React.useId();
  const [isSelected, setIsSelected] = React.useState(props.checked || false);

  return (
    <motion.div 
      className={cn("flex items-center gap-3 group", className)}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative">
        <input
          id={radioId}
          type="radio"
          className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200"
          onChange={(e) => {
            setIsSelected(e.target.checked);
            props.onChange?.(e);
          }}
          {...props}
        />
        <motion.div 
          className="absolute inset-0 rounded-full bg-primary-500/20 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={isSelected ? { scale: 1.5, opacity: 0 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <label
        htmlFor={radioId}
        className="text-base sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 py-2 sm:py-0"
      >
        {label}
      </label>
    </motion.div>
  );
};
