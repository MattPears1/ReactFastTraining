import React, { useEffect, useRef } from 'react'
import { useFormTracking } from '@/hooks/useAnalytics'

interface TrackedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formName: string
  trackStart?: boolean
  trackFieldErrors?: boolean
  onSubmitSuccess?: () => void
  onSubmitError?: (error: Error) => void
}

export const TrackedForm: React.FC<TrackedFormProps> = ({
  formName,
  trackStart = true,
  trackFieldErrors = true,
  onSubmitSuccess,
  onSubmitError,
  onSubmit,
  children,
  ...props
}) => {
  const { trackFormStart, trackFormComplete, trackFormError, trackFormAbandon } = useFormTracking(formName)
  const hasStarted = useRef(false)
  const hasCompleted = useRef(false)

  useEffect(() => {
    // Track form abandonment on unmount if form was started but not completed
    return () => {
      if (hasStarted.current && !hasCompleted.current) {
        trackFormAbandon()
      }
    }
  }, [trackFormAbandon])

  const handleFocus = () => {
    if (trackStart && !hasStarted.current) {
      hasStarted.current = true
      trackFormStart()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (onSubmit) {
        await onSubmit(e)
      }
      
      hasCompleted.current = true
      trackFormComplete()
      onSubmitSuccess?.()
    } catch (error) {
      trackFormError('submit', error instanceof Error ? error.message : 'Unknown error')
      onSubmitError?.(error instanceof Error ? error : new Error('Form submission failed'))
    }
  }

  const handleInvalid = (e: React.FormEvent<HTMLFormElement>) => {
    if (trackFieldErrors) {
      const target = e.target as HTMLInputElement
      const fieldName = target.name || target.id || 'unknown'
      const errorMessage = target.validationMessage || 'Validation failed'
      trackFormError(fieldName, errorMessage)
    }
  }

  return (
    <form
      {...props}
      onSubmit={handleSubmit}
      onFocus={handleFocus}
      onInvalid={handleInvalid}
    >
      {children}
    </form>
  )
}