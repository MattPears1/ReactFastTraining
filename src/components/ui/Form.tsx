import React from 'react'
import { cn } from '@utils/cn'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  htmlFor?: string
  helpText?: string
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
  const fieldId = htmlFor || React.useId()
  const errorId = `${fieldId}-error`
  const helpId = `${fieldId}-help`
  
  return (
    <div className={cn('form-group', className)}>
      <label htmlFor={fieldId} className="form-label">
        {label}
        {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
      </label>
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {helpText}
        </p>
      )}
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': [helpText && helpId, error && errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
      })}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input: React.FC<InputProps> = ({
  error,
  className,
  ...props
}) => {
  return (
    <input
      className={cn(
        'form-input',
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
        className
      )}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  className,
  ...props
}) => {
  return (
    <textarea
      className={cn(
        'form-textarea',
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
        className
      )}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({
  error,
  options,
  placeholder = 'Select an option',
  className,
  ...props
}) => {
  return (
    <select
      className={cn(
        'form-select',
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
        className
      )}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  ...props
}) => {
  const checkboxId = props.id || React.useId()
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        id={checkboxId}
        type="checkbox"
        className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        {...props}
      />
      <label htmlFor={checkboxId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  )
}

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Radio: React.FC<RadioProps> = ({
  label,
  className,
  ...props
}) => {
  const radioId = props.id || React.useId()
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        id={radioId}
        type="radio"
        className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        {...props}
      />
      <label htmlFor={radioId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  )
}