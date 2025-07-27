import type {
  UserStats,
  NextCourse,
  UpcomingCourse,
  SpecialRequirement,
  PreCourseMaterial,
  ClientPortalState
} from './portal.types';
import type {
  BookingHistoryItem,
  BookingDetails,
  BookingAttendee,
  AttendanceRecord,
  PaginationInfo
} from './booking.types';

// Discriminated unions for async states
export type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Enhanced types with stricter constraints
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';
export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type RefundStatus = 'pending' | 'processed' | 'rejected';
export type RequirementCategory = 'medical' | 'dietary' | 'accessibility' | 'other';
export type AttendanceStatus = 'present' | 'absent';

// Type guards
export const isBookingStatus = (value: unknown): value is BookingStatus => {
  return typeof value === 'string' && 
    ['confirmed', 'pending', 'cancelled'].includes(value);
};

export const isSessionStatus = (value: unknown): value is SessionStatus => {
  return typeof value === 'string' && 
    ['scheduled', 'in-progress', 'completed', 'cancelled'].includes(value);
};

export const isPaymentStatus = (value: unknown): value is PaymentStatus => {
  return typeof value === 'string' && 
    ['pending', 'completed', 'failed'].includes(value);
};

export const isRefundStatus = (value: unknown): value is RefundStatus => {
  return typeof value === 'string' && 
    ['pending', 'processed', 'rejected'].includes(value);
};

export const isRequirementCategory = (value: unknown): value is RequirementCategory => {
  return typeof value === 'string' && 
    ['medical', 'dietary', 'accessibility', 'other'].includes(value);
};

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus => {
  return typeof value === 'string' && 
    ['present', 'absent'].includes(value);
};

// Complex type guards
export const isUserStats = (value: unknown): value is UserStats => {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Record<string, unknown>;
  
  return (
    typeof stats.totalBookings === 'number' &&
    typeof stats.completedCourses === 'number' &&
    typeof stats.totalAttendees === 'number' &&
    typeof stats.certificatesEarned === 'number'
  );
};

export const isNextCourse = (value: unknown): value is NextCourse => {
  if (!value || typeof value !== 'object') return false;
  const course = value as Record<string, unknown>;
  
  return (
    course.booking && typeof course.booking === 'object' &&
    course.session && typeof course.session === 'object' &&
    typeof course.attendeeCount === 'number' &&
    typeof course.daysUntil === 'number' &&
    typeof course.isToday === 'boolean' &&
    typeof course.isTomorrow === 'boolean' &&
    typeof course.isThisWeek === 'boolean'
  );
};

export const isUpcomingCourse = (value: unknown): value is UpcomingCourse => {
  if (!value || typeof value !== 'object') return false;
  const course = value as Record<string, unknown>;
  
  return (
    course.booking && typeof course.booking === 'object' &&
    course.session && typeof course.session === 'object' &&
    typeof course.attendeeCount === 'number'
  );
};

export const isPreCourseMaterial = (value: unknown): value is PreCourseMaterial => {
  if (!value || typeof value !== 'object') return false;
  const material = value as Record<string, unknown>;
  
  return (
    typeof material.id === 'string' &&
    typeof material.title === 'string' &&
    typeof material.description === 'string' &&
    typeof material.fileUrl === 'string' &&
    typeof material.isRequired === 'boolean' &&
    typeof material.viewed === 'boolean'
  );
};

export const isBookingHistoryItem = (value: unknown): value is BookingHistoryItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  
  return (
    item.booking && typeof item.booking === 'object' &&
    item.session && typeof item.session === 'object' &&
    typeof item.attendeeCount === 'number' &&
    typeof item.hasSpecialRequirements === 'boolean' &&
    typeof item.certificateAvailable === 'boolean'
  );
};

// Utility types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationInfo;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  rule?: string;
}

export type ValidationResult<T> = 
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };

// Enhanced error types
export class ClientPortalError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ClientPortalError';
  }
}

export class NetworkError extends ClientPortalError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ClientPortalError {
  constructor(public errors: ValidationError[]) {
    super('Validation failed', 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

// Type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybeAsync<T> = T | Promise<T>;

// Date utilities
export interface DateRange {
  start: Date;
  end: Date;
}

export const isValidDateRange = (value: unknown): value is DateRange => {
  if (!value || typeof value !== 'object') return false;
  const range = value as Record<string, unknown>;
  
  return (
    range.start instanceof Date &&
    range.end instanceof Date &&
    range.start <= range.end
  );
};

// Hook return types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UsePaginatedReturn<T> extends UseAsyncReturn<T[]> {
  pagination: PaginationInfo | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

// Action types for reducers
export type ClientPortalAction<T extends string, P = void> = P extends void
  ? { type: T }
  : { type: T; payload: P };

// Helper for creating action creators
export const createAction = <T extends string, P = void>(
  type: T
): ((payload: P) => ClientPortalAction<T, P>) => {
  return (payload: P) => ({ type, payload } as ClientPortalAction<T, P>);
};