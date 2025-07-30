import React from "react";
import { BookingSettings as BookingSettingsType } from "../types";

interface BookingSettingsProps {
  settings: BookingSettingsType;
  onChange: (updates: Partial<BookingSettingsType>) => void;
}

export const BookingSettings: React.FC<BookingSettingsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="admin-label">
            Minimum Booking Advance (hours)
          </label>
          <input
            type="number"
            value={settings.minBookingAdvance}
            onChange={(e) => onChange({ minBookingAdvance: e.target.value })}
            className="admin-input"
            min="1"
            max="168"
          />
          <p className="admin-text-small admin-text-muted admin-mt-1">
            How far in advance bookings must be made
          </p>
        </div>
        <div>
          <label className="admin-label">
            Maximum Booking Advance (days)
          </label>
          <input
            type="number"
            value={settings.maxBookingAdvance}
            onChange={(e) => onChange({ maxBookingAdvance: e.target.value })}
            className="admin-input"
            min="7"
            max="365"
          />
          <p className="admin-text-small admin-text-muted admin-mt-1">
            How far in the future bookings can be made
          </p>
        </div>
        <div>
          <label className="admin-label">
            Cancellation Deadline (hours)
          </label>
          <input
            type="number"
            value={settings.cancellationDeadline}
            onChange={(e) => onChange({ cancellationDeadline: e.target.value })}
            className="admin-input"
            min="1"
            max="168"
          />
          <p className="admin-text-small admin-text-muted admin-mt-1">
            Deadline for free cancellation before course
          </p>
        </div>
        <div>
          <label className="admin-label">
            Max Attendees Per Booking
          </label>
          <input
            type="number"
            value={settings.maxAttendeesPerBooking}
            onChange={(e) => onChange({ maxAttendeesPerBooking: e.target.value })}
            className="admin-input"
            min="1"
            max="10"
          />
          <p className="admin-text-small admin-text-muted admin-mt-1">
            Maximum number of attendees in a single booking
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <div className="font-medium text-gray-900">Allow Waitlist</div>
            <div className="admin-text-small admin-text-muted">
              Enable waitlist when courses are full
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.allowWaitlist}
            onChange={(e) => onChange({ allowWaitlist: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <div className="font-medium text-gray-900">
              Automatic Reminders
            </div>
            <div className="admin-text-small admin-text-muted">
              Send email reminders 24 hours before course
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.automaticReminders}
            onChange={(e) => onChange({ automaticReminders: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>
      </div>
    </div>
  );
};