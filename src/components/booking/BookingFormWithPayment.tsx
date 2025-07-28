import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building,
  Users,
  FileText,
  Plus,
  Minus,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Shield,
} from "lucide-react";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";
import {
  BookingFormData,
  validateBookingForm,
  formatValidationErrors,
} from "@/utils/validation/booking.validation";
import { bookingService } from "@/services/booking.service";
import { CourseSchedule } from "@/types/booking.types";
import { StripePaymentForm } from "./StripePaymentForm";

interface BookingFormWithPaymentProps {
  courseSchedule: CourseSchedule;
  onSuccess: (confirmationCode: string, booking: any) => void;
  onCancel: () => void;
}

type BookingStep = "details" | "payment";

export const BookingFormWithPayment: React.FC<BookingFormWithPaymentProps> = ({
  courseSchedule,
  onSuccess,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<BookingStep>("details");
  const [loading, setLoading] = useState(false);
  const [showGroupBooking, setShowGroupBooking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    id: string;
  } | null>(null);

  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    courseSessionId: courseSchedule.id,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    numberOfParticipants: 1,
    participantDetails: [],
    specialRequirements: "",
    agreedToTerms: false,
  });

  const totalPrice =
    (formData.numberOfParticipants || 1) * courseSchedule.pricePerPerson;
  const groupDiscount = (formData.numberOfParticipants || 1) >= 5 ? 0.1 : 0;
  const discountAmount = totalPrice * groupDiscount;
  const finalPrice = totalPrice - discountAmount;

  useEffect(() => {
    const count = formData.numberOfParticipants || 1;
    const currentDetails = formData.participantDetails || [];

    if (count > 1 && currentDetails.length !== count - 1) {
      const newDetails = Array(count - 1)
        .fill(null)
        .map(
          (_, index) =>
            currentDetails[index] || {
              firstName: "",
              lastName: "",
              email: "",
              dietaryRequirements: "",
              medicalConditions: "",
            },
        );

      setFormData((prev) => ({ ...prev, participantDetails: newDetails }));
      setShowGroupBooking(true);
    } else if (count === 1) {
      setFormData((prev) => ({ ...prev, participantDetails: [] }));
      setShowGroupBooking(false);
    }
  }, [formData.numberOfParticipants]);

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateParticipantDetail = (
    index: number,
    field: string,
    value: string,
  ) => {
    const details = [...(formData.participantDetails || [])];
    details[index] = { ...details[index], [field]: value };
    setFormData((prev) => ({ ...prev, participantDetails: details }));

    const errorKey = `participantDetails.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = validateBookingForm(formData);

    if (!result.success) {
      const formattedErrors = formatValidationErrors(result.error);
      setErrors(formattedErrors);

      const firstError = Object.values(formattedErrors)[0];
      showToast("error", firstError);

      return false;
    }

    setErrors({});
    return true;
  };

  const handleProceedToPayment = async () => {
    console.log("=== BOOKING FORM: Proceeding to payment ===");
    console.log("Course Schedule:", courseSchedule);
    console.log("Form Data:", formData);
    console.log("Final Price:", finalPrice);

    if (!validateForm()) {
      console.error("Form validation failed");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/bookings/create-payment-intent`;
      const requestBody = {
        courseSessionId: courseSchedule.id,
        amount: Math.round(finalPrice * 100), // Convert to pence
        bookingData: formData,
      };

      console.log("Creating payment intent...");
      console.log("API URL:", apiUrl);
      console.log("Request Body:", requestBody);

      // Create payment intent
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response Status:", response.status);
      console.log("Response OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Payment Intent Error Response:", errorText);
        throw new Error(
          `Failed to create payment intent: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Payment Intent Response:", data);

      const { clientSecret, paymentIntentId } = data;
      console.log("Client Secret received:", clientSecret ? "Yes" : "No");
      console.log("Payment Intent ID:", paymentIntentId);

      setPaymentIntent({ clientSecret, id: paymentIntentId });
      setCurrentStep("payment");
      console.log("Successfully moved to payment step");
    } catch (error) {
      console.error("=== PAYMENT INITIALIZATION ERROR ===");
      console.error("Error details:", error);
      showToast("error", "Failed to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log("=== PAYMENT SUCCESS HANDLER ===");
    console.log("Payment Intent ID:", paymentIntentId);
    setLoading(true);

    try {
      const confirmData = {
        ...formData,
        paymentIntentId,
        totalAmount: finalPrice,
      };
      console.log("Confirming booking with data:", confirmData);

      // Confirm booking with payment
      const response = await bookingService.confirmBookingWithPayment(
        confirmData as BookingFormData & {
          paymentIntentId: string;
          totalAmount: number;
        },
      );

      console.log("Booking confirmation response:", response);

      if (response.success && response.data) {
        console.log("Booking confirmed successfully!");
        console.log("Confirmation code:", response.data.confirmationCode);
        showToast("success", "Booking confirmed successfully!");
        onSuccess(response.data.confirmationCode, response.data.booking);
      } else {
        console.error("Booking confirmation failed:", response.error);
        showToast("error", response.error || "Booking confirmation failed.");
      }
    } catch (error) {
      console.error("=== BOOKING CONFIRMATION ERROR ===");
      console.error("Error details:", error);
      showToast("error", "Failed to confirm booking. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    showToast("error", `Payment failed: ${error}`);
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* Course Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
          {courseSchedule.courseName}
        </h3>
        <div className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
          <p>
            Date:{" "}
            {new Date(courseSchedule.startDate).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p>Venue: {courseSchedule.venueName}</p>
          <p>Available Spots: {courseSchedule.availableSpots}</p>
        </div>
      </div>

      {/* Primary Contact Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Primary Contact Details
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName || ""}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className={cn(
                "w-full px-4 py-2 border rounded-lg transition-colors",
                errors.firstName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary-500",
              )}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName || ""}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className={cn(
                "w-full px-4 py-2 border rounded-lg transition-colors",
                errors.lastName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary-500",
              )}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border rounded-lg transition-colors",
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-primary-500",
                )}
                placeholder="john.doe@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border rounded-lg transition-colors",
                  errors.phone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-primary-500",
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
          <label className="block text-sm font-medium mb-2">
            Company Name (optional)
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.companyName || ""}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500"
              placeholder="Your Company Ltd"
            />
          </div>
        </div>
      </div>

      {/* Number of Participants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Number of Participants
        </h3>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              handleInputChange(
                "numberOfParticipants",
                Math.max(1, (formData.numberOfParticipants || 1) - 1),
              )
            }
            disabled={formData.numberOfParticipants === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-3xl font-bold">
              {formData.numberOfParticipants}
            </div>
            <div className="text-sm text-gray-600">
              participant{(formData.numberOfParticipants || 1) > 1 ? "s" : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleInputChange(
                "numberOfParticipants",
                Math.min(
                  courseSchedule.availableSpots,
                  (formData.numberOfParticipants || 1) + 1,
                ),
              )
            }
            disabled={
              formData.numberOfParticipants === courseSchedule.availableSpots
            }
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {groupDiscount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Group booking discount applied: 10% off for 5+ participants!
            </p>
          </div>
        )}
      </div>

      {/* Additional Participants */}
      <AnimatePresence>
        {showGroupBooking &&
          formData.participantDetails &&
          formData.participantDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">Additional Participants</h3>

              <div className="space-y-4">
                {formData.participantDetails.map((participant, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium mb-3">
                      Participant {index + 2}
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={participant.firstName || ""}
                          onChange={(e) =>
                            updateParticipantDetail(
                              index,
                              "firstName",
                              e.target.value,
                            )
                          }
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg text-sm",
                            errors[`participantDetails.${index}.firstName`]
                              ? "border-red-500"
                              : "border-gray-300",
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={participant.lastName || ""}
                          onChange={(e) =>
                            updateParticipantDetail(
                              index,
                              "lastName",
                              e.target.value,
                            )
                          }
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg text-sm",
                            errors[`participantDetails.${index}.lastName`]
                              ? "border-red-500"
                              : "border-gray-300",
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={participant.email || ""}
                        onChange={(e) =>
                          updateParticipantDetail(
                            index,
                            "email",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Special Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Additional Information
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Special Requirements or Medical Conditions (optional)
          </label>
          <textarea
            value={formData.specialRequirements || ""}
            onChange={(e) =>
              handleInputChange("specialRequirements", e.target.value)
            }
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 resize-none"
            placeholder="Please let us know of any requirements or conditions we should be aware of..."
          />
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Price per person:</span>
          <span>£{courseSchedule.pricePerPerson.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Number of participants:</span>
          <span>{formData.numberOfParticipants}</span>
        </div>
        {groupDiscount > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Group discount (10%):</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="border-t pt-2 flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span>£{finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Terms Agreement */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToTerms || false}
            onChange={(e) =>
              handleInputChange("agreedToTerms", e.target.checked)
            }
            className={cn(
              "mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500",
              errors.agreedToTerms && "border-red-500",
            )}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              className="text-primary-600 hover:underline"
            >
              terms and conditions
            </a>{" "}
            and understand that this booking is subject to availability.
            <span className="text-red-500"> *</span>
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="text-sm text-red-600">{errors.agreedToTerms}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleProceedToPayment}
          disabled={loading}
          className={cn(
            "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
            loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700",
          )}
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              Continue to Payment
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Secure Payment</h2>
        <button
          type="button"
          onClick={() => setCurrentStep("details")}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Details
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing secure payment...</p>
          </div>
        </div>
      ) : paymentIntent ? (
        <StripePaymentForm
          clientSecret={paymentIntent.clientSecret}
          courseSchedule={courseSchedule}
          bookingData={formData as BookingFormData}
          totalAmount={Math.round(finalPrice * 100)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Payment Initialization Failed
          </h3>
          <p className="text-red-700 mb-4">
            We couldn't initialize the payment system. Please check that:
          </p>
          <ul className="text-left text-sm text-red-600 mb-4 max-w-md mx-auto">
            <li>• The backend server is running on port 3000</li>
            <li>• You have a stable internet connection</li>
            <li>• Your browser allows cookies and JavaScript</li>
          </ul>
          <button
            onClick={() => {
              setCurrentStep("details");
              setPaymentIntent(null);
            }}
            className="btn btn-primary"
          >
            Go Back and Try Again
          </button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      {currentStep === "details" && renderDetailsStep()}
      {currentStep === "payment" && renderPaymentStep()}
    </motion.div>
  );
};
