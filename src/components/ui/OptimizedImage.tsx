import React from 'react'
import { cn } from '@utils/cn'
import { useLazyImage } from '@hooks/useLazyLoad'
import Skeleton from './Skeleton'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number | string
  height?: number | string
  placeholder?: string
  sizes?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23f3f4f6"/%3E%3C/svg%3E',
  sizes,
  priority = false,
  onLoad,
  onError,
}) => {
  const { ref, src: imageSrc, isLoading, error } = useLazyImage(
    priority ? src : '', // If priority, load immediately
    placeholder
  )

  // For priority images, load immediately
  React.useEffect(() => {
    if (priority && src) {
      const img = new Image()
      img.src = src
    }
  }, [priority, src])

  if (error) {
    return (
      <div 
        className={cn(
          'bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          Failed to load image
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {isLoading && !priority && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <img
        ref={ref}
        src={priority ? src : imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading && !priority ? 'opacity-0' : 'opacity-100'
        )}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => {
          onLoad?.()
        }}
        onError={() => {
          onError?.()
        }}
      />
    </div>
  )
}

export default React.memo(OptimizedImage)