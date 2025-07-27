import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, MessageSquare, CheckCircle, Clock, Shield } from 'lucide-react';
import { CourseSchedule } from '@/types/booking.types';
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config';

interface BookingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseSchedule: CourseSchedule;
  onSelectDirectBooking: () => void;
  onSelectInquiry: () => void;
}

export const BookingOptionsModal: React.FC<BookingOptionsModalProps> = ({
  isOpen,
  onClose,
  courseSchedule,
  onSelectDirectBooking,
  onSelectInquiry
}) => {
  const courseConfig = COURSE_TYPE_CONFIG[courseSchedule.courseType];
  const courseDate = new Date(courseSchedule.startDate);
  const formattedDate = courseDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Booking Method</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Selected Course</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <p><span className="font-medium">Course:</span> {courseConfig.name}</p>
                      <p><span className="font-medium">Date:</span> {formattedDate}</p>
                      <p><span className="font-medium">Time:</span> {courseSchedule.startTime} - {courseSchedule.endTime}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Venue:</span> {courseSchedule.venue.name}</p>
                      <p><span className="font-medium">Price:</span> £{courseSchedule.pricePerPerson} per person</p>
                      <p><span className="font-medium">Available Spaces:</span> {courseSchedule.availableSpaces}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Direct Booking Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative border-2 border-green-500 rounded-lg p-6 bg-green-50"
                  >
                    <div className="absolute -top-3 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Recommended
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <CreditCard className="w-8 h-8 text-green-600 mr-3" />
                      <h3 className="text-xl font-bold text-gray-900">Book Now Online</h3>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Instant confirmation</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Secure online payment</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Immediate email confirmation</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Guaranteed place on course</span>
                      </li>
                      <li className="flex items-start">
                        <Shield className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Protected by our refund policy</span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={onSelectDirectBooking}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Book Now & Pay Online
                    </button>
                    
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      No booking fees • Questions? Add them to your booking
                    </p>
                  </motion.div>

                  {/* Inquiry Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="border-2 border-gray-300 rounded-lg p-6"
                  >
                    <div className="flex items-center mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
                      <h3 className="text-xl font-bold text-gray-900">Make an Inquiry</h3>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <Clock className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Response within 24 hours</span>
                      </li>
                      <li className="flex items-start">
                        <MessageSquare className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Ask questions before booking</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Discuss special requirements</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Alternative payment options</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Personal assistance from instructor</span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={onSelectInquiry}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Send Inquiry
                    </button>
                    
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      Perfect for questions or alternative payment methods
                    </p>
                  </motion.div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Places are limited and allocated on a first-come, first-served basis. 
                    Direct online booking guarantees your place immediately.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};