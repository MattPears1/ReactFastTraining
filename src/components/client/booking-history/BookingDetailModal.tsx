import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  FileText,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { bookingHistoryService, clientPortalService } from "@/services/client";
import type { BookingDetails } from "@/types/client";

interface BookingDetailModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "attendees" | "payment"
  >("details");
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [bookingId, isOpen]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const data = await bookingHistoryService.getBookingDetails(bookingId);
      setBooking(data);
    } catch (error) {
      console.error("Failed to load booking details:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    if (!booking) return;

    setDownloadingCert(true);
    try {
      await bookingHistoryService.downloadCertificate(booking.booking.id);
    } catch (error) {
      console.error("Failed to download certificate:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloadingCert(false);
    }
  };

  const downloadInvoice = async () => {
    if (!booking?.invoice) return;

    setDownloadingInvoice(true);
    try {
      await bookingHistoryService.downloadInvoice(booking.invoice.id);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const addToCalendar = async () => {
    if (!booking) return;

    try {
      const icsUrl = await clientPortalService.addToCalendar(
        booking.booking.id,
      );
      window.open(icsUrl, "_blank");
    } catch (error) {
      console.error("Failed to add to calendar:", error);
    }
  };

  if (!isOpen) return null;

  const canDownloadCertificate =
    booking?.session.status === "completed" &&
    booking.attendance.some((a) => a.status === "present");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 mr-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Booking Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-all">
              Reference: {booking?.booking.bookingReference}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : booking ? (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar-mobile border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-3 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                  activeTab === "details"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <span className="hidden sm:inline">Course Details</span>
                <span className="sm:hidden">Details</span>
              </button>
              <button
                onClick={() => setActiveTab("attendees")}
                className={`px-3 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                  activeTab === "attendees"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Attendees ({booking.attendees.length})
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                className={`px-3 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                  activeTab === "payment"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <span className="hidden sm:inline">Payment & Invoice</span>
                <span className="sm:hidden">Payment</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Course Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Course Information
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {booking.session.courseType}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(
                              new Date(booking.session.sessionDate),
                              "EEEE, d MMMM yyyy",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {booking.session.location}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.session.startTime} -{" "}
                            {booking.session.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  {booking.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Special Requirements
                      </h3>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <ul className="space-y-2">
                          {booking.requirements.map((req, index) => (
                            <li key={index} className="text-sm">
                              <strong className="capitalize">
                                {req.category}:
                              </strong>{" "}
                              {req.requirementType}
                              {req.details && (
                                <p className="text-gray-600 dark:text-gray-400 ml-4">
                                  {req.details}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {booking.invoice && (
                      <button
                        onClick={downloadInvoice}
                        disabled={downloadingInvoice}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-4 h-4" />
                        {downloadingInvoice
                          ? "Downloading..."
                          : "Download Invoice"}
                      </button>
                    )}

                    {canDownloadCertificate && (
                      <button
                        onClick={downloadCertificate}
                        disabled={downloadingCert}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Award className="w-4 h-4" />
                        {downloadingCert
                          ? "Downloading..."
                          : "Download Certificate"}
                      </button>
                    )}

                    <button
                      onClick={addToCalendar}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Calendar className="w-4 h-4" />
                      Add to Calendar
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "attendees" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Attendee List</h3>
                  <div className="space-y-3">
                    {booking.attendees.map((attendee) => {
                      const attendance = booking.attendance.find(
                        (a) => a.userId === attendee.id,
                      );
                      return (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {attendee.name}
                              {attendee.isPrimary && (
                                <span className="ml-2 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full">
                                  Primary Contact
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {attendee.email}
                            </p>
                          </div>

                          {attendance && (
                            <div className="text-sm">
                              {attendance.status === "present" ? (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ Attended
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">
                                  ✗ Absent
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "payment" && (
                <div className="space-y-6">
                  {/* Payment Information */}
                  {booking.payment && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Payment Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Amount Paid:
                          </span>
                          <span className="font-medium">
                            £{booking.payment.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Payment Date:
                          </span>
                          <span>
                            {format(
                              new Date(booking.payment.createdAt),
                              "dd/MM/yyyy",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Status:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            ✓ Paid
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refund Information */}
                  {booking.refund && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Refund Information
                      </h3>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Refund Amount:
                          </span>
                          <span className="font-medium">
                            £{booking.refund.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Status:
                          </span>
                          <span className="capitalize">
                            {booking.refund.status}
                          </span>
                        </div>
                        {booking.refund.processedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Processed:
                            </span>
                            <span>
                              {format(
                                new Date(booking.refund.processedAt),
                                "dd/MM/yyyy",
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invoice */}
                  {booking.invoice && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Invoice</h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {booking.invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Issued:{" "}
                            {format(
                              new Date(booking.invoice.issueDate),
                              "dd/MM/yyyy",
                            )}
                          </p>
                        </div>
                        <button
                          onClick={downloadInvoice}
                          disabled={downloadingInvoice}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg disabled:opacity-50"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Booked on:{" "}
                  {format(
                    new Date(booking.booking.createdAt),
                    "dd/MM/yyyy HH:mm",
                  )}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Failed to load booking details</p>
          </div>
        )}
      </div>
    </div>
  );
};
