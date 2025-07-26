import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { CourseAvailability } from '@components/booking/CourseAvailability'
import { BookingForm } from '@components/booking/BookingForm'
import { BookingConfirmation } from '@components/booking/BookingConfirmation'
import SEO from '@components/common/SEO'
import { cn } from '@utils/cn'

type BookingStep = 'select-course' | 'details' | 'confirmation'

interface SelectedCourse {
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

interface BookingDetails {
  confirmationCode: string
  totalPrice: number
  contactEmail: string
  contactPhone: string
  numberOfParticipants: number
}

const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const courseType = searchParams.get('course') || undefined
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('select-course')
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  
  const stepConfig = {
    'select-course': {
      title: 'Select a Course Date',
      description: 'Choose from our available training dates'
    },
    'details': {
      title: 'Booking Details',
      description: 'Enter your contact and participant information'
    },
    'confirmation': {
      title: 'Booking Confirmed',
      description: 'Your training course has been booked successfully'
    }
  }
  
  const handleCourseSelect = (course: SelectedCourse) => {
    setSelectedCourse(course)
    setCurrentStep('details')
  }
  
  const handleBookingSuccess = (confirmationCode: string, totalPrice: number, email: string, phone: string, participants: number) => {
    setBookingDetails({
      confirmationCode,
      totalPrice,
      contactEmail: email,
      contactPhone: phone,
      numberOfParticipants: participants
    })
    setCurrentStep('confirmation')
  }
  
  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('select-course')
    } else if (currentStep === 'select-course') {
      navigate(-1)
    }
  }
  
  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])
  
  return (
    <>
      <SEO 
        title="Book a First Aid Training Course"
        description="Book your first aid training course with React Fast Training. Choose from available dates in Sheffield and secure your spot today."
        keywords="book first aid course, first aid training booking, Sheffield first aid courses, EFAW booking, FAW booking"
      />
      
      <main className="py-20 lg:py-24">
        <div className="container">
          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-700" />
              
              {(['select-course', 'details', 'confirmation'] as BookingStep[]).map((step, index) => {
                const isActive = currentStep === step
                const isCompleted = 
                  (step === 'select-course' && (currentStep === 'details' || currentStep === 'confirmation')) ||
                  (step === 'details' && currentStep === 'confirmation')
                
                return (
                  <div
                    key={step}
                    className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all",
                      isActive && "bg-primary-600 text-white scale-110",
                      isCompleted && "bg-green-500 text-white",
                      !isActive && !isCompleted && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                )
              })}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Select Course</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Your Details</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Confirmation</span>
            </div>
          </div>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              {currentStep !== 'confirmation' && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 ml-auto">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">React Fast Training</span>
              </div>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              {stepConfig[currentStep].title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {stepConfig[currentStep].description}
            </p>
          </motion.div>
          
          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {currentStep === 'select-course' && (
              <motion.div
                key="select-course"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CourseAvailability
                  courseType={courseType}
                  onSelectCourse={handleCourseSelect}
                  selectedScheduleId={selectedCourse?.id}
                />
              </motion.div>
            )}
            
            {currentStep === 'details' && selectedCourse && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BookingForm
                  courseScheduleId={selectedCourse.id}
                  courseName={selectedCourse.courseName}
                  courseDate={selectedCourse.startDate}
                  pricePerPerson={selectedCourse.pricePerPerson}
                  maxParticipants={selectedCourse.availableSpots}
                  onSuccess={(code, price, email, phone, participants) => {
                    handleBookingSuccess(code, price, email, phone, participants)
                  }}
                  onCancel={() => setCurrentStep('select-course')}
                />
              </motion.div>
            )}
            
            {currentStep === 'confirmation' && selectedCourse && bookingDetails && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <BookingConfirmation
                  confirmationCode={bookingDetails.confirmationCode}
                  courseName={selectedCourse.courseName}
                  courseDate={new Date(selectedCourse.startDate).toLocaleDateString('en-GB', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  venue={selectedCourse.venueName}
                  numberOfParticipants={bookingDetails.numberOfParticipants}
                  totalPrice={bookingDetails.totalPrice}
                  contactEmail={bookingDetails.contactEmail}
                  contactPhone={bookingDetails.contactPhone}
                />
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default BookingPage