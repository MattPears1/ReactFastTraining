import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BookOpen, Shield, Clock, Award } from "lucide-react";
import { CourseAvailability } from "@components/booking/CourseAvailability";
import { BookingFormWithPayment } from "@components/booking/BookingFormWithPayment";
import { BookingInquiryForm } from "@components/booking/BookingInquiryForm";
import { BookingConfirmation } from "@components/booking/BookingConfirmation";
import { BookingOptionsModal } from "@components/booking/BookingOptionsModal";
import SEO from "@components/common/SEO";
import { cn } from "@utils/cn";
import { CourseSchedule, BookingStatus } from "@/types/booking.types";
import { COURSE_TYPE_CONFIG } from "@/config/courseTypes.config";
import { VENUE_CONFIG } from "@/config/venues.config";
import { useToast } from "@contexts/ToastContext";

type BookingStep =
  | "select-course"
  | "details"
  | "confirmation"
  | "inquiry"
  | "inquiry-sent";

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

  const courseTypeParam = searchParams.get("course");
  const venueParam = searchParams.get("venue");

  const [currentStep, setCurrentStep] = useState<BookingStep>("select-course");
  const [selectedSchedule, setSelectedSchedule] =
    useState<CourseSchedule | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null,
  );
  const [completedSteps, setCompletedSteps] = useState<BookingStep[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleCourseSelect = (schedule: CourseSchedule) => {
    console.log("=== BOOKING PAGE: Course Selected ===");
    console.log("Schedule:", schedule);
    setSelectedSchedule(schedule);
    setShowOptionsModal(true);
  };

  const handleSelectDirectBooking = () => {
    console.log("=== BOOKING PAGE: Direct Booking Selected ===");
    console.log("Current step before:", currentStep);
    setShowOptionsModal(false);
    setCurrentStep("details");
    setCompletedSteps(["select-course"]);
    console.log("Step set to: details");
  };

  const handleSelectInquiry = () => {
    console.log("=== BOOKING PAGE: Inquiry Selected ===");
    console.log("Current step before:", currentStep);
    setShowOptionsModal(false);
    setCurrentStep("inquiry");
    setCompletedSteps(["select-course"]);
    console.log("Step set to: inquiry");
  };

  const handleBookingSuccess = (confirmationCode: string, booking: any) => {
    // Adapt the booking object to match our expected interface
    const adaptedBooking = {
      id: booking.id || "",
      status: booking.status || booking.bookingStatus || "confirmed",
      totalPrice: booking.totalPrice || booking.totalAmount || 0,
      contactEmail:
        booking.contactEmail ||
        booking.primaryContact?.email ||
        booking.email ||
        "",
      contactPhone:
        booking.contactPhone ||
        booking.primaryContact?.phone ||
        booking.phone ||
        "",
      numberOfParticipants: booking.numberOfParticipants || 1,
      courseSchedule: booking.courseSchedule || selectedSchedule,
    };

    setBookingDetails({
      confirmationCode,
      booking: adaptedBooking,
    });
    setCurrentStep("confirmation");
    setCompletedSteps(["select-course", "details", "payment"]);
  };

  const handleInquirySuccess = () => {
    setCurrentStep("inquiry-sent");
  };

  const handleBack = () => {
    switch (currentStep) {
      case "details":
        setCurrentStep("select-course");
        break;
      case "payment":
        setCurrentStep("details");
        break;
      case "select-course":
        navigate(-1);
        break;
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const trustBadges = [
    { icon: Shield, text: "Secure Booking", color: "text-green-600" },
    { icon: Clock, text: "Instant Confirmation", color: "text-blue-600" },
    { icon: Award, text: "HSE Approved", color: "text-purple-600" },
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
                {currentStep !== "confirmation" && (
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
                    <badge.icon className={cn("w-5 h-5", badge.color)} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {badge.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Progress Steps - Only show for booking flow, not inquiry */}
              {currentStep !== "inquiry" && currentStep !== "inquiry-sent" && (
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-700" />

                  {(
                    [
                      "select-course",
                      "details",
                      "confirmation",
                    ] as BookingStep[]
                  ).map((step, index) => {
                    const isActive = currentStep === step;
                    const isCompleted =
                      (step === "select-course" &&
                        (currentStep === "details" ||
                          currentStep === "confirmation")) ||
                      (step === "details" && currentStep === "confirmation");

                    return (
                      <div
                        key={step}
                        className={cn(
                          "relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all",
                          isActive && "bg-primary-600 text-white scale-110",
                          isCompleted && "bg-green-500 text-white",
                          !isActive &&
                            !isCompleted &&
                            "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  {currentStep === "select-course" && (
                    <motion.div
                      key="select-course"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-2">
                        Select Your Course Date
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Choose from our available training dates across
                        Yorkshire
                      </p>

                      <CourseAvailability
                        courseType={(courseTypeParam as any) || undefined}
                        onSelectCourse={handleCourseSelect}
                        selectedScheduleId={selectedSchedule?.id}
                      />
                    </motion.div>
                  )}

                  {currentStep === "details" && selectedSchedule && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-2">
                        Enter Your Details
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please provide your contact information and participant
                        details
                      </p>

                      <BookingFormWithPayment
                        courseSchedule={selectedSchedule}
                        onSuccess={handleBookingSuccess}
                        onCancel={() => setCurrentStep("select-course")}
                      />
                    </motion.div>
                  )}

                  {currentStep === "inquiry" && selectedSchedule && (
                    <motion.div
                      key="inquiry"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h1 className="text-3xl font-bold mb-2">
                        Course Inquiry
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Send us your questions and reserve your spot for 24
                        hours
                      </p>

                      <BookingInquiryForm
                        courseSchedule={selectedSchedule}
                        onSuccess={handleInquirySuccess}
                        onCancel={() => setCurrentStep("select-course")}
                      />
                    </motion.div>
                  )}

                  {currentStep === "inquiry-sent" && (
                    <motion.div
                      key="inquiry-sent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="max-w-2xl mx-auto">
                        <div className="mb-8">
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                              className="w-10 h-10 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Inquiry Sent Successfully!
                          </h2>
                          <p className="text-lg text-gray-600 mb-6">
                            Thank you for your interest. Your spot has been
                            reserved for 24 hours and we'll respond within that
                            time.
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                            <h3 className="font-semibold text-blue-900 mb-3">
                              What happens next?
                            </h3>
                            <ul className="space-y-2 text-blue-800">
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">1.</span>
                                Your spot is now reserved for 24 hours
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">2.</span>
                                Our instructor will review your inquiry and
                                answer any questions
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">3.</span>
                                You'll receive an email with a booking link to
                                complete your reservation
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">4.</span>
                                Complete payment to confirm your place on the
                                course
                              </li>
                            </ul>
                          </div>
                          <p className="text-sm text-gray-600 mt-6">
                            Check your email for a confirmation of your inquiry.
                            If you don't see it, please check your spam folder.
                          </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={() => navigate("/")}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                          >
                            Return to Homepage
                          </button>
                          <button
                            onClick={() => setCurrentStep("select-course")}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Browse More Courses
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === "confirmation" && bookingDetails && (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <BookingConfirmation
                        confirmationCode={bookingDetails.confirmationCode}
                        courseName={
                          bookingDetails.booking.courseSchedule.courseName
                        }
                        courseDate={new Date(
                          bookingDetails.booking.courseSchedule.startDate,
                        ).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        venue={bookingDetails.booking.courseSchedule.venueName}
                        numberOfParticipants={
                          bookingDetails.booking.numberOfParticipants
                        }
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
                {selectedSchedule && currentStep !== "confirmation" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-24"
                  >
                    {/* Course Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
                      <h3 className="font-semibold text-lg mb-4">
                        Course Summary
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Course
                          </p>
                          <p className="font-medium">
                            {selectedSchedule.courseName}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Date & Time
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedSchedule.startDate,
                            ).toLocaleDateString("en-GB", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(
                              selectedSchedule.startDate,
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(
                              selectedSchedule.endDate,
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Venue
                          </p>
                          <p className="font-medium">
                            {selectedSchedule.venueName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {VENUE_CONFIG[
                              selectedSchedule.venue as keyof typeof VENUE_CONFIG
                            ]?.address || "Address TBC"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Instructor
                          </p>
                          <p className="font-medium">
                            {selectedSchedule.instructorName}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Available Spots
                          </p>
                          <p className="font-medium">
                            {selectedSchedule.availableSpots} of{" "}
                            {selectedSchedule.maxParticipants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                      <h3 className="font-semibold text-lg mb-4">Price</h3>
                      <div className="text-2xl font-bold text-primary-600">
                        £{selectedSchedule.pricePerPerson.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        per person
                      </p>
                    </div>

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
          </div>
        </div>
      </div>

      {/* Booking Options Modal */}
      {selectedSchedule && (
        <BookingOptionsModal
          isOpen={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          courseSchedule={selectedSchedule}
          onSelectDirectBooking={handleSelectDirectBooking}
          onSelectInquiry={handleSelectInquiry}
        />
      )}
    </>
  );
};

export default BookingPageEnhanced;
