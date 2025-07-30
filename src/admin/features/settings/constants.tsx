import React from "react";
import {
  Settings,
  Bell,
  Calendar,
  CreditCard,
  Shield,
  Database,
} from "lucide-react";
import { SettingSection } from "./types";

export const SETTING_SECTIONS: SettingSection[] = [
  {
    id: "general",
    title: "General Settings",
    description: "Basic configuration and company information",
    icon: <Settings className="admin-icon-md" />,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Email alerts and system notifications",
    icon: <Bell className="admin-icon-md" />,
  },
  {
    id: "booking",
    title: "Booking Settings",
    description: "Booking rules and availability",
    icon: <Calendar className="admin-icon-md" />,
  },
  {
    id: "payment",
    title: "Payment Settings",
    description: "Payment gateway and pricing",
    icon: <CreditCard className="admin-icon-md" />,
  },
  {
    id: "security",
    title: "Security",
    description: "Authentication and access control",
    icon: <Shield className="admin-icon-md" />,
  },
  {
    id: "system",
    title: "System",
    description: "Database and maintenance settings",
    icon: <Database className="admin-icon-md" />,
  },
];

export const DEFAULT_SETTINGS = {
  general: {
    companyName: "React Fast Training",
    companyEmail: "info@reactfasttraining.co.uk",
    companyPhone: "01234 567890",
    companyAddress: "123 Training Street, Leeds, LS1 1AA",
    timezone: "Europe/London",
    currency: "GBP",
  },
  notifications: {
    emailNotifications: true,
    newBookingAlert: true,
    cancellationAlert: true,
    paymentFailureAlert: true,
    dailyReport: false,
  },
  booking: {
    minBookingAdvance: "24",
    maxBookingAdvance: "90",
    cancellationDeadline: "48",
    maxAttendeesPerBooking: "5",
    allowWaitlist: true,
    automaticReminders: true,
  },
  payment: {
    stripeEnabled: false,
    stripePublicKey: "",
    stripeSecretKey: "",
    enableTestMode: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: "30",
    passwordComplexity: "medium",
    ipWhitelist: "",
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    enableApiAccess: false,
    autoBackup: false,
    backupFrequency: "daily",
  },
};