import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserProfile, ProfileSettings } from "@components/ui/UserProfile";
import { AccountSettings } from "@components/ui/AccountSettings";
import { UserMenu } from "@components/ui/UserMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/Tabs";
import { User, Settings, Shield, Activity } from "lucide-react";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSettingsSection, setActiveSettingsSection] = useState("profile");

  // Mock user data
  const user = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    bio: "Passionate about technology and innovation. Always learning something new.",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    company: "Tech Innovations Inc.",
    position: "Senior Developer",
    joinDate: new Date("2023-01-15"),
    isVerified: true,
    preferences: {
      notifications: true,
      newsletter: false,
      publicProfile: true,
    },
  };

  const handleProfileUpdate = (data: any) => {
    console.log("Profile updated:", data);
    // Handle profile update
  };

  const handleAvatarChange = (file: File) => {
    console.log("Avatar changed:", file);
    // Handle avatar upload
  };

  const handlePreferencesUpdate = (preferences: any) => {
    console.log("Preferences updated:", preferences);
    // Handle preferences update
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your profile information and account settings
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === "profile"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === "settings"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === "activity"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Activity className="w-4 h-4" />
                  Activity
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <UserProfile
                  user={user}
                  editable
                  onUpdate={handleProfileUpdate}
                  onAvatarChange={handleAvatarChange}
                />
              </div>
              <div>
                <ProfileSettings
                  preferences={user.preferences}
                  onUpdate={handlePreferencesUpdate}
                />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <AccountSettings
              activeSection={activeSettingsSection}
              onSectionChange={setActiveSettingsSection}
            />
          )}

          {activeTab === "activity" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {[
                  {
                    action: "Updated profile information",
                    time: "2 hours ago",
                    icon: User,
                  },
                  {
                    action: "Changed password",
                    time: "3 days ago",
                    icon: Shield,
                  },
                  {
                    action: "Added new payment method",
                    time: "1 week ago",
                    icon: Settings,
                  },
                  {
                    action: "Updated notification preferences",
                    time: "2 weeks ago",
                    icon: Settings,
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <activity.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
