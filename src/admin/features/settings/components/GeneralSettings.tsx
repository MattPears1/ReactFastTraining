import React from "react";
import { GeneralSettings as GeneralSettingsType } from "../types";

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onChange: (updates: Partial<GeneralSettingsType>) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="admin-label">Company Name</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">Contact Email</label>
          <input
            type="email"
            value={settings.companyEmail}
            onChange={(e) => onChange({ companyEmail: e.target.value })}
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">Phone Number</label>
          <input
            type="tel"
            value={settings.companyPhone}
            onChange={(e) => onChange({ companyPhone: e.target.value })}
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
            className="admin-select"
          >
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="admin-label">Company Address</label>
        <textarea
          value={settings.companyAddress}
          onChange={(e) => onChange({ companyAddress: e.target.value })}
          className="admin-input"
          rows={3}
        />
      </div>

      <div>
        <label className="admin-label">Timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="admin-select"
        >
          <option value="Europe/London">Europe/London (GMT)</option>
          <option value="Europe/Dublin">Europe/Dublin (IST)</option>
          <option value="Europe/Paris">Europe/Paris (CET)</option>
        </select>
      </div>
    </div>
  );
};