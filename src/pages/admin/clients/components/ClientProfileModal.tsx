import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  PoundSterling,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { Client } from '../types';
import { cn } from '@utils/cn';

interface ClientProfileModalProps {
  client: Client;
  onClose: () => void;
}

type TabType = 'details' | 'bookings' | 'communications' | 'notes';

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({ client, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [notes, setNotes] = useState('');

  const handleSaveNotes = async () => {
    try {
      // API call to save notes
      showToast('Notes saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save notes', 'error');
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <User className="h-4 w-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-4 w-4" /> },
    { id: 'communications', label: 'Communications', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Client Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Overview */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(client.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                £{client.stats.totalSpend.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total spend</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email</div>
                      <div className="text-sm text-gray-600">{client.email}</div>
                    </div>
                  </div>
                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Phone</div>
                        <div className="text-sm text-gray-600">{client.phone}</div>
                      </div>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Address</div>
                        <div className="text-sm text-gray-600">{client.address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Statistics */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Statistics</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {client.stats.bookingCount}
                    </div>
                    <div className="text-sm text-gray-600">Total bookings</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {client.stats.completedCourses}
                    </div>
                    <div className="text-sm text-gray-600">Completed courses</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {client.stats.upcomingBookings}
                    </div>
                    <div className="text-sm text-gray-600">Upcoming bookings</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      £{(client.stats.totalSpend / Math.max(client.stats.bookingCount, 1)).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Average spend</div>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              {client.specialRequirements && client.specialRequirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Special Requirements</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        {client.specialRequirements.map((req, index) => (
                          <div key={index} className="text-sm text-yellow-800">
                            • {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Booking history will be displayed here
              </div>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Communication history will be displayed here
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this client..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Save notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};