import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Shield,
  Bell,
  Globe,
  CreditCard,
  MapPin,
  Smartphone,
  Key,
  AlertCircle,
  Check,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

export interface AccountSettingsProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  className?: string;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  description?: string;
}

const sections: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile Information",
    icon: User,
    description: "Update your personal details",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password and authentication",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email and push preferences",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Lock,
    description: "Data and visibility settings",
  },
  {
    id: "payment",
    label: "Payment Methods",
    icon: CreditCard,
    description: "Manage payment options",
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
    description: "Shipping and billing addresses",
  },
];

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  activeSection = "profile",
  onSectionChange,
  className,
}) => {
  return (
    <div className={clsx("flex gap-8", className)}>
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange?.(section.id)}
                className={clsx(
                  "w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                )}
              >
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{section.label}</p>
                  {section.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {section.description}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className={clsx(
                    "w-4 h-4 mt-0.5 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeSection === "profile" && <ProfileSettings />}
        {activeSection === "security" && <SecuritySettings />}
        {activeSection === "notifications" && <NotificationSettings />}
        {activeSection === "privacy" && <PrivacySettings />}
        {activeSection === "payment" && <PaymentSettings />}
        {activeSection === "addresses" && <AddressSettings />}
      </div>
    </div>
  );
};

// Profile Settings Section
const ProfileSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Software developer and tech enthusiast.",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Profile Information
      </h2>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Security Settings Section
const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              twoFactorEnabled
                ? "bg-primary-600"
                : "bg-gray-200 dark:bg-gray-700",
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                twoFactorEnabled ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>
        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Two-factor authentication is enabled
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your account is protected with an additional security layer
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Login Activity
        </h3>
        <div className="space-y-3">
          {[
            {
              device: "Chrome on Windows",
              location: "New York, US",
              time: "2 hours ago",
            },
            {
              device: "Safari on iPhone",
              location: "New York, US",
              time: "1 day ago",
            },
            {
              device: "Firefox on MacOS",
              location: "San Francisco, US",
              time: "3 days ago",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {activity.device}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.location} · {activity.time}
                </p>
              </div>
              <button className="text-sm text-red-600 hover:text-red-700">
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Other sections would follow similar patterns...
const NotificationSettings: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
  >
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
      Notification Preferences
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Notification settings content...
    </p>
  </motion.div>
);

const PrivacySettings: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
  >
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
      Privacy Settings
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Privacy settings content...
    </p>
  </motion.div>
);

const PaymentSettings: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
  >
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
      Payment Methods
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Payment methods content...
    </p>
  </motion.div>
);

const AddressSettings: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
  >
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
      Addresses
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Address management content...
    </p>
  </motion.div>
);
