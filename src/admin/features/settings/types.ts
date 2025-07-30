import { ReactNode } from "react";

export interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export interface GeneralSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  timezone: string;
  currency: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  newBookingAlert: boolean;
  cancellationAlert: boolean;
  paymentFailureAlert: boolean;
  dailyReport: boolean;
}

export interface BookingSettings {
  minBookingAdvance: string;
  maxBookingAdvance: string;
  cancellationDeadline: string;
  maxAttendeesPerBooking: string;
  allowWaitlist: boolean;
  automaticReminders: boolean;
}

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  enableTestMode: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  passwordComplexity: string;
  ipWhitelist: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  debugMode: boolean;
  enableApiAccess: boolean;
  autoBackup: boolean;
  backupFrequency: string;
}

export interface AllSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  booking: BookingSettings;
  payment: PaymentSettings;
  security: SecuritySettings;
  system: SystemSettings;
}