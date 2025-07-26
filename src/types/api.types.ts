// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: User
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

// Course Types
export interface Course {
  id: string
  title: string
  description: string
  duration: string
  price: number
  category: string
  certificationValidity: string
  maxParticipants: number
  createdAt: string
  updatedAt: string
}

export interface CourseSession {
  id: string
  courseId: string
  date: string
  startTime: string
  endTime: string
  venue: string
  availableSpots: number
  status: 'scheduled' | 'completed' | 'cancelled'
}

// Booking Types
export interface BookingData {
  courseId: string
  sessionId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName?: string
  numberOfParticipants: number
  participants: ParticipantDetail[]
  specialRequirements?: string
  termsAccepted: boolean
}

export interface ParticipantDetail {
  firstName: string
  lastName: string
  dietaryRequirements?: string
  medicalConditions?: string
}

export interface Booking {
  id: string
  confirmationCode: string
  courseId: string
  sessionId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName?: string
  numberOfParticipants: number
  participants: ParticipantDetail[]
  specialRequirements?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  totalAmount: number
  createdAt: string
  updatedAt: string
}

// Contact Types
export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  course?: string
  message: string
  gdprConsent: boolean
}

export interface EnquiryData {
  name: string
  email: string
  phone?: string
  company?: string
  message: string
  courseInterest?: string
}

// Newsletter Types
export interface NewsletterData {
  email: string
  firstName?: string
  gdprConsent: boolean
}

// Analytics Types
export interface AnalyticsEvent {
  category: string
  action: string
  label?: string
  value?: number
}

export interface ConversionEvent {
  type: 'form_submission' | 'booking_completed' | 'newsletter_signup'
  value?: number
  currency?: string
  metadata?: Record<string, any>
}