export * from './courses'

// Form constants
export const GDPR_CONSENT_TEXT = 'I agree to the Privacy Policy and Terms of Service. My data will be processed in accordance with GDPR regulations.'

// Animation constants
export const FADE_IN_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const SLIDE_IN_VARIANTS = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

export const SCALE_IN_VARIANTS = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

// Timing constants
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5
}

export const DEBOUNCE_DELAY = {
  search: 300,
  resize: 150,
  scroll: 100
}

// Validation constants
export const VALIDATION_RULES = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^[\d\s()+-]+$/,
  postcode: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
}

// Error messages
export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  invalidPostcode: 'Please enter a valid UK postcode',
  networkError: 'Network error. Please check your connection and try again.',
  serverError: 'Server error. Please try again later.',
  genericError: 'Something went wrong. Please try again.'
}