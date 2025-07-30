import React from "react";
import { SecuritySettings as SecuritySettingsType } from "../types";

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onChange: (updates: Partial<SecuritySettingsType>) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
        <div>
          <div className="font-medium text-gray-900">
            Two-Factor Authentication
          </div>
          <div className="admin-text-small admin-text-muted">
            Require 2FA for admin accounts
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.twoFactorEnabled}
          onChange={(e) => onChange({ twoFactorEnabled: e.target.checked })}
          className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="admin-label">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => onChange({ sessionTimeout: e.target.value })}
            className="admin-input"
            min="5"
            max="120"
          />
          <p className="admin-text-small admin-text-muted admin-mt-1">
            Automatically log out inactive users
          </p>
        </div>
        <div>
          <label className="admin-label">Password Complexity</label>
          <select
            value={settings.passwordComplexity}
            onChange={(e) => onChange({ passwordComplexity: e.target.value })}
            className="admin-select"
          >
            <option value="low">Low (8+ characters)</option>
            <option value="medium">Medium (8+ chars, mixed case)</option>
            <option value="high">
              High (8+ chars, mixed case, numbers, symbols)
            </option>
          </select>
        </div>
      </div>

      <div>
        <label className="admin-label">IP Whitelist (one per line)</label>
        <textarea
          value={settings.ipWhitelist}
          onChange={(e) => onChange({ ipWhitelist: e.target.value })}
          className="admin-input font-mono text-sm"
          rows={4}
          placeholder="192.168.1.1&#10;10.0.0.0/24"
        />
        <p className="admin-text-small admin-text-muted admin-mt-1">
          Leave empty to allow all IPs
        </p>
      </div>
    </div>
  );
};