import React from "react";
import { Save, Check, RefreshCw } from "lucide-react";
import { AdminBadge } from "../../../components/ui/AdminBadge";

interface SettingsHeaderProps {
  hasChanges: boolean;
  saving: boolean;
  savedMessage: string;
  onSave: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  hasChanges,
  saving,
  savedMessage,
  onSave,
}) => {
  return (
    <div className="admin-header">
      <div>
        <h1 className="admin-title">Settings</h1>
        <p className="admin-text-muted">
          Manage your system configuration and preferences
        </p>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center gap-3">
        {savedMessage && (
          <div className="flex items-center gap-2 text-green-600 admin-fade-in">
            <Check className="admin-icon-sm" />
            <span className="text-sm font-medium">{savedMessage}</span>
          </div>
        )}
        {hasChanges && (
          <AdminBadge variant="warning">Unsaved changes</AdminBadge>
        )}
        <button
          onClick={onSave}
          disabled={!hasChanges || saving}
          className={`admin-btn ${hasChanges ? "admin-btn-primary" : "admin-btn-secondary"}`}
        >
          {saving ? (
            <>
              <RefreshCw className="admin-icon-sm animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="admin-icon-sm" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};