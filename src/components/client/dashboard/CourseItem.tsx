import React, { memo } from 'react';
import { Calendar, Clock, MapPin, Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import type { UpcomingCourse } from '@/types/client';

interface CourseItemProps {
  course: UpcomingCourse;
  onReschedule: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  isLoading?: boolean;
}

const CourseItemComponent: React.FC<CourseItemProps> = ({ 
  course, 
  onReschedule, 
  onCancel,
  isLoading = false 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {course.session.courseType}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{format(new Date(course.session.sessionDate), 'EEE, MMM d')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{course.session.startTime} - {course.session.endTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{course.session.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{course.attendeeCount} attendee{course.attendeeCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="mt-3 text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400">Booking Reference:</span>
            <span className="ml-1 sm:ml-2 font-mono text-gray-700 dark:text-gray-300 break-all">
              {course.booking.bookingReference}
            </span>
          </div>
        </div>

        <Menu as="div" className="relative self-start sm:self-center">
          <Menu.Button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 touch-target"
            aria-label="Course actions menu"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </Menu.Button>
          
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to={`/client/bookings/${course.booking.id}`}
                  className={`block px-4 py-2 text-sm ${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } text-gray-700 dark:text-gray-300`}
                >
                  View Details
                </Link>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onReschedule(course.booking.id)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } text-gray-700 dark:text-gray-300`}
                  disabled={isLoading}
                >
                  Reschedule
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onCancel(course.booking.id)}
                  disabled={isLoading}
                  className={`block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 ${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel Booking
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
};

export const CourseItem = memo(CourseItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.course.booking.id === nextProps.course.booking.id &&
    prevProps.course.booking.status === nextProps.course.booking.status &&
    prevProps.isLoading === nextProps.isLoading
  );
});