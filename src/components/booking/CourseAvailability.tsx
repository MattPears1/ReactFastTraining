import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-react'
import { bookingApi } from '@services/api.service'
import { cn } from '@utils/cn'
import { mockCourseSchedules } from '@/mocks/bookingData'

interface CourseSchedule {
  id: number
  courseType: string
  courseName: string
  startDate: string
  endDate: string
  venue: string
  venueName: string
  venueAddress: string
  availableSpots: number
  maxParticipants: number
  pricePerPerson: number
  instructorName: string
}

interface CourseAvailabilityProps {
  courseType?: string
  onSelectCourse: (schedule: CourseSchedule) => void
  selectedScheduleId?: number
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit',
    minute: '2-digit'
  })
}

const courseColors = {
  EFAW: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  FAW: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  PAEDIATRIC: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  MENTAL_HEALTH: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
}

export const CourseAvailability: React.FC<CourseAvailabilityProps> = ({
  courseType,
  onSelectCourse,
  selectedScheduleId
}) => {
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableCourses()
  }, [courseType])

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use mock data for now
      setTimeout(() => {
        let filteredSchedules = mockCourseSchedules
        if (courseType) {
          filteredSchedules = mockCourseSchedules.filter(s => s.courseType === courseType)
        }
        setSchedules(filteredSchedules)
        setLoading(false)
      }, 500)
      
      // TODO: Replace with real API call when backend is ready
      // const response = await bookingApi.getAvailableCourses({ 
      //   courseType,
      //   venue: undefined,
      //   month: undefined
      // })
      
      // if (response.success && response.data) {
      //   setSchedules(response.data)
      // }
    } catch (err) {
      setError('Failed to load available courses. Please try again.')
      console.error('Error fetching courses:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={fetchAvailableCourses}
          className="btn btn-outline"
        >
          Try Again
        </button>
      </div>
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
        const borderColor = courseColors[schedule.courseType as keyof typeof courseColors] || 'border-gray-300'
        
        return (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative border-2 rounded-xl p-6 cursor-pointer transition-all',
              borderColor,
              isSelected && 'ring-2 ring-primary-500 ring-offset-2',
              isFull && 'opacity-60 cursor-not-allowed',
              !isFull && !isSelected && 'hover:shadow-lg'
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