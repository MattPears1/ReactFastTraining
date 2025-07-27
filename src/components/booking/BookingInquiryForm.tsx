import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Building, Users, MessageSquare, 
  Calendar, Clock, Send, AlertCircle
} from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { cn } from '@utils/cn';
import { CourseSchedule } from '@/types/booking.types';
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config';

interface BookingInquiryFormProps {
  courseSchedule: CourseSchedule;
  onSuccess: () => void;
  onCancel: () => void;
}

interface InquiryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  numberOfPeople: number;
  questions: string;
  preferredPaymentMethod: 'online' | 'bank_transfer' | 'cash';
  marketingConsent: boolean;
}

export const BookingInquiryForm: React.FC<BookingInquiryFormProps> = ({
  courseSchedule,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InquiryFormData, string>>>({});
  
  const [formData, setFormData] = useState<InquiryFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    numberOfPeople: 1,
    questions: '',
    preferredPaymentMethod: 'online',
    marketingConsent: false
  });

  const courseConfig = COURSE_TYPE_CONFIG[courseSchedule.courseType];
  const courseDate = new Date(courseSchedule.startDate);
  const formattedDate = courseDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InquiryFormData, string>> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.numberOfPeople < 1) newErrors.numberOfPeople = 'At least 1 person required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/bookings/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseScheduleId: courseSchedule.id,
          ...formData,
          courseDetails: {
            courseName: courseConfig.name,
            date: formattedDate,
            time: `${courseSchedule.startTime} - ${courseSchedule.endTime}`,
            venue: courseSchedule.venue.name,
            price: courseSchedule.pricePerPerson
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      showToast('success', 'Your inquiry has been sent and your spot has been reserved for 24 hours! We\'ll respond within 24 hours.');
      onSuccess();
    } catch (error) {
      showToast('error', 'Failed to submit inquiry. Please try again.');
      console.error('Inquiry submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InquiryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg p-6"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Course Inquiry Form</h3>
        <p className="text-gray-600">
          Send us your questions and booking request. We'll respond within 24 hours.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">Course Details</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p><span className="font-medium">Course:</span> {courseConfig.name}</p>
          <p><span className="font-medium">Date:</span> {formattedDate}</p>
          <p><span className="font-medium">Time:</span> {courseSchedule.startTime} - {courseSchedule.endTime}</p>
          <p><span className="font-medium">Venue:</span> {courseSchedule.venue.name}</p>
          <p><span className="font-medium">Price:</span> £{courseSchedule.pricePerPerson} per person</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.firstName ? "border-red-500" : "border-gray-300"
                )}
                placeholder="John"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.lastName ? "border-red-500" : "border-gray-300"
                )}
                placeholder="Doe"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.email ? "border-red-500" : "border-gray-300"
                )}
                placeholder="john.doe@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.phone ? "border-red-500" : "border-gray-300"
                )}
                placeholder="07123 456789"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name (Optional)
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your Company Ltd"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of People *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              min="1"
              value={formData.numberOfPeople}
              onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value) || 1)}
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                errors.numberOfPeople ? "border-red-500" : "border-gray-300"
              )}
            />
          </div>
          {errors.numberOfPeople && (
            <p className="mt-1 text-sm text-red-600">{errors.numberOfPeople}</p>
          )}
          {formData.numberOfPeople >= 5 && (
            <p className="mt-1 text-sm text-green-600">
              Groups of 5+ may qualify for a 10% discount
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What is your inquiry?
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Please write here any additional information or questions:
          </p>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.questions}
              onChange={(e) => handleInputChange('questions', e.target.value)}
              rows={4}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Please let us know if you have any questions, dietary requirements, accessibility needs, etc."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={formData.preferredPaymentMethod === 'online'}
                onChange={(e) => handleInputChange('preferredPaymentMethod', e.target.value)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Online payment (card)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="bank_transfer"
                checked={formData.preferredPaymentMethod === 'bank_transfer'}
                onChange={(e) => handleInputChange('preferredPaymentMethod', e.target.value)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Bank transfer</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={formData.preferredPaymentMethod === 'cash'}
                onChange={(e) => handleInputChange('preferredPaymentMethod', e.target.value)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Cash on the day</span>
            </label>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>When you send this message, this spot will be reserved for 24 hours</li>
                <li>We will get back to you within 24 hours</li>
                <li>Therefore you can book it if you still want</li>
                <li>When the instructor responds, the link to the booking slot that is reserved will appear so that you can continue to book if necessary</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
              className="mt-1 mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              I would like to receive updates about future courses and first aid tips from React Fast Training
            </span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
              loading
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700"
            )}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Inquiry & Reserve Spot
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};