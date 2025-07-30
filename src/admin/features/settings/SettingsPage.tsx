import React, { useState } from "react";
import { AdminCard } from "../../components/ui/AdminCard";
import {
  GeneralSettings,
  NotificationSettings,
  BookingSettings,
  PaymentSettings,
  SecuritySettings,
  SystemSettings,
  SettingsNavigation,
  SettingsHeader,
} from "./components";
import { useSettings } from "./hooks/useSettings";
import { SETTING_SECTIONS } from "./constants";
import "../../styles/admin-design-system.css";

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("general");
  const {
    settings,
    hasChanges,
    saving,
    savedMessage,
    updateSettings,
    handleSave,
  } = useSettings();

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <GeneralSettings
            settings={settings.general}
            onChange={(updates) => updateSettings("general", updates)}
          />
        );
      case "notifications":
        return (
          <NotificationSettings
            settings={settings.notifications}
            onChange={(updates) => updateSettings("notifications", updates)}
          />
        );
      case "booking":
        return (
          <BookingSettings
            settings={settings.booking}
            onChange={(updates) => updateSettings("booking", updates)}
          />
        );
      case "payment":
        return (
          <PaymentSettings
            settings={settings.payment}
            onChange={(updates) => updateSettings("payment", updates)}
          />
        );
      case "security":
        return (
          <SecuritySettings
            settings={settings.security}
            onChange={(updates) => updateSettings("security", updates)}
          />
        );
      case "system":
        return (
          <SystemSettings
            settings={settings.system}
            onChange={(updates) => updateSettings("system", updates)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <SettingsHeader
        hasChanges={hasChanges}
        saving={saving}
        savedMessage={savedMessage}
        onSave={handleSave}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <SettingsNavigation
            sections={SETTING_SECTIONS}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <AdminCard
            title={SETTING_SECTIONS.find((s) => s.id === activeSection)?.title}
            icon={() =>
              SETTING_SECTIONS.find((s) => s.id === activeSection)?.icon
            }
          >
            {renderSectionContent()}
          </AdminCard>
        </div>
      </div>
    </div>
  );
};