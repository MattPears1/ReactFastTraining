import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Star, AlertCircle } from 'lucide-react';
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
  
  // Compact variant for mobile lists
  if (variant === 'compact') {
    return (
      <motion.div
        whileTap={!isFull ? { scale: 0.98 } : {}}
        className={cn(
          'relative p-3 sm:p-4 rounded-lg border cursor-pointer transition-all',
          courseConfig.color.border,
          courseConfig.color.background,
          isSelected && 'ring-2 ring-primary-500 ring-offset-1',
          isFull && 'opacity-60 cursor-not-allowed',
          'active:scale-[0.98]',
          className
        )}
        onClick={handleClick}
      >
        {isFull && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            FULL
          </div>
        )}
        
        <h4 className="font-medium text-sm sm:text-base mb-2 pr-12">{schedule.courseName}</h4>
        
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formatDate(schedule.startDate)}</span>
          </div>
          <span className="font-bold text-primary-600">£{schedule.pricePerPerson}</span>
        </div>
      </motion.div>
    );
  }
  
  // Default mobile-optimized card
  return (
    <motion.div
      whileTap={!isFull ? { scale: 0.98 } : {}}
      className={cn(
        'relative border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all shadow-sm',
        courseConfig.color.border,
        courseConfig.color.background,
        isSelected && 'ring-2 ring-primary-500 ring-offset-2',
        isFull && 'opacity-60 cursor-not-allowed',
        'active:scale-[0.98] hover:shadow-lg',
        className
      )}
      onClick={handleClick}
    >
      {/* Status badges - Mobile Optimized */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row gap-1 sm:gap-2">
        {isFull && (
          <div className="bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
            FULL
          </div>
        )}
        {isAlmostFull && !isFull && (
          <div className="bg-orange-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
            {schedule.availableSpots} LEFT
          </div>
        )}
        {countdown === 'Tomorrow' && (
          <div className="bg-primary-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
            TOMORROW
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Header Section */}
        <div className="pr-16 sm:pr-24">
          <h3 className="text-base sm:text-lg font-semibold leading-tight">
            {schedule.courseName}
          </h3>
        </div>
        
        {/* Info Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
          {/* Date & Time */}
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(schedule.startDate)}
              </div>
              <div className="text-xs">
                {formatTime(schedule.startDate)} - {formatTime(schedule.endDate)}
              </div>
              {countdown !== 'In the past' && (
                <div className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  {countdown}
                </div>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {schedule.venueName}
              </div>
              <div className="text-xs">
                {schedule.venueAddress.split(',')[0]}
              </div>
            </div>
          </div>
          
          {/* Availability */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 sm:col-span-2">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className={cn(
              "text-xs",
              isAlmostFull && !isFull && "text-orange-600 dark:text-orange-400 font-medium",
              isFull && "text-red-600 dark:text-red-400"
            )}>
              {isFull 
                ? 'Fully booked' 
                : `${schedule.availableSpots} of ${schedule.maxParticipants} spots available`
              }
            </span>
          </div>
        </div>
        
        {/* Instructor - Mobile */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Instructor: {schedule.instructorName}
        </p>
        
        {/* Price and Action - Mobile Optimized */}
        <div className="flex items-end justify-between pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Price per person</p>
            <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
              £{schedule.pricePerPerson}
            </p>
          </div>
          
          {!isFull && onSelect && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[40px] min-w-[100px]',
                isSelected 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {isSelected ? 'Selected' : 'Select'}
            </motion.button>
          )}
        </div>
        
        {/* Detailed variant extras */}
        {variant === 'detailed' && (
          <>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {courseConfig.description}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">4.9</span>
                <span className="text-xs text-gray-500">(127 reviews)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};