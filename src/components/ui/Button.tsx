import React, { forwardRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion'
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

interface Ripple {
  x: number
  y: number
  id: number
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
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Ripple[]>([])
    
    const createRipple = (event: React.MouseEvent<HTMLElement>) => {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const ripple = { x, y, id: Date.now() }
      
      setRipples([...ripples, ripple])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id))
      }, 600)

      if (onClick && !href) {
        onClick(event as any)
      }
    }
    const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:-translate-y-0.5 active:translate-y-0'
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-blue hover:shadow-lg transition-all focus-visible:ring-primary-500',
      secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 shadow-green hover:shadow-lg transition-all focus-visible:ring-secondary-500',
      outline: 'border-2 border-primary-400 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-500 transition-all',
      ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all',
      danger: 'bg-gray-100 text-error border border-error/20 hover:bg-error/10 hover:border-error/40 focus-visible:ring-error/50 transition-all',
      success: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 shadow-green hover:shadow-lg transition-all focus-visible:ring-secondary-500',
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
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
        onClick={createRipple}
        {...props}
      >
        {content}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button