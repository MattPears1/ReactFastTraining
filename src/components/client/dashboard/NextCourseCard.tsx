import React from 'react';
import { Calendar, Clock, MapPin, Users, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CourseCountdown } from './CourseCountdown';
import { clientPortalService } from '@/services/client';
import type { NextCourse } from '@/types/client';

interface NextCourseCardProps {
  course: NextCourse;
  onUpdate: () => void;
}

export const NextCourseCard: React.FC<NextCourseCardProps> = ({ course, onUpdate }) => {
  const getTimeUntilMessage = () => {
    if (course.isToday) return "Today!";
    if (course.isTomorrow) return "Tomorrow";
    if (course.daysUntil <= 7) return `In ${course.daysUntil} days`;
    return format(new Date(course.session.sessionDate), 'EEEE, MMMM d');
  };

  const getUrgencyColor = () => {
    if (course.isToday) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    if (course.isTomorrow) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    if (course.isThisWeek) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
  };

  const downloadPreMaterials = async () => {
    try {
      const materials = await clientPortalService.getPreCourseMaterials(course.booking.id);
      // Handle materials download - this would typically open a modal or navigate to materials page
      console.log('Materials:', materials);
    } catch (error) {
      console.error('Failed to download materials:', error);
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 sm:p-6 mb-6 ${getUrgencyColor()}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your Next Course</h3>
            {course.isToday && (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-full text-sm font-medium animate-pulse">
                TODAY
              </span>
            )}
          </div>
          
          <h4 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
            {course.session.courseType}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">{getTimeUntilMessage()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{course.session.startTime} - {course.session.endTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{course.session.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{course.attendeeCount} attendee{course.attendeeCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {course.specialRequirements && course.specialRequirements.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Special Requirements Noted
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    We have your requirements on file and will ensure accommodations are ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:mt-0">
          <Link
            to={`/client/bookings/${course.booking.id}`}
            className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base touch-target"
          >
            View Details
          </Link>
          
          {course.preMaterials && (
            <button
              onClick={downloadPreMaterials}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base touch-target"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Pre-Course Materials</span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown for today's course */}
      {course.isToday && <CourseCountdown startTime={course.session.startTime} />}
    </div>
  );
};