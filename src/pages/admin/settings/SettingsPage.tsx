import React, { useState, useEffect } from "react";
import { Settings, Save, Edit2, X, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { cn } from "@utils/cn";
import {
  BusinessSettings,
  CourseSettings,
  NotificationSettings,
  PaymentSettings,
  SecuritySettings,
  SettingsSection,
} from "./types";
import { SettingsSidebar } from "./components/SettingsSidebar";
import { BusinessSettingsForm } from "./components/BusinessSettingsForm";
import { CourseSettingsForm } from "./components/CourseSettingsForm";
import { NotificationSettingsForm } from "./components/NotificationSettingsForm";

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State for different sections
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("business");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: "React Fast Training",
    email: "info@reactfasttraining.co.uk",
    phone: "0113 123 4567",
    address: "Leeds Training Centre, Leeds, West Yorkshire, LS1 1AA",
    website: "https://reactfasttraining.co.uk",
    registrationNumber: "REG12345678",
  });

  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    maxParticipants: 12,
    minParticipants: 4,
    bookingDeadlineDays: 2,
    cancellationDeadlineDays: 3,
    locations: [
      "Leeds Training Centre",
      "Sheffield Venue",
      "Bradford Office",
      "Client Site",
    ],
    defaultInstructor: "Lex",
    sessionDuration: 6,
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      bookingConfirmation: true,
      bookingReminder: true,
      reminderHoursBefore: 24,
      cancellationNotice: true,
      marketingEmails: false,
      adminAlerts: true,
      lowCapacityAlert: true,
      lowCapacityThreshold: 50,
    });

  // Save settings
  const saveSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast("Settings saved successfully", "success");
      setEditMode(false);
      setHasChanges(false);
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel changes
  const cancelChanges = () => {
    // Reset to original values (would need to store original values)
    setEditMode(false);
    setHasChanges(false);
    showToast("Changes discarded", "info");
  };

  // Track changes
  useEffect(() => {
    if (editMode) {
      setHasChanges(true);
    }
  }, [businessSettings, courseSettings, notificationSettings, editMode]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "business":
        return (
          <BusinessSettingsForm
            settings={businessSettings}
            onChange={setBusinessSettings}
            editMode={editMode}
          />
        );
      case "course":
        return (
          <CourseSettingsForm
            settings={courseSettings}
            onChange={setCourseSettings}
            editMode={editMode}
          />
        );
      case "notifications":
        return (
          <NotificationSettingsForm
            settings={notificationSettings}
            onChange={setNotificationSettings}
            editMode={editMode}
          />
        );
      case "security":
        return (
          <div className="text-center py-12 text-gray-500">
            Security settings coming soon
          </div>
        );
      case "payment":
        return (
          <div className="text-center py-12 text-gray-500">
            Payment settings coming soon
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-7 w-7" />
              Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your business settings and preferences
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Settings
              </button>
            ) : (
              <>
                <button
                  onClick={cancelChanges}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={loading || !hasChanges}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    hasChanges
                      ? "bg-primary-600 hover:bg-primary-700"
                      : "bg-gray-400 cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Don't forget to save before leaving this
              page.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasChanges={hasChanges}
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
