import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { CourseAvailability } from '@components/booking/CourseAvailability'
import { BookingForm } from '@components/booking/BookingForm'
import { BookingConfirmation } from '@components/booking/BookingConfirmation'
import { BookingInquiryForm } from '@components/booking/BookingInquiryForm'
import SEO from '@components/common/SEO'
import { cn } from '@utils/cn'
import { useToast } from '@contexts/ToastContext'

type BookingStep = 'select-course' | 'details' | 'confirmation' | 'inquiry' | 'inquiry-sent'

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
  const { showToast } = useToast()
  const courseType = searchParams.get('course') || undefined
  const inquiryRef = searchParams.get('inquiry') || undefined
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('select-course')
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [inquiryData, setInquiryData] = useState<any>(null)
  const [loadingInquiry, setLoadingInquiry] = useState(false)
  
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
    },
    'inquiry': {
      title: 'Course Inquiry',
      description: 'Send us your questions and booking request'
    },
    'inquiry-sent': {
      title: 'Inquiry Sent',
      description: 'We\'ll respond to your inquiry within 24 hours'
    }
  }
  
  const handleCourseSelect = (course: SelectedCourse & { isInquiry?: boolean }) => {
    setSelectedCourse(course)
    if (course.isInquiry) {
      setCurrentStep('inquiry')
    } else {
      setCurrentStep('details')
    }
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
    if (currentStep === 'details' || currentStep === 'inquiry') {
      setCurrentStep('select-course')
    } else if (currentStep === 'select-course') {
      navigate(-1)
    } else if (currentStep === 'inquiry-sent') {
      navigate('/')
    }
  }
  
  const handleInquirySuccess = () => {
    setCurrentStep('inquiry-sent')
  }
  
  // Load inquiry data if reference is provided
  useEffect(() => {
    if (inquiryRef) {
      setLoadingInquiry(true)
      fetch(`/api/bookings/inquiry/${inquiryRef}`)
        .then(res => {
          if (!res.ok) throw new Error('Inquiry not found')
          return res.json()
        })
        .then(data => {
          setInquiryData(data.inquiry)
          // If session is still available, pre-select it
          if (data.session.stillAvailable) {
            const courseDetails = data.inquiry.courseDetails
            setSelectedCourse({
              id: parseInt(data.session.id),
              courseType: courseDetails.courseName.toLowerCase().replace(/ /g, '-'),
              courseName: courseDetails.courseName,
              startDate: new Date(courseDetails.date).toISOString(),
              endDate: new Date(courseDetails.date).toISOString(),
              venue: courseDetails.venue,
              venueName: courseDetails.venue,
              venueAddress: '',
              availableSpots: data.session.availableSpaces,
              maxParticipants: data.session.availableSpaces + data.inquiry.numberOfPeople,
              pricePerPerson: courseDetails.price,
              instructorName: 'Lex'
            })
            setCurrentStep('details')
            showToast('success', 'Your inquiry details have been loaded. Please complete your booking.')
          } else {
            showToast('error', 'Sorry, there are no longer enough spaces available for your group.')
          }
        })
        .catch(err => {
          showToast('error', 'Could not load your inquiry. It may have expired or been used already.')
          console.error('Failed to load inquiry:', err)
        })
        .finally(() => setLoadingInquiry(false))
    }
  }, [inquiryRef])
  
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
      
      <div className="py-20 lg:py-24">
        <div className="container">
          {/* Loading state for inquiry */}
          {loadingInquiry && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-800">Loading your inquiry details...</p>
              </div>
            </div>
          )}
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
                  inquiryData={inquiryData}
                  onSuccess={(code, price, email, phone, participants) => {
                    handleBookingSuccess(code, price, email, phone, participants)
                    // Mark inquiry as converted if we have one
                    if (inquiryRef) {
                      fetch(`/api/bookings/inquiry/${inquiryRef}/expire`, { method: 'POST' })
                    }
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
            
            {currentStep === 'inquiry' && selectedCourse && (
              <motion.div
                key="inquiry"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BookingInquiryForm
                  courseSchedule={{
                    id: selectedCourse.id.toString(),
                    courseType: selectedCourse.courseType,
                    startDate: selectedCourse.startDate,
                    endDate: selectedCourse.endDate,
                    startTime: new Date(selectedCourse.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    endTime: new Date(selectedCourse.endDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    venue: {
                      id: selectedCourse.venue,
                      name: selectedCourse.venueName,
                      address: selectedCourse.venueAddress
                    },
                    pricePerPerson: selectedCourse.pricePerPerson,
                    availableSpaces: selectedCourse.availableSpots
                  }}
                  onSuccess={handleInquirySuccess}
                  onCancel={() => setCurrentStep('select-course')}
                />
              </motion.div>
            )}
            
            {currentStep === 'inquiry-sent' && (
              <motion.div
                key="inquiry-sent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Inquiry Sent Successfully!</h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Thank you for your interest. We've received your inquiry and will respond within 24 hours.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                      <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                      <ul className="space-y-2 text-blue-800">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">1.</span>
                          Our instructor will review your inquiry and check availability
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">2.</span>
                          You'll receive a detailed response answering any questions
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">3.</span>
                          We'll provide instructions on how to complete your booking
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">4.</span>
                          Once confirmed, you'll receive full course details
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600 mt-6">
                      Check your email for a confirmation of your inquiry. If you don't see it, please check your spam folder.
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Return to Homepage
                    </button>
                    <button
                      onClick={() => setCurrentStep('select-course')}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Browse More Courses
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookingPage