import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Building, MapPin, Users, FileText, Plus, Minus } from 'lucide-react'
import { bookingApi } from '@services/api.service'
import { useToast } from '@contexts/ToastContext'
import { cn } from '@utils/cn'
import { ProgressBar } from '@components/ui/SuccessAnimation'

interface ParticipantDetail {
  name: string
  email: string
  dietaryRequirements: string
  medicalConditions: string
}

interface BookingFormProps {
  courseScheduleId: number
  courseName: string
  courseDate: string
  pricePerPerson: number
  maxParticipants: number
  inquiryData?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    companyName?: string
    numberOfPeople: number
    questions?: string
  }
  onSuccess: (confirmationCode: string, totalPrice: number, email: string, phone: string, participants: number) => void
  onCancel: () => void
}

export const BookingForm: React.FC<BookingFormProps> = ({
  courseScheduleId,
  courseName,
  courseDate,
  pricePerPerson,
  maxParticipants,
  inquiryData,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [numberOfParticipants, setNumberOfParticipants] = useState(inquiryData?.numberOfPeople || 1)
  const [showParticipantDetails, setShowParticipantDetails] = useState(false)
  
  const [formData, setFormData] = useState({
    contactName: inquiryData ? `${inquiryData.firstName} ${inquiryData.lastName}` : '',
    contactEmail: inquiryData?.email || '',
    contactPhone: inquiryData?.phone || '',
    companyName: inquiryData?.companyName || '',
    companyAddress: '',
    specialRequirements: inquiryData?.questions || ''
  })
  
  const [participantDetails, setParticipantDetails] = useState<ParticipantDetail[]>([])
  
  const totalPrice = numberOfParticipants * pricePerPerson
  const groupDiscount = numberOfParticipants >= 5 ? 0.1 : 0 // 10% discount for 5+ participants
  const discountAmount = totalPrice * groupDiscount
  const finalPrice = totalPrice - discountAmount
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const updateParticipantCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(maxParticipants, numberOfParticipants + delta))
    setNumberOfParticipants(newCount)
    
    // Adjust participant details array
    if (newCount > participantDetails.length) {
      const newParticipants = Array(newCount - participantDetails.length).fill(null).map(() => ({
        name: '',
        email: '',
        dietaryRequirements: '',
        medicalConditions: ''
      }))
      setParticipantDetails([...participantDetails, ...newParticipants])
    } else {
      setParticipantDetails(participantDetails.slice(0, newCount))
    }
  }
  
  const updateParticipantDetail = (index: number, field: keyof ParticipantDetail, value: string) => {
    const updated = [...participantDetails]
    updated[index] = { ...updated[index], [field]: value }
    setParticipantDetails(updated)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contactName || !formData.contactEmail || !formData.contactPhone) {
      showToast('error', 'Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      // Mock booking creation for now
      setTimeout(() => {
        const mockConfirmationCode = `RFT-${Date.now().toString(36).toUpperCase()}`
        showToast('success', 'Booking confirmed successfully!')
        onSuccess(
          mockConfirmationCode, 
          finalPrice,
          formData.contactEmail,
          formData.contactPhone,
          numberOfParticipants
        )
        setLoading(false)
      }, 1500)
      
      // TODO: Replace with real API call when backend is ready
      // const response = await bookingApi.createBooking({
      //   courseScheduleId,
      //   numberOfParticipants,
      //   ...formData,
      //   participantDetails: showParticipantDetails ? participantDetails : undefined
      // })
      
      // if (response.success) {
      //   showToast('success', 'Booking confirmed successfully!')
      //   onSuccess(
      //     response.data.confirmationCode, 
      //     response.data.totalPrice,
      //     formData.contactEmail,
      //     formData.contactPhone,
      //     numberOfParticipants
      //   )
      // }
    } catch (error: any) {
      console.error('Booking error:', error)
      showToast('error', error.response?.data?.message || 'Failed to complete booking. Please try again.')
      setLoading(false)
    }
  }
  
  // Calculate form progress
  const calculateProgress = () => {
    let filled = 0
    const totalFields = 5 // Basic contact fields
    
    if (formData.contactName) filled++
    if (formData.contactEmail) filled++
    if (formData.contactPhone) filled++
    if (formData.companyName) filled++
    if (formData.companyAddress) filled++
    
    return Math.round((filled / totalFields) * 100)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Inquiry Notice */}
      {inquiryData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Your inquiry details have been loaded</p>
              <p>We've pre-filled this form with the information from your inquiry. Your place is being held for 24 hours.</p>
            </div>
          </div>
        </div>
      )}
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Booking Progress</span>
          <span>{calculateProgress()}% Complete</span>
        </div>
        <ProgressBar progress={calculateProgress()} />
      </div>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
        <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-1">
          {courseName}
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300">
          {new Date(courseDate).toLocaleDateString('en-GB', { 
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
      
      {/* Number of Participants */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Number of Participants *
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => updateParticipantCount(-1)}
            disabled={numberOfParticipants <= 1}
            className="btn btn-outline btn-sm"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-2xl font-bold w-12 text-center">{numberOfParticipants}</span>
          <button
            type="button"
            onClick={() => updateParticipantCount(1)}
            disabled={numberOfParticipants >= maxParticipants}
            className="btn btn-outline btn-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">
            (max {maxParticipants})
          </span>
        </div>
        
        {numberOfParticipants > 1 && (
          <button
            type="button"
            onClick={() => setShowParticipantDetails(!showParticipantDetails)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
          >
            {showParticipantDetails ? 'Hide' : 'Add'} participant details
          </button>
        )}
      </div>
      
      {/* Price Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Price per person</span>
          <span>£{pricePerPerson.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Number of participants</span>
          <span>×{numberOfParticipants}</span>
        </div>
        {groupDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Group discount (10%)</span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>£{finalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Contact Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Contact Details</h3>
        
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              required
              className="pl-10 input"
              placeholder="John Smith"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
              className="pl-10 input"
              placeholder="john.smith@example.com"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              required
              className="pl-10 input"
              placeholder="07123 456789"
            />
          </div>
        </div>
      </div>
      
      {/* Company Details (Optional) */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Company Details (Optional)</h3>
        
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium mb-1">
            Company Name
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="pl-10 input"
              placeholder="ABC Limited"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="companyAddress" className="block text-sm font-medium mb-1">
            Company Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              id="companyAddress"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleInputChange}
              rows={3}
              className="pl-10 input"
              placeholder="123 Business Street, Sheffield, S1 2AB"
            />
          </div>
        </div>
      </div>
      
      {/* Participant Details */}
      {showParticipantDetails && participantDetails.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Participant Details</h3>
          
          {participantDetails.map((participant, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <h4 className="font-medium">Participant {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={participant.name}
                  onChange={(e) => updateParticipantDetail(index, 'name', e.target.value)}
                  className="input input-sm"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={participant.email}
                  onChange={(e) => updateParticipantDetail(index, 'email', e.target.value)}
                  className="input input-sm"
                />
                <input
                  type="text"
                  placeholder="Dietary requirements (optional)"
                  value={participant.dietaryRequirements}
                  onChange={(e) => updateParticipantDetail(index, 'dietaryRequirements', e.target.value)}
                  className="input input-sm"
                />
                <input
                  type="text"
                  placeholder="Medical conditions (optional)"
                  value={participant.medicalConditions}
                  onChange={(e) => updateParticipantDetail(index, 'medicalConditions', e.target.value)}
                  className="input input-sm"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Special Requirements */}
      <div>
        <label htmlFor="specialRequirements" className="block text-sm font-medium mb-1">
          Special Requirements or Additional Information
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            id="specialRequirements"
            name="specialRequirements"
            value={formData.specialRequirements}
            onChange={handleInputChange}
            rows={4}
            className="pl-10 input"
            placeholder="Please let us know of any special requirements, accessibility needs, or other information..."
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "btn btn-primary btn-lg flex-1",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? 'Processing...' : `Confirm Booking (£${finalPrice.toFixed(2)})`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn btn-outline btn-lg"
        >
          Cancel
        </button>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By confirming this booking, you agree to our terms and conditions and cancellation policy.
      </p>
    </form>
  )
}