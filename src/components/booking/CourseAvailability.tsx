import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@utils/cn'
import { CourseSchedule, CourseTypeCode } from '@/types/booking.types'
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config'
import { bookingService } from '@/services/booking.service'
import { formatDate, formatTime, formatCountdown } from '@/utils/dateFormatting'

interface CourseAvailabilityProps {
  courseType?: CourseTypeCode
  onSelectCourse: (schedule: CourseSchedule) => void
  selectedScheduleId?: number
}

export const CourseAvailability: React.FC<CourseAvailabilityProps> = ({
  courseType,
  onSelectCourse,
  selectedScheduleId
}) => {
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    fetchAvailableCourses()
  }, [courseType])

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const schedules = await bookingService.getAvailableCourses({ 
        courseType,
        showFullCourses: false
      })
      
      setSchedules(schedules)
    } catch (err) {
      setError('Failed to load available courses. Please try again.')
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchAvailableCourses()
  }

  if (loading) {
    return <CourseAvailabilitySkeleton />
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
      >
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Unable to Load Courses</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="btn btn-outline btn-sm inline-flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", retryCount > 0 && "animate-spin")} />
          Try Again
        </button>
      </motion.div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {courseType 
            ? `No ${courseType} courses are currently scheduled.`
            : 'No courses are currently available.'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Please check back later or contact us for more information.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const isSelected = selectedScheduleId === schedule.id
        const isFull = schedule.availableSpots === 0
        const courseConfig = COURSE_TYPE_CONFIG[schedule.courseType]
        
        return (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative border-2 rounded-xl p-6 cursor-pointer transition-all',
              courseConfig.color.border,
              courseConfig.color.background,
              isSelected && 'ring-2 ring-primary-500 ring-offset-2',
              isFull && 'opacity-60 cursor-not-allowed',
              !isFull && !isSelected && 'hover:shadow-lg hover:scale-[1.02]'
            )}
            onClick={() => !isFull && onSelectCourse(schedule)}
          >
            {isFull && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                FULLY BOOKED
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {schedule.courseName}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(schedule.startDate)}
                      {schedule.startDate !== schedule.endDate && (
                        <> - {formatDate(schedule.endDate)}</>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(schedule.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{schedule.venueName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {schedule.availableSpots} of {schedule.maxParticipants} spots available
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
                
                {!isFull && (
                  <motion.div
                    className="mt-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      className={cn(
                        'btn btn-sm',
                        isSelected ? 'btn-primary' : 'btn-outline'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectCourse(schedule)
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

const CourseAvailabilitySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}