import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, MapPin, Users, Mail, Phone, Download, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@utils/cn'
import { SuccessCheckmark } from '@components/ui/SuccessAnimation'

interface BookingConfirmationProps {
  confirmationCode: string
  courseName: string
  courseDate: string
  venue: string
  numberOfParticipants: number
  totalPrice: number
  contactEmail: string
  contactPhone: string
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  confirmationCode,
  courseName,
  courseDate,
  venue,
  numberOfParticipants = 1,
  totalPrice = 0,
  contactEmail = '',
  contactPhone = ''
}) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Course Booking Confirmation',
        text: `Booking confirmed for ${courseName} on ${courseDate}. Confirmation code: ${confirmationCode}`,
        url: window.location.href
      })
    }
  }
  
  const handleDownload = () => {
    // In a real app, this would generate a PDF or similar
    const bookingDetails = `
React Fast Training - Booking Confirmation

Confirmation Code: ${confirmationCode}
Course: ${courseName}
Date: ${courseDate}
Venue: ${venue}
Participants: ${numberOfParticipants}
Total Price: £${totalPrice?.toFixed(2) || '0.00'}

Contact Email: ${contactEmail}
Contact Phone: ${contactPhone}

Thank you for your booking. A confirmation email has been sent to ${contactEmail}.

For any queries, please call us on 07447 485644 or email info@reactfasttraining.co.uk
    `.trim()
    
    const blob = new Blob([bookingDetails], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `booking-${confirmationCode}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <SuccessCheckmark size={100} />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
          Booking Confirmed!
        </h2>
        
        <p className="text-green-700 dark:text-green-300 mb-4">
          Thank you for booking with React Fast Training
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 inline-block">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Your confirmation code is:
          </p>
          <p className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400">
            {confirmationCode}
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="font-medium">{courseName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{courseDate}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="font-medium">Venue</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{venue}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="font-medium">Participants</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{numberOfParticipants} person(s)</p>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price</span>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                £{(totalPrice || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          What happens next?
        </h3>
        
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>A confirmation email has been sent to <strong>{contactEmail}</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>You will receive the exact venue address and joining instructions 48 hours before the course</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Payment instructions will be included in your confirmation email</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>If you need to cancel, please do so at least 48 hours before the course start date</span>
          </li>
        </ul>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleDownload}
          className="btn btn-outline flex-1 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Confirmation
        </button>
        
        {navigator.share && (
          <button
            onClick={handleShare}
            className="btn btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Booking
          </button>
        )}
      </div>
      
      <div className="text-center space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Need help or have questions?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <a 
              href={`tel:${contactPhone}`}
              className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Phone className="w-4 h-4" />
              07447 485644
            </a>
            <a 
              href="mailto:info@reactfasttraining.co.uk"
              className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Mail className="w-4 h-4" />
              info@reactfasttraining.co.uk
            </a>
          </div>
        </div>
        
        <div className="pt-4">
          <Link to="/" className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    </motion.div>
  )
}