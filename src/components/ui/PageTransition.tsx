import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import ProgressBar from './ProgressBar'

interface PageTransitionProps {
  children: React.ReactNode
  variant?: 'fade' | 'slide' | 'scale' | 'rotate' | 'curtain'
  duration?: number
  showProgress?: boolean
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fade',
  duration = 0.3,
  showProgress = true,
}) => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    // Simulate page loading progress
    const intervals = [
      setTimeout(() => setProgress(30), 100),
      setTimeout(() => setProgress(60), 200),
      setTimeout(() => setProgress(90), 300),
      setTimeout(() => {
        setProgress(100)
        setTimeout(() => setIsLoading(false), 100)
      }, 400),
    ]

    return () => intervals.forEach(clearTimeout)
  }, [location.pathname])

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.2, opacity: 0 },
    },
    rotate: {
      initial: { rotate: -180, opacity: 0 },
      animate: { rotate: 0, opacity: 1 },
      exit: { rotate: 180, opacity: 0 },
    },
    curtain: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  }

  return (
    <>
      {showProgress && isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <ProgressBar
            value={progress}
            size="xs"
            variant="primary"
            animated
          />
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={variants[variant]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// Route-specific loading screens
export const RouteLoader: React.FC<{
  message?: string
  showSpinner?: boolean
}> = ({ message = 'Loading...', showSpinner = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
    >
      <div className="text-center">
        {showSpinner && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full mx-auto mb-4"
          />
        )}
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </motion.div>
  )
}

// Skeleton page loader
export const PageSkeleton: React.FC<{
  variant?: 'article' | 'grid' | 'form' | 'dashboard'
}> = ({ variant = 'article' }) => {
  if (variant === 'article') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return null
}

// Loading overlay for sections
export const SectionLoader: React.FC<{
  loading?: boolean
  overlay?: boolean
  children: React.ReactNode
}> = ({ loading = false, overlay = true, children }) => {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              overlay ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm' : ''
            )}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Import cn utility
import { cn } from '@/utils/cn'

export default PageTransition