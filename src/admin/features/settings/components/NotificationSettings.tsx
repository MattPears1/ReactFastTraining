import React from "react";
import { NotificationSettings as NotificationSettingsType } from "../types";

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onChange: (updates: Partial<NotificationSettingsType>) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onChange,
}) => {
  const toggleSettings = [
    {
      key: "emailNotifications" as keyof NotificationSettingsType,
      label: "Email Notifications",
      description: "Receive email alerts for system events",
    },
    {
      key: "newBookingAlert" as keyof NotificationSettingsType,
      label: "New Booking Alerts",
      description: "Get notified when a new booking is made",
    },
    {
      key: "cancellationAlert" as keyof NotificationSettingsType,
      label: "Cancellation Alerts",
      description: "Get notified when a booking is cancelled",
    },
    {
      key: "paymentFailureAlert" as keyof NotificationSettingsType,
      label: "Payment Failure Alerts",
      description: "Get notified when a payment fails",
    },
    {
      key: "dailyReport" as keyof NotificationSettingsType,
      label: "Daily Summary Report",
      description: "Receive daily summary email at 9am",
    },
  ];

  return (
    <div className="space-y-4">
      {toggleSettings.map(({ key, label, description }) => (
        <label
          key={key}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <div>
            <div className="font-medium text-gray-900">{label}</div>
            <div className="admin-text-small admin-text-muted">
              {description}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings[key] as boolean}
            onChange={(e) => onChange({ [key]: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>
      ))}
    </div>
  );
};