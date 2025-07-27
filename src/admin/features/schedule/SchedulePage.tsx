import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminTable } from '../../components/ui/AdminTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminCourseSessionService } from '../../services/course-session.service';
import { AddSessionModal } from '../../components/modals/AddSessionModal';

interface CourseSchedule {
  id: string;
  courseName: string;
  courseType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor: string;
  maxParticipants: number;
  currentBookings: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
}

export const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['admin-schedules', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      // DEBUG: Environment and configuration
      console.log('🔍 DEBUG: Schedule page query starting');
      console.log('🔍 DEBUG: import.meta.env.PROD:', import.meta.env.PROD);
      console.log('🔍 DEBUG: import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('🔍 DEBUG: window.location.origin:', window.location.origin);
      
      // In production, use the same domain as the frontend
      const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const token = localStorage.getItem('adminAccessToken');
      
      console.log('🔍 DEBUG: Calculated apiUrl:', apiUrl);
      console.log('🔍 DEBUG: Token exists:', !!token);
      console.log('🔍 DEBUG: Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      const fullUrl = `${apiUrl}/course-sessions`;
      console.log('🔍 DEBUG: Full request URL:', fullUrl);
      
      try {
        console.log('🔍 DEBUG: Making fetch request...');
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('🔍 DEBUG: Response received');
        console.log('🔍 DEBUG: Response status:', response.status);
        console.log('🔍 DEBUG: Response statusText:', response.statusText);
        console.log('🔍 DEBUG: Response ok:', response.ok);
        console.log('🔍 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok && response.status !== 304) {
          const errorText = await response.text();
          console.error('🔍 DEBUG: Error response body:', errorText);
          throw new Error(`Failed to fetch course sessions: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        // Handle 304 Not Modified - return empty array as we can't get the body
        if (response.status === 304) {
          console.log('🔍 DEBUG: 304 Not Modified response, returning empty array');
          return [];
        }
        
        console.log('🔍 DEBUG: Parsing JSON response...');
        const courseSessions = await response.json();
        console.log('🔍 DEBUG: Raw course sessions data:', courseSessions);
        console.log('🔍 DEBUG: Number of sessions:', courseSessions?.length || 0);
        
        if (!Array.isArray(courseSessions)) {
          console.error('🔍 DEBUG: Response is not an array:', typeof courseSessions);
          throw new Error('Invalid response format: expected array');
        }
        
        // Transform course sessions to match frontend interface
        const transformedSessions = courseSessions.map((session: any, index: number) => {
          console.log(`🔍 DEBUG: Transforming session ${index}:`, session);
          
          const transformed = {
            id: session.id,
            courseName: session.course?.name || 'Unknown Course',
            courseType: session.course?.type || session.course?.name || 'Unknown',
            date: session.startDate ? session.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location?.name || session.location?.address || 'Unknown Location',
            instructor: session.trainer?.name || 'Lex Richardson',
            maxParticipants: session.maxParticipants,
            currentBookings: session.currentParticipants || 0,
            status: session.status?.toLowerCase() || 'scheduled',
            price: session.pricePerPerson || 0
          };
          
          console.log(`🔍 DEBUG: Transformed session ${index}:`, transformed);
          return transformed;
        });
        
        console.log('🔍 DEBUG: Final transformed sessions:', transformedSessions);
        return transformedSessions;
      } catch (error) {
        console.error('🔍 DEBUG: Course sessions API failed with error:', error);
        console.error('🔍 DEBUG: Error name:', error.name);
        console.error('🔍 DEBUG: Error message:', error.message);
        console.error('🔍 DEBUG: Error stack:', error.stack);
        throw error; // Let React Query handle the error state
      }
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) => adminCourseSessionService.deleteSession(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAvailabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'scheduled':
        return 'neutral';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSchedulesForDate = (date: Date) => {
    if (!schedules) return [];
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load schedule</p>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage course schedules
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'calendar'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'list'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <AdminCard
          title={`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          icon={CalendarIcon}
          iconColor="primary"
          noPadding
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="admin-btn admin-btn-secondary p-2"
              >
                <ChevronLeft className="admin-icon-sm" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="admin-btn admin-btn-secondary p-2"
              >
                <ChevronRight className="admin-icon-sm" />
              </button>
            </div>
          }
        >

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border-r border-gray-200">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 border-b border-gray-200 text-center"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const isCurrentMonth = day !== null;
              const isToday = day && day.toDateString() === new Date().toDateString();
              const daySchedules = day ? getSchedulesForDate(day) : [];
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-b border-l border-gray-200 p-1 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm mb-1 ${isToday ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {daySchedules.slice(0, 2).map(schedule => (
                          <div
                            key={schedule.id}
                            className="text-xs p-1 rounded bg-primary-100 text-primary-800 cursor-pointer hover:bg-primary-200"
                            title={`${schedule.courseName} - ${schedule.startTime}`}
                          >
                            <div className="font-medium truncate">{schedule.courseType}</div>
                            <div className="flex items-center justify-between">
                              <span>{schedule.startTime}</span>
                              <span className={getAvailabilityColor(schedule.currentBookings, schedule.maxParticipants)}>
                                {schedule.currentBookings}/{schedule.maxParticipants}
                              </span>
                            </div>
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{daySchedules.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </AdminCard>
      ) : (
        /* List View */
        <AdminTable
          columns={[
            {
              key: 'course',
              header: 'Course',
              render: (schedule: CourseSchedule) => (
                <div>
                  <div className="font-medium text-gray-900">
                    {schedule.courseName}
                  </div>
                  <div className="admin-text-small admin-text-muted">
                    {schedule.instructor}
                  </div>
                </div>
              ),
            },
            {
              key: 'datetime',
              header: 'Date & Time',
              render: (schedule: CourseSchedule) => (
                <div className="flex items-center text-gray-900">
                  <CalendarIcon className="admin-icon-md mr-2 text-primary-500" />
                  <div>
                    <div>{new Date(schedule.date).toLocaleDateString()}</div>
                    <div className="admin-text-small admin-text-muted flex items-center">
                      <Clock className="admin-icon-sm mr-1" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'location',
              header: 'Location',
              render: (schedule: CourseSchedule) => (
                <div className="flex items-center text-gray-900">
                  <MapPin className="admin-icon-md mr-2 text-primary-500" />
                  {schedule.location}
                </div>
              ),
            },
            {
              key: 'bookings',
              header: 'Bookings',
              render: (schedule: CourseSchedule) => (
                <div>
                  <div className="flex items-center">
                    <Users className="admin-icon-md mr-2 text-primary-500" />
                    <span className={`font-medium ${getAvailabilityColor(schedule.currentBookings, schedule.maxParticipants)}`}>
                      {schedule.currentBookings}/{schedule.maxParticipants}
                    </span>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        schedule.currentBookings >= schedule.maxParticipants
                          ? 'bg-red-500'
                          : schedule.currentBookings >= schedule.maxParticipants * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((schedule.currentBookings / schedule.maxParticipants) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (schedule: CourseSchedule) => (
                <AdminBadge variant={getStatusVariant(schedule.status)}>
                  {schedule.status}
                </AdminBadge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (schedule: CourseSchedule) => (
                <div className="flex justify-end gap-1">
                  <button className="admin-btn admin-btn-secondary p-2" title="View">
                    <Eye className="admin-icon-sm" />
                  </button>
                  <button className="admin-btn admin-btn-secondary p-2" title="Edit">
                    <Edit3 className="admin-icon-sm" />
                  </button>
                  <button 
                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                    className="admin-btn admin-btn-secondary p-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    disabled={deleteScheduleMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 className="admin-icon-sm" />
                  </button>
                </div>
              ),
            },
          ]}
          data={schedules || []}
          keyExtractor={(schedule) => schedule.id}
          loading={false}
          emptyMessage="No scheduled courses found"
          emptyIcon={<CalendarIcon className="w-12 h-12" />}
        />
      )}
      
      {/* Add Session Modal */}
      <AddSessionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};