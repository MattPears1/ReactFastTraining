import { useEffect } from 'react'
import { analytics } from '@/services/analytics/analytics.service'
import { getCookieConsent } from '@/components/ui/CookieConsent'
import { usePageTracking, useErrorTracking, usePerformanceTracking, useEngagementTracking, useScrollTracking } from '@/hooks/useAnalytics'

interface AnalyticsProviderProps {
  children: React.ReactNode
  measurementId?: string
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ 
  children, 
  measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX' 
}) => {
  // Initialize analytics
  useEffect(() => {
    analytics.initialize(measurementId)

    // Listen for consent changes
    const handleConsentChange = () => {
      analytics.updateConsent()
    }

    window.addEventListener('cookie-consent-updated', handleConsentChange)

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentChange)
    }
  }, [measurementId])

  // Set up automatic tracking
  usePageTracking()
  useErrorTracking()
  usePerformanceTracking()
  useEngagementTracking()
  useScrollTracking()

  return <>{children}</>
}

// Helper component for tracking authenticated users
interface UserTrackingProps {
  userId: string
  userProperties?: Record<string, any>
}

export const UserTracking: React.FC<UserTrackingProps> = ({ userId, userProperties }) => {
  useEffect(() => {
    if (userId) {
      analytics.setUser(userId, userProperties)
    }

    return () => {
      analytics.clearUser()
    }
  }, [userId, userProperties])

  return null
}