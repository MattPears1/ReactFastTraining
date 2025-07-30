// Comprehensive type definitions for schedule management

export interface CapacityInfo {
  maxCapacity: number;
  currentBookings: number;
  confirmedAttendees: number;
  waitlistCount: number;
  availableSpots: number;
  capacityPercentage: number;
}

export interface EditableSessionFields {
  // Schedule
  date: Date;
  startTime: string;
  endTime: string;

  // Details
  maxCapacity: number;
  location: string;
  instructor: string;
  price: number;

  // Settings
  allowWaitlist: boolean;
  autoConfirmBookings: boolean;
  requiresPaymentUpfront: boolean;

  // Content
  description: string;
  specialInstructions: string;
  cancellationPolicy: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface SessionChangeLog {
  id: string;
  timestamp: Date;
  user: string;
  action:
    | "created"
    | "updated"
    | "cancelled"
    | "email_sent"
    | "booking_added"
    | "booking_cancelled";
  field?: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

export interface NotificationSettings {
  sendToAttendees: boolean;
  sendToWaitlist: boolean;
  includeCalendarInvite: boolean;
  customMessage?: string;
}

export interface BulkAction {
  type: "email" | "export" | "cancel" | "move_to_waitlist";
  targetBookings: string[];
  options?: any;
}

export interface SessionStats {
  revenue: {
    total: number;
    confirmed: number;
    pending: number;
    refunded: number;
  };
  attendance: {
    confirmed: number;
    pending: number;
    cancelled: number;
    noShow: number;
  };
  performance: {
    fillRate: number;
    cancellationRate: number;
    noShowRate: number;
    averageBookingLeadTime: number;
  };
}

export interface SessionFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  instructor?: string[];
  location?: string[];
  course?: string[];
  minCapacity?: number;
  maxCapacity?: number;
}

export interface SessionExportOptions {
  format: "csv" | "pdf" | "excel";
  includeAttendees: boolean;
  includeFinancials: boolean;
  includeNotes: boolean;
  dateFormat: string;
}

export type SessionViewMode = "details" | "edit" | "preview";

export interface SessionPageState {
  viewMode: SessionViewMode;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  selectedBookings: string[];
  expandedSections: string[];
  activeTab: "info" | "attendees" | "financial" | "activity";
}

// Re-export types from service for convenience
export type {
  SessionDetails,
  BookingDetails,
  Trainer,
  Location,
  Course,
  UpdateSessionData,
  SessionConflict,
  EmailAttendeesData,
  SessionActivity,
  SessionSummary,
} from "../services/admin-schedule.service";
