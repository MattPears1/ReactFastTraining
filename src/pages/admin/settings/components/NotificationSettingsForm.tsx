import React from 'react';
import { Bell, Mail, AlertCircle, Clock, TrendingDown } from 'lucide-react';
import { NotificationSettings } from '../types';
import { cn } from '@utils/cn';

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
  editMode: boolean;
}

export const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({
  settings,
  onChange,
  editMode
}) => {
  const handleToggle = (field: keyof NotificationSettings) => {
    onChange({
      ...settings,
      [field]: !settings[field]
    });
  };

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        checked ? "bg-primary-600" : "bg-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        
        {/* Customer Notifications */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Customer Email Notifications
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Booking Confirmation</label>
                <p className="text-xs text-gray-500">Send confirmation email when a booking is made</p>
              </div>
              <ToggleSwitch
                checked={settings.bookingConfirmation}
                onChange={() => handleToggle('bookingConfirmation')}
                disabled={!editMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Booking Reminder</label>
                <p className="text-xs text-gray-500">Send reminder email before the session</p>
              </div>
              <ToggleSwitch
                checked={settings.bookingReminder}
                onChange={() => handleToggle('bookingReminder')}
                disabled={!editMode}
              />
            </div>
            
            {settings.bookingReminder && (
              <div className="ml-8 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <label className="text-sm text-gray-700">Send reminder</label>
                <input
                  type="number"
                  value={settings.reminderHoursBefore}
                  onChange={(e) => handleChange('reminderHoursBefore', parseInt(e.target.value) || 24)}
                  disabled={!editMode}
                  min="1"
                  max="168"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50"
                />
                <span className="text-sm text-gray-700">hours before</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Cancellation Notice</label>
                <p className="text-xs text-gray-500">Notify customers if a session is cancelled</p>
              </div>
              <ToggleSwitch
                checked={settings.cancellationNotice}
                onChange={() => handleToggle('cancellationNotice')}
                disabled={!editMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Marketing Emails</label>
                <p className="text-xs text-gray-500">Send promotional offers and updates</p>
              </div>
              <ToggleSwitch
                checked={settings.marketingEmails}
                onChange={() => handleToggle('marketingEmails')}
                disabled={!editMode}
              />
            </div>
          </div>
        </div>

        {/* Admin Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Admin Notifications
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Admin Alerts</label>
                <p className="text-xs text-gray-500">Receive important system notifications</p>
              </div>
              <ToggleSwitch
                checked={settings.adminAlerts}
                onChange={() => handleToggle('adminAlerts')}
                disabled={!editMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Low Capacity Alert</label>
                <p className="text-xs text-gray-500">Alert when session capacity is below threshold</p>
              </div>
              <ToggleSwitch
                checked={settings.lowCapacityAlert}
                onChange={() => handleToggle('lowCapacityAlert')}
                disabled={!editMode}
              />
            </div>
            
            {settings.lowCapacityAlert && (
              <div className="ml-8 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-gray-400" />
                <label className="text-sm text-gray-700">Alert when capacity below</label>
                <input
                  type="number"
                  value={settings.lowCapacityThreshold}
                  onChange={(e) => handleChange('lowCapacityThreshold', parseInt(e.target.value) || 50)}
                  disabled={!editMode}
                  min="0"
                  max="100"
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50"
                />
                <span className="text-sm text-gray-700">%</span>
              </div>
            )}
          </div>
        </div>

        {/* Notification Preview */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Email Delivery</p>
              <p className="text-blue-700 mt-1">
                All emails are sent from <strong>noreply@reactfasttraining.co.uk</strong>. 
                Make sure this address is added to your email provider's whitelist to ensure delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};