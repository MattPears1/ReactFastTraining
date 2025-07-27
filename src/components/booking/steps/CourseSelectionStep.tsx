import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { courseApi } from '@/services/api/courses';
import { CapacityIndicator } from '../CapacityIndicator';
import { CourseSession } from '../BookingWizard';

interface CourseSelectionStepProps {
  onNext: (session: CourseSession) => void;
}

export const CourseSelectionStep: React.FC<CourseSelectionStepProps> = ({ onNext }) => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    courseType: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const data = await courseApi.getAvailableSessions(filters);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Mock data for now
      setSessions([
        {
          id: '1',
          courseId: 'efaw',
          courseType: 'Emergency First Aid at Work',
          sessionDate: '2024-02-15',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Leeds City Centre',
          price: 75,
          maxParticipants: 12,
          currentBookings: 5,
          status: 'scheduled',
        },
        {
          id: '2',
          courseId: 'faw',
          courseType: 'First Aid at Work',
          sessionDate: '2024-02-20',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Sheffield Training Centre',
          price: 200,
          maxParticipants: 12,
          currentBookings: 10,
          status: 'scheduled',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const session = sessions.find(s => s.id === selectedSession);
    if (session) {
      onNext(session);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const courseTypes = [
    { value: '', label: 'All Courses' },
    { value: 'Emergency First Aid at Work', label: 'Emergency First Aid at Work' },
    { value: 'First Aid at Work', label: 'First Aid at Work' },
    { value: 'Paediatric First Aid', label: 'Paediatric First Aid' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Select Your Course</h2>
        <p className="text-gray-600">Choose from our available training sessions</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={filters.courseType}
          onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {courseTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {months.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>

        <select
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {/* Session List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sessions available for selected criteria
          </div>
        ) : (
          sessions.map(session => (
            <label
              key={session.id}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedSession === session.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="session"
                value={session.id}
                checked={selectedSession === session.id}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="sr-only"
              />
              
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{session.courseType}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.sessionDate), 'EEEE, d MMMM yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {session.startTime} - {session.endTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {session.location}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-4 text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    £{session.price}
                  </p>
                  <p className="text-sm text-gray-500">per person</p>
                  <div className="mt-2">
                    <CapacityIndicator
                      current={session.currentBookings}
                      max={session.maxParticipants}
                      size="sm"
                      showNumbers={false}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {session.maxParticipants - session.currentBookings} spots left
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedSession}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};