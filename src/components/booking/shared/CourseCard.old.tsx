import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Star } from 'lucide-react';
import { cn } from '@utils/cn';
import { CourseSchedule } from '@/types/booking.types';
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config';
import { formatDate, formatTime, formatCountdown } from '@/utils/dateFormatting';

interface CourseCardProps {
  schedule: CourseSchedule;
  isSelected?: boolean;
  onSelect?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  schedule,
  isSelected = false,
  onSelect,
  variant = 'default',
  className
}) => {
  const courseConfig = COURSE_TYPE_CONFIG[schedule.courseType];
  const isFull = schedule.availableSpots === 0;
  const isAlmostFull = schedule.availableSpots > 0 && schedule.availableSpots <= 3;
  const countdown = formatCountdown(schedule.startDate);
  
  const handleClick = () => {
    if (!isFull && onSelect) {
      onSelect();
    }
  };
  
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={!isFull ? { scale: 1.02 } : {}}
        whileTap={!isFull ? { scale: 0.98 } : {}}
        className={cn(
          'relative p-4 rounded-lg border cursor-pointer transition-all',
          courseConfig.color.border,
          courseConfig.color.background,
          isSelected && 'ring-2 ring-primary-500 ring-offset-2',
          isFull && 'opacity-60 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
      >
        {isFull && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            FULL
          </div>
        )}
        
        <h4 className="font-medium mb-2">{schedule.courseName}</h4>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(schedule.startDate)}</span>
          </div>
          <span className="font-bold text-primary-600">£{schedule.pricePerPerson}</span>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={!isFull ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isFull ? { scale: 0.98 } : {}}
      className={cn(
        'relative border-2 rounded-xl p-6 cursor-pointer transition-all shadow-sm hover:shadow-lg',
        courseConfig.color.border,
        courseConfig.color.background,
        isSelected && 'ring-2 ring-primary-500 ring-offset-2',
        isFull && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      {/* Status badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isFull && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            FULLY BOOKED
          </div>
        )}
        {isAlmostFull && !isFull && (
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            LAST {schedule.availableSpots} SPOTS
          </div>
        )}
        {countdown === 'Tomorrow' && (
          <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            TOMORROW
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-3">
            {schedule.courseName}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(schedule.startDate)}</span>
              <span className="text-gray-400">•</span>
              <span className="font-medium">{countdown}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{formatTime(schedule.startDate)} - {formatTime(schedule.endDate)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{schedule.venueName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                {schedule.availableSpots} of {schedule.maxParticipants} spots available
              </span>
            </div>
          </div>
          
          {variant === 'detailed' && (
            <>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {courseConfig.description}
                </p>
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
                <span className="text-sm text-gray-500">(127 reviews)</span>
              </div>
            </>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            Instructor: {schedule.instructorName}
          </p>
        </div>
        
        <div className="flex flex-col items-end justify-between h-full">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              £{schedule.pricePerPerson}
            </p>
            <p className="text-sm text-gray-500">per person</p>
          </div>
          
          {!isFull && onSelect && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'mt-4 px-4 py-2 rounded-lg font-medium transition-colors',
                isSelected 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {isSelected ? 'Selected' : 'Select Course'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};