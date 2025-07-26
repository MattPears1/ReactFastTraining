import React from 'react'
import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '20px'),
  }

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
    />
  )
}

// Composite skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  )
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm', className)}>
      <Skeleton variant="rectangular" height={200} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <SkeletonText lines={2} className="mb-4" />
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" />
        <div className="flex-1">
          <Skeleton variant="text" width="50%" className="mb-1" />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
    </div>
  )
}

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4,
  className 
}) => {
  return (
    <div className={cn('overflow-hidden', className)}>
      <table className="w-full">
        <thead>
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="p-4">
                <Skeleton variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700">
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton variant="text" width={colIndex === 0 ? '60%' : '80%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({ 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  }

  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  )
}

export const SkeletonButton: React.FC<{ width?: string | number; className?: string }> = ({ 
  width = 120,
  className 
}) => {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={40}
      className={className}
    />
  )
}

export const SkeletonImage: React.FC<{ 
  width?: string | number; 
  height?: string | number; 
  className?: string 
}> = ({ 
  width = '100%',
  height = 200,
  className 
}) => {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
    />
  )
}

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3,
  className 
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonAvatar />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="100%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton