import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BookOpen, Shield, Clock, Award } from 'lucide-react';
import { CourseAvailabilityEnhanced } from '@components/booking/CourseAvailabilityEnhanced';
import { BookingFormEnhanced } from '@components/booking/BookingFormEnhanced';
import { BookingConfirmation } from '@components/booking/BookingConfirmation';
import { BookingSteps, BookingStep } from '@components/booking/shared/BookingSteps';
import { PricingSummary } from '@components/booking/shared/PricingSummary';
import { BookingTestimonial } from '@components/booking/shared/BookingTestimonial';
import { BookingFAQ } from '@components/booking/shared/BookingFAQ';
import SEO from '@components/common/SEO';
import { cn } from '@utils/cn';
import { CourseSchedule, BookingStatus } from '@/types/booking.types';
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config';
import { VENUE_CONFIG } from '@/config/venues.config';
import { useToast } from '@contexts/ToastContext';

interface BookingDetails {
  confirmationCode: string;
  booking: {
    id: string;
    status: BookingStatus;
    totalPrice: number;
    contactEmail: string;
    contactPhone: string;
    numberOfParticipants: number;
    courseSchedule: CourseSchedule;
  };
}

const BookingPageEnhanced: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const courseTypeParam = searchParams.get('course');
  const venueParam = searchParams.get('venue');
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('select-course');
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [completedSteps, setCompletedSteps] = useState<BookingStep[]>([]);
  
  const handleCourseSelect = (schedule: CourseSchedule) => {
    setSelectedSchedule(schedule);
    setCurrentStep('details');
    setCompletedSteps(['select-course']);
  };
  
  const handleBookingSuccess = (confirmationCode: string, booking: any) => {
    // Adapt the booking object to match our expected interface
    const adaptedBooking = {
      id: booking.id || '',
      status: booking.status || booking.bookingStatus || 'confirmed',
      totalPrice: booking.totalPrice || booking.totalAmount || 0,
      contactEmail: booking.contactEmail || booking.primaryContact?.email || booking.email || '',
      contactPhone: booking.contactPhone || booking.primaryContact?.phone || booking.phone || '',
      numberOfParticipants: booking.numberOfParticipants || 1,
      courseSchedule: booking.courseSchedule || selectedSchedule
    };
    
    setBookingDetails({
      confirmationCode,
      booking: adaptedBooking
    });
    setCurrentStep('confirmation');
    setCompletedSteps(['select-course', 'details', 'payment']);
  };
  
  const handleStepClick = (step: BookingStep) => {
    if (step === 'select-course' || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };
  
  const handleBack = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('select-course');
        break;
      case 'payment':
        setCurrentStep('details');
        break;
      case 'select-course':
        navigate(-1);
        break;
    }
  };
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);
  
  const trustBadges = [
    { icon: Shield, text: 'Secure Booking', color: 'text-green-600' },
    { icon: Clock, text: 'Instant Confirmation', color: 'text-blue-600' },
    { icon: Award, text: 'HSE Approved', color: 'text-purple-600' }
  ];
  
  return (
    <>
      <SEO 
        title="Book Your First Aid Training Course | React Fast Training"
        description="Book your HSE approved first aid training course with React Fast Training. Choose from available dates across Yorkshire. Secure online booking with instant confirmation."
        keywords="book first aid course, first aid training booking, Yorkshire first aid courses, EFAW booking, FAW booking, paediatric first aid booking"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="container py-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
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
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                {trustBadges.map((badge, index) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <badge.icon className={cn('w-5 h-5', badge.color)} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {badge.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              {/* Progress Steps */}
              <BookingSteps
                currentStep={currentStep}
                onStepClick={handleStepClick}
                completedSteps={completedSteps}
              />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {currentStep === 'select-course' && (
                    <motion.div
                      key="select-course"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-2">Select Your Course Date</h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Choose from our available training dates across Yorkshire
                      </p>
                      
                      <CourseAvailabilityEnhanced
                        courseType={courseTypeParam || undefined}
                        venue={venueParam || undefined}
                        onSelectCourse={(schedule) => {
                          handleCourseSelect(schedule as CourseSchedule);
                        }}
                        selectedScheduleId={selectedSchedule?.id}
                      />
                    </motion.div>
                  )}
                  
                  {currentStep === 'details' && selectedSchedule && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-2">Enter Your Details</h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please provide your contact information and participant details
                      </p>
                      
                      <BookingFormEnhanced
                        courseSchedule={selectedSchedule}
                        onSuccess={handleBookingSuccess}
                        onCancel={() => setCurrentStep('select-course')}
                      />
                    </motion.div>
                  )}
                  
                  {currentStep === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-6">Payment</h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        Payment integration coming soon...
                      </p>
                    </motion.div>
                  )}
                  
                  {currentStep === 'confirmation' && bookingDetails && (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <BookingConfirmation
                        confirmationCode={bookingDetails.confirmationCode}
                        courseName={bookingDetails.booking.courseSchedule.courseName}
                        courseDate={new Date(bookingDetails.booking.courseSchedule.startDate).toLocaleDateString('en-GB', { 
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        venue={bookingDetails.booking.courseSchedule.venueName}
                        numberOfParticipants={bookingDetails.booking.numberOfParticipants}
                        totalPrice={bookingDetails.booking.totalPrice}
                        contactEmail={bookingDetails.booking.contactEmail}
                        contactPhone={bookingDetails.booking.contactPhone}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                {selectedSchedule && currentStep !== 'confirmation' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-24"
                  >
                    {/* Course Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
                      <h3 className="font-semibold text-lg mb-4">Course Summary</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                          <p className="font-medium">{selectedSchedule.courseName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                          <p className="font-medium">
                            {new Date(selectedSchedule.startDate).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(selectedSchedule.startDate).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(selectedSchedule.endDate).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Venue</p>
                          <p className="font-medium">{selectedSchedule.venueName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {VENUE_CONFIG[selectedSchedule.venue as keyof typeof VENUE_CONFIG]?.address || 'Address TBC'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                          <p className="font-medium">{selectedSchedule.instructorName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Available Spots</p>
                          <p className="font-medium">
                            {selectedSchedule.availableSpots} of {selectedSchedule.maxParticipants}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Summary */}
                    <PricingSummary
                      pricePerPerson={selectedSchedule.pricePerPerson}
                      numberOfParticipants={1}
                      showBreakdown={false}
                    />
                    
                    {/* Help Section */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Need Help?
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                        Our team is here to help you with your booking
                      </p>
                      <div className="space-y-2 text-sm">
                        <a 
                          href="tel:01234567890" 
                          className="block text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          📞 01234 567890
                        </a>
                        <a 
                          href="mailto:bookings@reactfasttraining.co.uk" 
                          className="block text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          ✉️ bookings@reactfasttraining.co.uk
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Testimonials and FAQ Section */}
            {currentStep === 'select-course' && (
              <div className="mt-12 space-y-8">
                <BookingTestimonial />
                <BookingFAQ />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingPageEnhanced;