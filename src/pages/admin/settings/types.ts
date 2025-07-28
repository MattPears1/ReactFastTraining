export interface BusinessSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  registrationNumber: string;
}

export interface CourseSettings {
  maxParticipants: number;
  minParticipants: number;
  bookingDeadlineDays: number;
  cancellationDeadlineDays: number;
  locations: string[];
  defaultInstructor: string;
  sessionDuration: number;
}

export interface NotificationSettings {
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  reminderHoursBefore: number;
  cancellationNotice: boolean;
  marketingEmails: boolean;
  adminAlerts: boolean;
  lowCapacityAlert: boolean;
  lowCapacityThreshold: number;
}

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  allowPartialPayments: boolean;
  partialPaymentPercentage: number;
  refundPolicy: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  ipWhitelist: string[];
}

export type SettingsSection = 'business' | 'course' | 'notifications' | 'security' | 'payment';