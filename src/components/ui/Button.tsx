import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@utils/cn'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  href?: string
  external?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      href,
      external,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden'
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
      outline: 'border-2 border-current hover:bg-gray-50 dark:hover:bg-gray-800',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500',
      success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500',
    }
    
    const sizes = {
      sm: 'px-3 py-2.5 sm:py-1.5 text-sm rounded-md gap-1.5 min-h-[44px] sm:min-h-0',
      md: 'px-4 py-3 sm:py-2 text-sm rounded-lg gap-2 min-h-[44px] sm:min-h-0',
      lg: 'px-5 sm:px-6 py-3.5 sm:py-3 text-base rounded-lg gap-2 min-h-[48px] sm:min-h-0',
      xl: 'px-6 sm:px-8 py-4 text-base sm:text-lg rounded-xl gap-3 min-h-[52px] sm:min-h-0',
    }
    
    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    }
    
    const loadingIconSize = iconSizes[size]
    
    const buttonClasses = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )
    
    const content = (
      <>
        {loading ? (
          <span
            className={cn(
              'animate-spin border-2 border-current border-t-transparent rounded-full',
              loadingIconSize
            )}
          />
        ) : leftIcon ? (
          <span className={loadingIconSize}>{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className={loadingIconSize}>{rightIcon}</span>
        )}
      </>
    )
    
    if (href && !disabled) {
      if (external) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses}
          >
            {content}
          </a>
        )
      }
      
      return (
        <Link to={href} className={buttonClasses}>
          {content}
        </Link>
      )
    }
    
    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        {content}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button