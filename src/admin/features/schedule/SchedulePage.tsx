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
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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

const mockSchedules: CourseSchedule[] = [
  {
    id: '1',
    courseName: 'Emergency First Aid at Work (EFAW)',
    courseType: 'EFAW',
    date: '2025-02-15',
    startTime: '09:00',
    endTime: '15:00',
    location: 'Leeds Training Centre',
    instructor: 'Lex Richardson',
    maxParticipants: 12,
    currentBookings: 8,
    status: 'scheduled',
    price: 75
  },
  {
    id: '2',
    courseName: 'First Aid at Work (FAW) - Day 1',
    courseType: 'FAW',
    date: '2025-02-20',
    startTime: '09:00',
    endTime: '17:00',
    location: 'Sheffield Training Centre',
    instructor: 'Lex Richardson',
    maxParticipants: 12,
    currentBookings: 12,
    status: 'scheduled',
    price: 150
  },
  {
    id: '3',
    courseName: 'Paediatric First Aid',
    courseType: 'PAEDIATRIC',
    date: '2025-02-25',
    startTime: '09:00',
    endTime: '15:00',
    location: 'York Training Centre',
    instructor: 'Lex Richardson',
    maxParticipants: 10,
    currentBookings: 6,
    status: 'scheduled',
    price: 85
  },
  {
    id: '4',
    courseName: 'Emergency First Aid at Work (EFAW)',
    courseType: 'EFAW',
    date: '2025-03-01',
    startTime: '09:00',
    endTime: '15:00',
    location: 'Bradford Training Centre',
    instructor: 'Lex Richardson',
    maxParticipants: 12,
    currentBookings: 4,
    status: 'scheduled',
    price: 75
  }
];

export const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['admin-schedules', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSchedules;
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting schedule:', scheduleId);
    },
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
          <Button className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

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
        </div>
      ) : (
        /* List View */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules?.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.courseName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.instructor}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <div>
                          <div>{new Date(schedule.date).toLocaleDateString()}</div>
                          <div className="text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-2" />
                        {schedule.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span className={`text-sm font-medium ${getAvailabilityColor(schedule.currentBookings, schedule.maxParticipants)}`}>
                          {schedule.currentBookings}/{schedule.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            schedule.currentBookings >= schedule.maxParticipants
                              ? 'bg-red-500'
                              : schedule.currentBookings >= schedule.maxParticipants * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(schedule.currentBookings / schedule.maxParticipants) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(schedule.status)}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                          className="text-gray-400 hover:text-red-600"
                          disabled={deleteScheduleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};