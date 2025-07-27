import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Shield,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Globe,
  Save,
  AlertCircle,
  Check,
  X,
  Edit2,
  Key,
  Calendar,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { adminDashboardApi } from '@services/api/admin-dashboard.service';
import { cn } from '@utils/cn';

interface BusinessSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  registrationNumber: string;
}

interface CourseSettings {
  maxParticipants: number;
  minParticipants: number;
  bookingDeadlineDays: number;
  cancellationDeadlineDays: number;
  locations: string[];
  defaultInstructor: string;
  sessionDuration: number;
}

interface NotificationSettings {
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  reminderHoursBefore: number;
  cancellationNotice: boolean;
  marketingEmails: boolean;
  adminAlerts: boolean;
  lowCapacityAlert: boolean;
  lowCapacityThreshold: number;
}

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State for different sections
  const [activeSection, setActiveSection] = useState<'business' | 'course' | 'notifications' | 'security' | 'payment'>('business');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'React Fast Training',
    email: 'info@reactfasttraining.co.uk',
    phone: '0113 123 4567',
    address: 'Leeds Training Centre, Leeds, West Yorkshire, LS1 1AA',
    website: 'https://reactfasttraining.co.uk',
    registrationNumber: 'REG12345678'
  });
  
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    maxParticipants: 12,
    minParticipants: 4,
    bookingDeadlineDays: 2,
    cancellationDeadlineDays: 3,
    locations: ['Leeds Training Centre', 'Sheffield Venue', 'Bradford Office', 'Client Site'],
    defaultInstructor: 'Lex',
    sessionDuration: 6
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    bookingConfirmation: true,
    bookingReminder: true,
    reminderHoursBefore: 24,
    cancellationNotice: true,
    marketingEmails: false,
    adminAlerts: true,
    lowCapacityAlert: true,
    lowCapacityThreshold: 50
  });

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // API calls to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showToast('Settings saved successfully', 'success');
      setEditMode(false);
      setHasChanges(false);
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel changes
  const handleCancelChanges = () => {
    // Reset to original values
    setEditMode(false);
    setHasChanges(false);
    showToast('Changes discarded', 'info');
  };

  // Add/Remove location
  const handleAddLocation = () => {
    const newLocation = prompt('Enter new location name:');
    if (newLocation) {
      setCourseSettings({
        ...courseSettings,
        locations: [...courseSettings.locations, newLocation]
      });
      setHasChanges(true);
    }
  };

  const handleRemoveLocation = (index: number) => {
    setCourseSettings({
      ...courseSettings,
      locations: courseSettings.locations.filter((_, i) => i !== index)
    });
    setHasChanges(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your business settings and preferences
            </p>
          </div>
          
          {hasChanges && (
            <div className="flex gap-2">
              <button
                onClick={handleCancelChanges}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection('business')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === 'business'
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Building2 className="w-5 h-5" />
                Business Information
              </button>
              
              <button
                onClick={() => setActiveSection('course')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === 'course'
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Calendar className="w-5 h-5" />
                Course Settings
              </button>
              
              <button
                onClick={() => setActiveSection('notifications')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === 'notifications'
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Bell className="w-5 h-5" />
                Notifications
              </button>
              
              <button
                onClick={() => setActiveSection('payment')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === 'payment'
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <CreditCard className="w-5 h-5" />
                Payment Settings
              </button>
              
              <button
                onClick={() => setActiveSection('security')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === 'security'
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Shield className="w-5 h-5" />
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Business Information */}
            {activeSection === 'business' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Business Information
                  </h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessSettings.businessName}
                      onChange={(e) => {
                        setBusinessSettings({ ...businessSettings, businessName: e.target.value });
                        setHasChanges(true);
                      }}
                      disabled={!editMode}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={businessSettings.email}
                        onChange={(e) => {
                          setBusinessSettings({ ...businessSettings, email: e.target.value });
                          setHasChanges(true);
                        }}
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={businessSettings.phone}
                        onChange={(e) => {
                          setBusinessSettings({ ...businessSettings, phone: e.target.value });
                          setHasChanges(true);
                        }}
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={businessSettings.address}
                      onChange={(e) => {
                        setBusinessSettings({ ...businessSettings, address: e.target.value });
                        setHasChanges(true);
                      }}
                      disabled={!editMode}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={businessSettings.website}
                        onChange={(e) => {
                          setBusinessSettings({ ...businessSettings, website: e.target.value });
                          setHasChanges(true);
                        }}
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={businessSettings.registrationNumber}
                        onChange={(e) => {
                          setBusinessSettings({ ...businessSettings, registrationNumber: e.target.value });
                          setHasChanges(true);
                        }}
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Course Settings */}
            {activeSection === 'course' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Course Settings
                </h2>

                <div className="space-y-6">
                  {/* Capacity Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Capacity Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Maximum Participants per Session
                        </label>
                        <input
                          type="number"
                          value={courseSettings.maxParticipants}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, maxParticipants: parseInt(e.target.value) });
                            setHasChanges(true);
                          }}
                          min="1"
                          max="50"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Minimum Participants Required
                        </label>
                        <input
                          type="number"
                          value={courseSettings.minParticipants}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, minParticipants: parseInt(e.target.value) });
                            setHasChanges(true);
                          }}
                          min="1"
                          max="50"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Booking Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Booking Deadline (days before course)
                        </label>
                        <input
                          type="number"
                          value={courseSettings.bookingDeadlineDays}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, bookingDeadlineDays: parseInt(e.target.value) });
                            setHasChanges(true);
                          }}
                          min="0"
                          max="30"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Cancellation Deadline (days before course)
                        </label>
                        <input
                          type="number"
                          value={courseSettings.cancellationDeadlineDays}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, cancellationDeadlineDays: parseInt(e.target.value) });
                            setHasChanges(true);
                          }}
                          min="0"
                          max="30"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Training Locations
                      </h3>
                      <button
                        onClick={handleAddLocation}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Location
                      </button>
                    </div>
                    <div className="space-y-2">
                      {courseSettings.locations.map((location, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{location}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveLocation(index)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Other Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Default Instructor
                        </label>
                        <input
                          type="text"
                          value={courseSettings.defaultInstructor}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, defaultInstructor: e.target.value });
                            setHasChanges(true);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Session Duration (hours)
                        </label>
                        <input
                          type="number"
                          value={courseSettings.sessionDuration}
                          onChange={(e) => {
                            setCourseSettings({ ...courseSettings, sessionDuration: parseInt(e.target.value) });
                            setHasChanges(true);
                          }}
                          min="1"
                          max="24"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Notification Settings
                </h2>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Booking Confirmation
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Send confirmation email when booking is made
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.bookingConfirmation}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, bookingConfirmation: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Course Reminders
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Send reminder before course starts
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.bookingReminder}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, bookingReminder: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>

                      {notificationSettings.bookingReminder && (
                        <div className="ml-12">
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Send reminder (hours before)
                          </label>
                          <input
                            type="number"
                            value={notificationSettings.reminderHoursBefore}
                            onChange={(e) => {
                              setNotificationSettings({ ...notificationSettings, reminderHoursBefore: parseInt(e.target.value) });
                              setHasChanges(true);
                            }}
                            min="1"
                            max="72"
                            className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Cancellation Notices
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Notify attendees of cancellations
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.cancellationNotice}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, cancellationNotice: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Marketing Emails
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Allow promotional emails to clients
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.marketingEmails}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, marketingEmails: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Admin Alerts */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Admin Alerts
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Admin Notifications
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Receive notifications for important events
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.adminAlerts}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, adminAlerts: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Low Capacity Alerts
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Alert when session capacity is low
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowCapacityAlert}
                          onChange={(e) => {
                            setNotificationSettings({ ...notificationSettings, lowCapacityAlert: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>

                      {notificationSettings.lowCapacityAlert && (
                        <div className="ml-12">
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Alert threshold (%)
                          </label>
                          <input
                            type="number"
                            value={notificationSettings.lowCapacityThreshold}
                            onChange={(e) => {
                              setNotificationSettings({ ...notificationSettings, lowCapacityThreshold: parseInt(e.target.value) });
                              setHasChanges(true);
                            }}
                            min="10"
                            max="90"
                            step="10"
                            className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeSection === 'payment' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Payment Settings
                </h2>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Payment Configuration Required
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Payment settings must be configured through your Stripe dashboard.
                      </p>
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                      >
                        Go to Stripe Dashboard
                        <Globe className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Payment Provider</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Stripe</p>
                    </div>
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Accepted Cards</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Visa, Mastercard, American Express
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Refund Policy</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Full refund up to {courseSettings.cancellationDeadlineDays} days before course
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Security Settings
                </h2>
                
                <div className="space-y-6">
                  {/* Password Policy */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Password Policy
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Minimum Password Length
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            8 characters required
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Password Complexity
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Must contain uppercase, lowercase, number, and special character
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Session Security */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Session Security
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Session Timeout
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Automatically logout after 30 minutes of inactivity
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Available for admin accounts
                          </p>
                        </div>
                        <Key className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Access Control */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Access Control
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Role-Based Access Control
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Admin users have full access to all system features. Client users can only access their own bookings and profile.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;