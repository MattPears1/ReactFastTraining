import React, { useState } from "react";
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { BookingData } from "../BookingWizard";

interface ReviewTermsStepProps {
  bookingData: BookingData;
  onNext: () => void;
  onBack: () => void;
}

export const ReviewTermsStep: React.FC<ReviewTermsStepProps> = ({
  bookingData,
  onNext,
  onBack,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canContinue = termsAccepted && waiverAccepted && privacyAccepted;
  const totalAmount =
    bookingData.courseDetails.price * bookingData.attendees.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review Your Booking</h2>
        <p className="text-gray-600">
          Please review your details and accept our terms
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Booking Summary</h3>

        <div className="space-y-4">
          {/* Course Details */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Course</p>
            <p className="font-medium">
              {bookingData.courseDetails.courseType}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {format(
                  new Date(bookingData.courseDetails.sessionDate),
                  "EEEE, d MMMM yyyy",
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Time</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {bookingData.courseDetails.startTime} -{" "}
                {bookingData.courseDetails.endTime}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Location</p>
            <p className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {bookingData.courseDetails.location}
            </p>
          </div>

          {/* Attendees */}
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Attendees ({bookingData.attendees.length})
              </span>
            </p>
            <div className="bg-white rounded p-3 space-y-1">
              {bookingData.attendees.map((attendee, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {attendee.name}
                    {attendee.isPrimary && (
                      <span className="ml-2 text-xs text-primary-600">
                        (Primary contact)
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">{attendee.email}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Requirements */}
          {bookingData.specialRequirements && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Special Requirements</p>
              <p className="font-medium bg-white rounded p-3">
                {bookingData.specialRequirements}
              </p>
            </div>
          )}

          {/* Pricing */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Course Fee</p>
                <p className="text-xs text-gray-500">
                  {bookingData.attendees.length} × £
                  {bookingData.courseDetails.price}
                </p>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                £{totalAmount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-yellow-800">
              Important Information:
            </p>
            <ul className="space-y-1 text-yellow-700">
              <li>• Please arrive 15 minutes before the start time</li>
              <li>
                • Bring photo ID (passport or driving license) for registration
              </li>
              <li>
                • Wear comfortable clothing suitable for practical exercises
              </li>
              <li>• Minimum age requirement: 16 years</li>
              <li>
                • Cancellations must be made at least 48 hours before the course
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terms Acceptance */}
      <div className="space-y-4">
        <h3 className="font-semibold">Terms & Conditions</h3>

        <div className="border rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium">Terms and Conditions</p>
              <p className="text-sm text-gray-600 mt-1">
                I have read and agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Terms and Conditions
                </a>
                , including the cancellation policy (48 hours notice required
                for full refund).
              </p>
            </div>
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={waiverAccepted}
              onChange={(e) => setWaiverAccepted(e.target.checked)}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium">Liability Waiver</p>
              <p className="text-sm text-gray-600 mt-1">
                I understand that first aid training involves physical
                activities and acknowledge the{" "}
                <a
                  href="/waiver"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  liability waiver
                </a>
                . I confirm that all attendees are physically able to
                participate.
              </p>
            </div>
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 mr-3"
            />
            <div>
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-gray-600 mt-1">
                I agree to the processing of personal data in accordance with
                the{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Privacy Policy
                </a>
                . Data will be used for course administration and certification
                purposes only.
              </p>
            </div>
          </label>
        </div>
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
          onClick={onNext}
          disabled={!canContinue}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2"
        >
          {canContinue && <Check className="w-5 h-5" />}
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};
