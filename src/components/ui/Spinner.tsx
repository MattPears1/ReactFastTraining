import React from 'react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'current'
  variant?: 'circle' | 'dots' | 'bars' | 'pulse' | 'ring'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  variant = 'circle',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    white: 'text-white',
    current: 'text-current',
  }

  if (variant === 'circle') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div className="absolute inset-0">
          <svg
            className={cn('animate-spin', colorClasses[color])}
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
        </div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex gap-1', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              sizeClasses[size].split(' ')[0].replace('w-', 'w-').replace(/\d+/, (match) => String(parseInt(match) / 4)),
              sizeClasses[size].split(' ')[1].replace('h-', 'h-').replace(/\d+/, (match) => String(parseInt(match) / 4)),
              colorClasses[color].replace('text-', 'bg-')
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex gap-1', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-bars',
              colorClasses[color].replace('text-', 'bg-'),
              size === 'xs' && 'w-0.5 h-2',
              size === 'sm' && 'w-1 h-3',
              size === 'md' && 'w-1.5 h-4',
              size === 'lg' && 'w-2 h-6',
              size === 'xl' && 'w-3 h-8'
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping',
            colorClasses[color].replace('text-', 'bg-'),
            'opacity-75'
          )}
        />
        <div
          className={cn(
            'relative rounded-full',
            sizeClasses[size],
            colorClasses[color].replace('text-', 'bg-')
          )}
        />
      </div>
    )
  }

  if (variant === 'ring') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 animate-spin',
            colorClasses[color].replace('text-', 'border-'),
            'border-t-transparent'
          )}
        />
      </div>
    )
  }

  return null
}

// Loading overlay component
export const LoadingOverlay: React.FC<{
  visible?: boolean
  message?: string
  variant?: SpinnerProps['variant']
  fullScreen?: boolean
  className?: string
}> = ({
  visible = true,
  message,
  variant = 'circle',
  fullScreen = false,
  className,
}) => {
  if (!visible) return null

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0'

  return (
    <div
      className={cn(
        containerClasses,
        'flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="text-center">
        <Spinner size="lg" variant={variant} />
        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

// Inline loading component
export const InlineLoading: React.FC<{
  loading?: boolean
  message?: string
  className?: string
}> = ({
  loading = true,
  message = 'Loading...',
  className,
}) => {
  if (!loading) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size="sm" />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {message}
      </span>
    </div>
  )
}

// Button loading state
export const ButtonSpinner: React.FC<{
  loading?: boolean
  size?: SpinnerProps['size']
  color?: SpinnerProps['color']
}> = ({
  loading = true,
  size = 'sm',
  color = 'white',
}) => {
  if (!loading) return null

  return <Spinner size={size} color={color} variant="circle" />
}

export default Spinner