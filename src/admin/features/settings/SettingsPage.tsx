import React, { useState } from "react";
import {
  Save,
  Bell,
  Mail,
  Shield,
  Globe,
  Calendar,
  CreditCard,
  Palette,
  Database,
  Key,
  AlertCircle,
  Check,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Building,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import "../../styles/admin-design-system.css";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const settingSections: SettingSection[] = [
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

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  // Form states
  const [companyName, setCompanyName] = useState("React Fast Training");
  const [companyEmail, setCompanyEmail] = useState(
    "info@reactfasttraining.co.uk",
  );
  const [companyPhone, setCompanyPhone] = useState("01234 567890");
  const [companyAddress, setCompanyAddress] = useState(
    "123 Training Street, Leeds, LS1 1AA",
  );
  const [timezone, setTimezone] = useState("Europe/London");
  const [currency, setCurrency] = useState("GBP");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState(true);
  const [cancellationAlert, setCancellationAlert] = useState(true);
  const [paymentFailureAlert, setPaymentFailureAlert] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);

  const [minBookingAdvance, setMinBookingAdvance] = useState("24");
  const [maxBookingAdvance, setMaxBookingAdvance] = useState("90");
  const [cancellationDeadline, setCancellationDeadline] = useState("48");
  const [automaticReminders, setAutomaticReminders] = useState(true);

  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [stripePublicKey, setStripePublicKey] = useState("pk_test_...");
  const [stripeSecretKey, setStripeSecretKey] = useState("sk_test_...");
  const [enableTestMode, setEnableTestMode] = useState(true);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordComplexity, setPasswordComplexity] = useState("medium");
  const [ipWhitelist, setIpWhitelist] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSaving(false);
    setHasChanges(false);
    setSavedMessage("Settings saved successfully!");

    // Clear message after 3 seconds
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleChange = () => {
    setHasChanges(true);
    setSavedMessage("");
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="admin-label">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Contact Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => {
                    setCompanyEmail(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Contact Phone</label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => {
                    setCompanyPhone(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    handleChange();
                  }}
                  className="admin-select"
                >
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="America/New_York">America/New York</option>
                </select>
              </div>
            </div>
            <div>
              <label className="admin-label">Company Address</label>
              <textarea
                value={companyAddress}
                onChange={(e) => {
                  setCompanyAddress(e.target.value);
                  handleChange();
                }}
                className="admin-input"
                rows={3}
              />
            </div>
            <div>
              <label className="admin-label">Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  handleChange();
                }}
                className="admin-select w-48"
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <div className="font-medium text-gray-900">
                    Email Notifications
                  </div>
                  <div className="admin-text-small admin-text-muted">
                    Master switch for all email notifications
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => {
                    setEmailNotifications(e.target.checked);
                    handleChange();
                  }}
                  className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              <div
                className={`space-y-4 ml-8 ${!emailNotifications ? "opacity-50" : ""}`}
              >
                <label className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      New Booking Alerts
                    </div>
                    <div className="admin-text-small admin-text-muted">
                      Receive email when new bookings are made
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newBookingAlert}
                    onChange={(e) => {
                      setNewBookingAlert(e.target.checked);
                      handleChange();
                    }}
                    disabled={!emailNotifications}
                    className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      Cancellation Alerts
                    </div>
                    <div className="admin-text-small admin-text-muted">
                      Get notified when bookings are cancelled
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cancellationAlert}
                    onChange={(e) => {
                      setCancellationAlert(e.target.checked);
                      handleChange();
                    }}
                    disabled={!emailNotifications}
                    className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      Payment Failure Alerts
                    </div>
                    <div className="admin-text-small admin-text-muted">
                      Instant alerts for failed payments
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentFailureAlert}
                    onChange={(e) => {
                      setPaymentFailureAlert(e.target.checked);
                      handleChange();
                    }}
                    disabled={!emailNotifications}
                    className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      Daily Reports
                    </div>
                    <div className="admin-text-small admin-text-muted">
                      Receive daily summary at 9:00 AM
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyReport}
                    onChange={(e) => {
                      setDailyReport(e.target.checked);
                      handleChange();
                    }}
                    disabled={!emailNotifications}
                    className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case "booking":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="admin-label">
                  Minimum Booking Advance (hours)
                </label>
                <input
                  type="number"
                  value={minBookingAdvance}
                  onChange={(e) => {
                    setMinBookingAdvance(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                  min="0"
                />
                <p className="admin-text-small admin-text-muted admin-mt-1">
                  How far in advance customers must book
                </p>
              </div>
              <div>
                <label className="admin-label">
                  Maximum Booking Advance (days)
                </label>
                <input
                  type="number"
                  value={maxBookingAdvance}
                  onChange={(e) => {
                    setMaxBookingAdvance(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                  min="1"
                />
                <p className="admin-text-small admin-text-muted admin-mt-1">
                  How far ahead customers can book
                </p>
              </div>
              <div>
                <label className="admin-label">
                  Cancellation Deadline (hours)
                </label>
                <input
                  type="number"
                  value={cancellationDeadline}
                  onChange={(e) => {
                    setCancellationDeadline(e.target.value);
                    handleChange();
                  }}
                  className="admin-input"
                  min="0"
                />
                <p className="admin-text-small admin-text-muted admin-mt-1">
                  Hours before course when cancellation is no longer allowed
                </p>
              </div>
            </div>

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
                checked={automaticReminders}
                onChange={(e) => {
                  setAutomaticReminders(e.target.checked);
                  handleChange();
                }}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Changes to payment settings may
                    affect live transactions. Test thoroughly before saving.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <div className="font-medium text-gray-900">Stripe Payments</div>
                <div className="admin-text-small admin-text-muted">
                  Enable Stripe payment processing
                </div>
              </div>
              <input
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => {
                  setStripeEnabled(e.target.checked);
                  handleChange();
                }}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            {stripeEnabled && (
              <div className="space-y-4 ml-8">
                <div>
                  <label className="admin-label">Stripe Public Key</label>
                  <input
                    type="text"
                    value={stripePublicKey}
                    onChange={(e) => {
                      setStripePublicKey(e.target.value);
                      handleChange();
                    }}
                    className="admin-input font-mono text-sm"
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <label className="admin-label">Stripe Secret Key</label>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => {
                      setStripeSecretKey(e.target.value);
                      handleChange();
                    }}
                    className="admin-input font-mono text-sm"
                    placeholder="sk_test_..."
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableTestMode}
                    onChange={(e) => {
                      setEnableTestMode(e.target.checked);
                      handleChange();
                    }}
                    className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Enable test mode
                  </span>
                </label>
              </div>
            )}
          </div>
        );

      case "security":
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
                checked={twoFactorEnabled}
                onChange={(e) => {
                  setTwoFactorEnabled(e.target.checked);
                  handleChange();
                }}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="admin-label">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => {
                    setSessionTimeout(e.target.value);
                    handleChange();
                  }}
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
                  value={passwordComplexity}
                  onChange={(e) => {
                    setPasswordComplexity(e.target.value);
                    handleChange();
                  }}
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
                value={ipWhitelist}
                onChange={(e) => {
                  setIpWhitelist(e.target.value);
                  handleChange();
                }}
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

      case "system":
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
                  checked={maintenanceMode}
                  onChange={(e) => {
                    setMaintenanceMode(e.target.checked);
                    handleChange();
                  }}
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
                  checked={debugMode}
                  onChange={(e) => {
                    setDebugMode(e.target.checked);
                    handleChange();
                  }}
                  className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <div className="font-medium text-gray-900">
                    Automatic Backups
                  </div>
                  <div className="admin-text-small admin-text-muted">
                    Automatically backup database
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => {
                    setAutoBackup(e.target.checked);
                    handleChange();
                  }}
                  className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              {autoBackup && (
                <div className="ml-8">
                  <label className="admin-label">Backup Frequency</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => {
                      setBackupFrequency(e.target.value);
                      handleChange();
                    }}
                    className="admin-select w-48"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button className="admin-btn admin-btn-secondary">
                <Download className="admin-icon-sm" />
                Export Database
              </button>
              <button className="admin-btn admin-btn-secondary">
                <Upload className="admin-icon-sm" />
                Import Database
              </button>
              <button className="admin-btn admin-btn-secondary">
                <RefreshCw className="admin-icon-sm" />
                Clear Cache
              </button>
              <button className="admin-btn admin-btn-danger">
                <Database className="admin-icon-sm" />
                Reset Database
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Settings</h1>
            <p className="admin-page-subtitle">
              Configure system settings and preferences
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
              onClick={handleSave}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <AdminCard noPadding>
            <nav className="space-y-1 p-2">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors ${
                    activeSection === section.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={
                      activeSection === section.id
                        ? "text-primary-500"
                        : "text-gray-400"
                    }
                  >
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{section.title}</div>
                    <div className="admin-text-small admin-text-muted">
                      {section.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </AdminCard>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <AdminCard
            title={settingSections.find((s) => s.id === activeSection)?.title}
            icon={() =>
              settingSections.find((s) => s.id === activeSection)?.icon
            }
          >
            {renderSectionContent()}
          </AdminCard>
        </div>
      </div>
    </div>
  );
};
