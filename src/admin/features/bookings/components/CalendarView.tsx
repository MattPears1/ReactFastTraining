import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  Plus
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths
} from 'date-fns';
import { AdminCard } from '../../../components/ui/AdminCard';
import { AdminBadge } from '../../../components/ui/AdminBadge';
import { useQuery } from '@tanstack/react-query';
import type { Booking, CourseSchedule } from '../../../../types/booking';

interface CalendarViewProps {
  bookings: Booking[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ bookings }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null);

  // Fetch course schedules
  const { data: schedules } = useQuery({
    queryKey: ['admin-schedules', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/admin/schedules?dateFrom=${start}&dateTo=${end}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json() as Promise<CourseSchedule[]>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules?.filter(s => s.date === dateStr) || [];
  };

  const getBookingsForSchedule = (schedule: CourseSchedule) => {
    return bookings.filter(b => 
      b.courseId === schedule.courseId && 
      b.courseDate === schedule.date &&
      b.courseTime === schedule.time
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <AdminCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousMonth}
              className="admin-btn admin-btn-secondary p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="admin-btn admin-btn-secondary"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="admin-btn admin-btn-secondary p-2"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Week days header */}
          {weekDays.map(day => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => {
            const daySchedules = getSchedulesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelectedDate = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return (
              <div
                key={idx}
                className={`
                  bg-white min-h-[100px] p-2 cursor-pointer transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isToday(day) ? 'bg-blue-50' : ''}
                  ${isSelectedDate ? 'ring-2 ring-primary-500' : ''}
                  hover:bg-gray-50
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${isToday(day) ? 'text-primary-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {daySchedules.length > 0 && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                      {daySchedules.length}
                    </span>
                  )}
                </div>

                {/* Show first 2 schedules */}
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map((schedule, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSchedule(schedule);
                      }}
                      className="text-xs p-1 bg-primary-50 rounded hover:bg-primary-100 cursor-pointer"
                    >
                      <p className="font-medium truncate">{schedule.courseName}</p>
                      <p className="text-gray-600">{schedule.time}</p>
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{daySchedules.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* Selected Date Details */}
      {selectedDate && (
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Courses on {format(selectedDate, 'EEEE, d MMMM yyyy')}
            </h3>
            <button className="admin-btn admin-btn-primary">
              <Plus className="admin-icon-sm" />
              Schedule Course
            </button>
          </div>

          <div className="space-y-4">
            {getSchedulesForDate(selectedDate).map((schedule) => {
              const scheduleBookings = getBookingsForSchedule(schedule);
              const capacityPercentage = (schedule.currentCapacity / schedule.maxCapacity) * 100;

              return (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{schedule.courseName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {schedule.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Instructor: {schedule.instructor}
                        </span>
                      </div>
                    </div>
                    <AdminBadge variant={schedule.status === 'scheduled' ? 'neutral' : 'success'}>
                      {schedule.status}
                    </AdminBadge>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">
                        {schedule.currentCapacity} / {schedule.maxCapacity} attendees
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          capacityPercentage >= 100 ? 'bg-red-500' :
                          capacityPercentage >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bookings Preview */}
                  {scheduleBookings.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Recent Bookings ({scheduleBookings.length})
                      </p>
                      <div className="space-y-1">
                        {scheduleBookings.slice(0, 3).map((booking, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{booking.customerName}</span>
                            <AdminBadge variant="success" size="sm">
                              {booking.paymentStatus}
                            </AdminBadge>
                          </div>
                        ))}
                        {scheduleBookings.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{scheduleBookings.length - 3} more bookings
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {getSchedulesForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No courses scheduled for this date</p>
              </div>
            )}
          </div>
        </AdminCard>
      )}

      {/* Schedule Details Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSchedule.courseName} - {format(parseISO(selectedSchedule.date), 'dd MMM yyyy')}
              </h2>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedSchedule.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-medium">{selectedSchedule.venue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="font-medium">{selectedSchedule.instructor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">
                    {selectedSchedule.currentCapacity} / {selectedSchedule.maxCapacity}
                  </p>
                </div>
              </div>

              {/* Bookings List */}
              <h3 className="text-lg font-semibold mb-4">Bookings</h3>
              <div className="space-y-3">
                {getBookingsForSchedule(selectedSchedule).map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                        <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <AdminBadge variant="success" className="mb-1">
                          {booking.status}
                        </AdminBadge>
                        <p className="text-sm text-gray-600">
                          {booking.attendees} {booking.attendees === 1 ? 'attendee' : 'attendees'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {getBookingsForSchedule(selectedSchedule).length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No bookings yet for this session
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button className="admin-btn admin-btn-primary">
                  <Mail className="admin-icon-sm" />
                  Email All Attendees
                </button>
                <button className="admin-btn admin-btn-secondary">
                  <Download className="admin-icon-sm" />
                  Export Attendee List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};