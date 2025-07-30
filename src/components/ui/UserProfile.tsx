import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit2,
  Camera,
  Check,
  X,
  Shield,
  Bell,
  Globe,
  Lock,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { clsx } from "clsx";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  company?: string;
  position?: string;
  joinDate: Date;
  isVerified?: boolean;
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    publicProfile: boolean;
  };
}

interface UserProfileProps {
  user: UserProfileData;
  editable?: boolean;
  onUpdate?: (data: Partial<UserProfileData>) => void;
  onAvatarChange?: (file: File) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  editable = false,
  onUpdate,
  onAvatarChange,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(user);
  const [avatarHover, setAvatarHover] = useState(false);

  const handleSave = () => {
    onUpdate?.(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(user);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (editable && !isEditing) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onAvatarChange?.(file);
        }
      };
      input.click();
    }
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm",
        className,
      )}
    >
      {/* Header Section */}
      <div className="relative h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-xl">
        {editable && (
          <button
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
            aria-label={isEditing ? "Cancel editing" : "Edit profile"}
          >
            {isEditing ? (
              <X className="w-5 h-5" />
            ) : (
              <Edit2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Avatar Section */}
      <div className="relative -mt-16 px-6">
        <div
          className="relative inline-block"
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
        >
          <UserAvatar
            src={user.avatar}
            name={user.name}
            size="xl"
            className="ring-4 ring-white dark:ring-gray-800"
            onClick={editable ? handleAvatarClick : undefined}
          />
          {editable && avatarHover && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="mt-4">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={editedData.name}
                onChange={(e) =>
                  setEditedData({ ...editedData, name: e.target.value })
                }
                className="text-2xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h2>
            )}
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editedData.bio || ""}
              onChange={(e) =>
                setEditedData({ ...editedData, bio: e.target.value })
              }
              placeholder="Add a bio..."
              className="mt-2 w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          ) : (
            user.bio && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {user.bio}
              </p>
            )
          )}
        </div>

        {/* Contact Information */}
        <div className="mt-6 space-y-3">
          <InfoItem
            icon={Mail}
            label="Email"
            value={user.email}
            editable={false}
          />
          <InfoItem
            icon={Phone}
            label="Phone"
            value={user.phone}
            editable={isEditing}
            onChange={(value) => setEditedData({ ...editedData, phone: value })}
          />
          <InfoItem
            icon={MapPin}
            label="Location"
            value={user.location}
            editable={isEditing}
            onChange={(value) =>
              setEditedData({ ...editedData, location: value })
            }
          />
          <InfoItem
            icon={Briefcase}
            label="Company"
            value={user.company}
            editable={isEditing}
            onChange={(value) =>
              setEditedData({ ...editedData, company: value })
            }
          />
          <InfoItem
            icon={Calendar}
            label="Joined"
            value={new Date(user.joinDate).toLocaleDateString()}
            editable={false}
          />
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for info items
interface InfoItemProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon: Icon,
  label,
  value,
  editable = false,
  onChange,
}) => {
  if (!value && !editable) return null;

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-gray-400" />
      <div className="flex-1">
        {editable ? (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : (
          <span className="text-gray-700 dark:text-gray-300">{value}</span>
        )}
      </div>
    </div>
  );
};

// Profile Settings Component
export interface ProfileSettingsProps {
  preferences: UserProfileData["preferences"];
  onUpdate: (preferences: UserProfileData["preferences"]) => void;
  className?: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  preferences = {
    notifications: true,
    newsletter: false,
    publicProfile: true,
  },
  onUpdate,
  className,
}) => {
  const [settings, setSettings] = useState(preferences);

  const handleToggle = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    onUpdate(updated);
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6",
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Privacy & Preferences
      </h3>

      <div className="space-y-4">
        <SettingToggle
          icon={Bell}
          title="Push Notifications"
          description="Receive notifications about your account activity"
          enabled={settings.notifications}
          onToggle={() => handleToggle("notifications")}
        />
        <SettingToggle
          icon={Mail}
          title="Newsletter"
          description="Receive our weekly newsletter with updates and offers"
          enabled={settings.newsletter}
          onToggle={() => handleToggle("newsletter")}
        />
        <SettingToggle
          icon={Globe}
          title="Public Profile"
          description="Make your profile visible to other users"
          enabled={settings.publicProfile}
          onToggle={() => handleToggle("publicProfile")}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
          <Lock className="w-4 h-4" />
          Change Password
        </button>
      </div>
    </div>
  );
};

// Helper component for settings toggles
interface SettingToggleProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}) => {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className={clsx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700",
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
};
