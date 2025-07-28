import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';
import { AdminCard } from '../../../components/ui/AdminCard';
import { Button } from '../../../../components/ui/Button';
import { SessionDetails, CapacityInfo } from '../../../types/schedule.types';

interface CapacityManagementProps {
  session: SessionDetails;
  onAddBooking: () => void;
  onManageWaitlist?: () => void;
  onUpdateCapacity?: (newCapacity: number) => Promise<void>;
}

export const CapacityManagement: React.FC<CapacityManagementProps> = ({
  session,
  onAddBooking,
  onManageWaitlist,
  onUpdateCapacity
}) => {
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState(session.maxParticipants);

  // Calculate capacity information
  const capacityInfo: CapacityInfo = {
    maxCapacity: session.maxParticipants,
    currentBookings: session.currentParticipants,
    confirmedAttendees: session.bookings?.filter(b => b.status === 'confirmed').length || 0,
    waitlistCount: 0, // TODO: Get from backend
    availableSpots: Math.max(0, session.maxParticipants - session.currentParticipants),
    capacityPercentage: (session.currentParticipants / session.maxParticipants) * 100
  };

  const getCapacityColor = () => {
    if (capacityInfo.capacityPercentage >= 100) return 'text-red-600 bg-red-100';
    if (capacityInfo.capacityPercentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressBarColor = () => {
    if (capacityInfo.capacityPercentage >= 100) return 'bg-red-500';
    if (capacityInfo.capacityPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleCapacityUpdate = async () => {
    if (onUpdateCapacity && newCapacity !== session.maxParticipants) {
      await onUpdateCapacity(newCapacity);
      setIsEditingCapacity(false);
    }
  };

  const pendingBookings = session.bookings?.filter(b => b.status === 'pending').length || 0;
  const cancelledBookings = session.bookings?.filter(b => b.status === 'cancelled').length || 0;

  return (
    <AdminCard 
      title="Capacity & Bookings" 
      icon={Users}
      iconColor="primary"
      className="schedule-card"
      action={
        <div className="flex items-center space-x-2">
          {capacityInfo.availableSpots > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAddBooking}
              className="group hover:shadow-md transition-all"
            >
              <UserPlus className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Add Booking</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
          {capacityInfo.waitlistCount > 0 && onManageWaitlist && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onManageWaitlist}
              className="hover:bg-primary-50 hover:text-primary-700 transition-all"
            >
              Waitlist ({capacityInfo.waitlistCount})
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Enhanced Main Capacity Display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center px-8 py-4 rounded-xl shadow-inner transition-all duration-300 ${getCapacityColor()}`}>
            <span className="text-4xl font-bold animate-fadeIn">
              {capacityInfo.currentBookings}
            </span>
            <span className="text-2xl mx-3 opacity-50">/</span>
            {isEditingCapacity ? (
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                onBlur={handleCapacityUpdate}
                onKeyPress={(e) => e.key === 'Enter' && handleCapacityUpdate()}
                className="w-20 text-2xl font-bold bg-transparent border-b-2 border-current focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
                min={capacityInfo.currentBookings}
                autoFocus
              />
            ) : (
              <span 
                className="text-2xl cursor-pointer hover:underline hover:scale-105 transition-transform"
                onClick={() => setIsEditingCapacity(true)}
                title="Click to edit capacity"
              >
                {capacityInfo.maxCapacity}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            {capacityInfo.availableSpots === 0 ? (
              <span className="text-red-600">No spots available</span>
            ) : capacityInfo.availableSpots === 1 ? (
              <span className="text-yellow-600">Only 1 spot remaining!</span>
            ) : (
              <span>{capacityInfo.availableSpots} spots available</span>
            )}
          </p>
        </div>

        {/* Enhanced Progress Bar */}
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Capacity Usage</span>
            <span className={`font-semibold ${
              capacityInfo.capacityPercentage >= 100 ? 'text-red-600' :
              capacityInfo.capacityPercentage >= 80 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {capacityInfo.capacityPercentage.toFixed(1)}% full
            </span>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${getProgressBarColor()}`}
              style={{ width: `${Math.min(capacityInfo.capacityPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
            {/* Milestone markers */}
            <div className="absolute top-0 right-1/4 w-px h-full bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 right-1/2 w-px h-full bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300 opacity-50"></div>
          </div>
        </div>

        {/* Enhanced Booking Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600 rounded-lg text-white shadow-sm">
                  <UserCheck className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-green-900">Confirmed</span>
              </div>
              <span className="text-2xl font-bold text-green-700">
                {capacityInfo.confirmedAttendees}
              </span>
            </div>
          </div>
          
          <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200 hover:shadow-md transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-600 rounded-lg text-white shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-yellow-900">Pending</span>
              </div>
              <span className="text-2xl font-bold text-yellow-700">
                {pendingBookings}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="border-t pt-4 space-y-3">
          {cancelledBookings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <UserX className="h-4 w-4" />
                <span>Cancelled bookings</span>
              </div>
              <span className="font-medium">{cancelledBookings}</span>
            </div>
          )}
          
          {capacityInfo.waitlistCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>On waitlist</span>
              </div>
              <span className="font-medium">{capacityInfo.waitlistCount}</span>
            </div>
          )}

          {/* Capacity Alert */}
          {capacityInfo.capacityPercentage >= 80 && capacityInfo.capacityPercentage < 100 && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Nearly full</p>
                <p className="text-yellow-700">
                  Only {capacityInfo.availableSpots} spots remaining. Consider opening a waitlist.
                </p>
              </div>
            </div>
          )}

          {capacityInfo.capacityPercentage >= 100 && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Session full</p>
                <p className="text-red-700">
                  No spots available. New bookings will be added to the waitlist.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="group flex items-center justify-center space-x-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 hover:shadow-sm">
            <TrendingUp className="h-5 w-5 text-gray-600 group-hover:text-primary-600 group-hover:scale-110 transition-all" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700">View Trends</span>
          </button>
          <button className="group flex items-center justify-center space-x-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 hover:shadow-sm">
            <Users className="h-5 w-5 text-gray-600 group-hover:text-primary-600 group-hover:scale-110 transition-all" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700">AI Suggest</span>
          </button>
        </div>
      </div>
    </AdminCard>
  );
};