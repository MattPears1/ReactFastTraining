import React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'

interface TrackedLinkProps extends LinkProps {
  eventCategory?: string
  eventAction?: string
  eventLabel?: string
  eventValue?: number
  trackingProps?: Record<string, any>
  external?: boolean
}

export const TrackedLink: React.FC<TrackedLinkProps> = ({
  eventCategory = 'link',
  eventAction = 'click',
  eventLabel,
  eventValue,
  trackingProps,
  external = false,
  onClick,
  children,
  to,
  ...props
}) => {
  const { trackEvent } = useAnalytics()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Track the event
    trackEvent({
      category: eventCategory,
      action: eventAction,
      label: eventLabel || (typeof to === 'string' ? to : 'link'),
      value: eventValue,
      properties: {
        ...trackingProps,
        destination: to,
        external
      }
    })

    // Call original onClick handler
    onClick?.(e)
  }

  if (external && typeof to === 'string') {
    return (
      <a 
        href={to} 
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <Link {...props} to={to} onClick={handleClick}>
      {children}
    </Link>
  )
}