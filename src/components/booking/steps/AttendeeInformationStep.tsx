import React, { useState } from 'react';
import { Plus, Minus, User, AlertCircle } from 'lucide-react';
import { CourseSession, Attendee } from '../BookingWizard';

interface AttendeeInformationStepProps {
  courseDetails: CourseSession;
  onNext: (attendees: Attendee[], specialRequirements: string) => void;
  onBack: () => void;
}

export const AttendeeInformationStep: React.FC<AttendeeInformationStepProps> = ({
  courseDetails,
  onNext,
  onBack,
}) => {
  const maxAttendees = Math.min(12, courseDetails.maxParticipants - courseDetails.currentBookings);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', email: '', isPrimary: true }]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateAttendeeCount = (count: number) => {
    const newCount = Math.max(1, Math.min(count, maxAttendees));
    setAttendeeCount(newCount);

    // Adjust attendees array
    if (newCount > attendees.length) {
      const additional = Array(newCount - attendees.length).fill(null).map(() => ({ 
        name: '', 
        email: '', 
        isPrimary: false 
      }));
      setAttendees([...attendees, ...additional]);
    } else {
      setAttendees(attendees.slice(0, newCount));
    }
  };

  const updateAttendee = (index: number, field: keyof Attendee, value: string | boolean) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
    
    // Clear error when user starts typing
    const errorKey = `${field}-${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    attendees.forEach((attendee, index) => {
      if (!attendee.name.trim()) {
        newErrors[`name-${index}`] = 'Name is required';
      }
      if (!attendee.email.trim()) {
        newErrors[`email-${index}`] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) {
        newErrors[`email-${index}`] = 'Invalid email format';
      }
    });

    // Check for duplicate emails
    const emails = attendees.map(a => a.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      attendees.forEach((attendee, index) => {
        if (duplicates.includes(attendee.email.toLowerCase())) {
          newErrors[`email-${index}`] = 'Email already used for another attendee';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      // Ensure first attendee is marked as primary
      const attendeesWithPrimary = attendees.slice(0, attendeeCount).map((a, i) => ({
        ...a,
        isPrimary: i === 0,
      }));
      onNext(attendeesWithPrimary, specialRequirements);
    }
  };

  const totalPrice = courseDetails.price * attendeeCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Attendee Information</h2>
        <p className="text-gray-600">
          Enter details for each person attending the course
        </p>
      </div>

      {/* Number of Attendees */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Attendees
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => updateAttendeeCount(attendeeCount - 1)}
            disabled={attendeeCount <= 1}
            className="p-2 rounded-lg bg-white border border-gray-300 
                       hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease attendee count"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xl font-semibold w-12 text-center">
            {attendeeCount}
          </span>
          <button
            onClick={() => updateAttendeeCount(attendeeCount + 1)}
            disabled={attendeeCount >= maxAttendees}
            className="p-2 rounded-lg bg-white border border-gray-300 
                       hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase attendee count"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            (Max {maxAttendees} available)
          </span>
        </div>
        <div className="mt-3 text-right">
          <p className="text-sm text-gray-600">Total Price:</p>
          <p className="text-2xl font-bold text-primary-600">£{totalPrice}</p>
        </div>
      </div>

      {/* Attendee Forms */}
      <div className="space-y-4">
        {Array.from({ length: attendeeCount }).map((_, index) => (
          <div key={index} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium">
                {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
              </h3>
              {index === 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  Main contact
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={attendees[index]?.name || ''}
                  onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors[`name-${index}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Smith"
                />
                {errors[`name-${index}`] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[`name-${index}`]}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={attendees[index]?.email || ''}
                  onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors[`email-${index}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john.smith@example.com"
                />
                {errors[`email-${index}`] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[`email-${index}`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Special Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Requirements or Accessibility Needs (Optional)
        </label>
        <textarea
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Please let us know about any dietary requirements, mobility needs, or other accommodations..."
        />
        <p className="text-sm text-gray-500 mt-1">
          We'll do our best to accommodate any special requirements
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};