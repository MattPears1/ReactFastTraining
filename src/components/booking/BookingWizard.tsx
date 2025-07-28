import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StepIndicator } from "./StepIndicator";
import { CourseSelectionStep } from "./steps/CourseSelectionStep";
import { AttendeeInformationStep } from "./steps/AttendeeInformationStep";
import { ReviewTermsStep } from "./steps/ReviewTermsStep";
import { PaymentStep } from "./steps/PaymentStep";
import { visitorTracker } from "@/utils/visitor-tracking";

export interface CourseSession {
  id: string;
  courseId: string;
  courseType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  price: number;
  maxParticipants: number;
  currentBookings: number;
  status: "scheduled" | "full" | "cancelled";
}

export interface Attendee {
  name: string;
  email: string;
  certificateName?: string;
  isPrimary?: boolean;
}

export interface BookingData {
  sessionId: string;
  courseDetails: CourseSession;
  attendees: Attendee[];
  specialRequirements: string;
  termsAccepted: boolean;
}

export const BookingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  // Track booking start
  useEffect(() => {
    visitorTracker.trackBookingEvent("start");
  }, []);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { number: 1, title: "Select Course" },
    { number: 2, title: "Attendee Details" },
    { number: 3, title: "Review & Terms" },
    { number: 4, title: "Payment" },
  ];

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleComplete = (bookingReference: string) => {
    // Track booking completion
    visitorTracker.trackBookingEvent("complete", {
      bookingReference,
      courseId: bookingData.courseDetails?.courseId,
      courseType: bookingData.courseDetails?.courseType,
    });
    navigate(`/booking-confirmation/${bookingReference}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Book Your Course</h1>

      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 md:p-8">
        {currentStep === 1 && (
          <CourseSelectionStep
            onNext={(session) => {
              updateBookingData({
                sessionId: session.id,
                courseDetails: session,
              });
              nextStep();
            }}
          />
        )}

        {currentStep === 2 && bookingData.courseDetails && (
          <AttendeeInformationStep
            courseDetails={bookingData.courseDetails}
            onNext={(attendees, specialRequirements) => {
              updateBookingData({ attendees, specialRequirements });
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 &&
          bookingData.courseDetails &&
          bookingData.attendees && (
            <ReviewTermsStep
              bookingData={bookingData as BookingData}
              onNext={() => {
                updateBookingData({ termsAccepted: true });
                nextStep();
              }}
              onBack={prevStep}
            />
          )}

        {currentStep === 4 && bookingData.courseDetails && (
          <PaymentStep
            bookingData={bookingData as BookingData}
            onComplete={handleComplete}
            onBack={prevStep}
          />
        )}
      </div>

      {/* Mobile Navigation (handled within steps) */}
    </div>
  );
};
