import React from "react";
import { Download, Upload, RefreshCw } from "lucide-react";
import { SystemSettings as SystemSettingsType } from "../types";

interface SystemSettingsProps {
  settings: SystemSettingsType;
  onChange: (updates: Partial<SystemSettingsType>) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <div className="font-medium text-gray-900">
              Maintenance Mode
            </div>
            <div className="admin-text-small admin-text-muted">
              Show maintenance page to visitors
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => onChange({ maintenanceMode: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <div className="font-medium text-gray-900">Debug Mode</div>
            <div className="admin-text-small admin-text-muted">
              Show detailed error messages
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => onChange({ debugMode: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <div className="font-medium text-gray-900">API Access</div>
            <div className="admin-text-small admin-text-muted">
              Enable external API access
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.enableApiAccess}
            onChange={(e) => onChange({ enableApiAccess: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Automatic Backups</div>
            <div className="admin-text-small admin-text-muted">
              Backup database automatically
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => onChange({ autoBackup: e.target.checked })}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </div>

        {settings.autoBackup && (
          <div className="mt-4 ml-8">
            <label className="admin-label">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => onChange({ backupFrequency: e.target.value })}
              className="admin-select"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}
      </div>

      <div className="border-t pt-6 flex gap-4">
        <button className="admin-btn admin-btn-secondary">
          <Download className="admin-icon-sm" />
          Export Settings
        </button>
        <button className="admin-btn admin-btn-secondary">
          <Upload className="admin-icon-sm" />
          Import Settings
        </button>
        <button className="admin-btn admin-btn-secondary">
          <RefreshCw className="admin-icon-sm" />
          Backup Now
        </button>
      </div>
    </div>
  );
};