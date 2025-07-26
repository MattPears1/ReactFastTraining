import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@utils/cn'
import { useMagneticEffect } from '@hooks/useAnimation'
import { ButtonProps } from './Button'

const MagneticButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const { ref: magneticRef, position } = useMagneticEffect()
    
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
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-3 text-base rounded-lg gap-2',
      xl: 'px-8 py-4 text-lg rounded-xl gap-3',
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
    
    return (
      <motion.button
        ref={(node) => {
          // Combine refs
          if (ref) {
            if (typeof ref === 'function') ref(node)
            else ref.current = node
          }
          if (magneticRef.current !== node) {
            magneticRef.current = node
          }
        }}
        className={buttonClasses}
        disabled={disabled || loading}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
        {...props}
      >
        {/* Liquid effect background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 opacity-0"
          whileHover={{ opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Ripple effect container */}
        <motion.div
          className="absolute inset-0"
          onTap={(e) => {
            const button = e.currentTarget
            const rect = button.getBoundingClientRect()
            const ripple = document.createElement('span')
            const size = Math.max(rect.width, rect.height)
            const x = e.clientX - rect.left - size / 2
            const y = e.clientY - rect.top - size / 2
            
            ripple.style.width = ripple.style.height = size + 'px'
            ripple.style.left = x + 'px'
            ripple.style.top = y + 'px'
            ripple.className = 'absolute rounded-full bg-white/30 animate-ripple pointer-events-none'
            
            button.appendChild(ripple)
            
            setTimeout(() => {
              ripple.remove()
            }, 600)
          }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <span
              className={cn(
                'animate-spin border-2 border-current border-t-transparent rounded-full',
                loadingIconSize
              )}
            />
          ) : leftIcon ? (
            <motion.span 
              className={loadingIconSize}
              animate={{ rotate: position.x * 0.5 }}
            >
              {leftIcon}
            </motion.span>
          ) : null}
          
          <motion.span
            animate={{ 
              letterSpacing: position.x !== 0 || position.y !== 0 ? '0.05em' : '0em' 
            }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
          
          {!loading && rightIcon && (
            <motion.span 
              className={loadingIconSize}
              animate={{ rotate: -position.x * 0.5 }}
            >
              {rightIcon}
            </motion.span>
          )}
        </span>
        
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
            opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    )
  }
)

MagneticButton.displayName = 'MagneticButton'

// Pre-styled magnetic button variants
export const MagneticButtonVariants = {
  // Neon glow button
  neon: (props: ButtonProps) => (
    <MagneticButton
      {...props}
      className={cn(
        props.className,
        'relative group',
        'before:absolute before:inset-0 before:rounded-lg before:p-[2px]',
        'before:bg-gradient-to-r before:from-primary-400 before:to-secondary-400',
        'before:animate-pulse before:-z-10 before:blur-sm',
        'hover:before:blur-md'
      )}
    />
  ),
  
  // Liquid morph button
  liquid: (props: ButtonProps) => (
    <MagneticButton
      {...props}
      className={cn(
        props.className,
        'group relative overflow-visible',
        'before:absolute before:inset-0 before:rounded-lg',
        'before:bg-gradient-to-r before:from-primary-500 before:to-secondary-500',
        'before:scale-0 before:opacity-50',
        'hover:before:scale-110 hover:before:opacity-100',
        'before:transition-all before:duration-500 before:ease-out',
        'before:-z-10 before:blur-xl'
      )}
    />
  ),
  
  // Brutalist magnetic button
  brutalist: (props: ButtonProps) => (
    <MagneticButton
      {...props}
      className={cn(
        props.className,
        'bg-black text-white border-4 border-black',
        'shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000]',
        'hover:translate-x-[-4px] hover:translate-y-[-4px]',
        'active:shadow-[4px_4px_0_0_#000]',
        'active:translate-x-[4px] active:translate-y-[4px]',
        'transition-all duration-200'
      )}
      variant="ghost"
    />
  ),
}

// Add ripple animation to global CSS
const style = document.createElement('style')
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .animate-ripple {
    animation: ripple 0.6s ease-out;
  }
`
document.head.appendChild(style)

export default MagneticButton