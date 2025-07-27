import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Calendar, Mail, Home } from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { bookingApi, BookingDetails } from '@/services/api/bookings';
import SEO from '@/components/common/SEO';
import Button from '@/components/ui/Button';

export const BookingSuccessPage: React.FC = () => {
  const { bookingReference } = useParams();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingICS, setDownloadingICS] = useState(false);

  useEffect(() => {
    // Celebration animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0EA5E9', '#10B981', '#F97316'],
    });

    // Load booking details
    if (bookingReference) {
      loadBooking();
    }
  }, [bookingReference]);

  const loadBooking = async () => {
    try {
      const data = await bookingApi.getBookingByReference(bookingReference!);
      setBooking(data);
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadConfirmation = async () => {
    if (!booking) return;
    
    setDownloadingPDF(true);
    try {
      const blob = await bookingApi.downloadPDF(booking.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingReference}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const downloadCalendar = async () => {
    if (!booking) return;
    
    setDownloadingICS(true);
    try {
      const blob = await bookingApi.downloadICS(booking.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course-booking.ics';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download calendar file:', error);
    } finally {
      setDownloadingICS(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <Link to="/" className="text-primary-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(booking.courseDetails.sessionDate);

  return (
    <>
      <SEO 
        title="Booking Confirmed"
        description="Your first aid training course booking has been confirmed"
        noIndex={true}
      />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center">
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-lg opacity-90">
                Thank you for booking with React Fast Training
              </p>
            </div>

            {/* Booking Reference */}
            <div className="p-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center mb-8">
                <p className="text-sm text-gray-600 mb-2">Your Booking Reference</p>
                <p className="text-3xl font-bold text-primary-600">
                  {booking.bookingReference}
                </p>
              </div>

              {/* Next Steps */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Check Your Email</p>
                      <p className="text-sm text-gray-600">
                        We've sent confirmation details to all attendees
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Mark Your Calendar</p>
                      <p className="text-sm text-gray-600">
                        {format(sessionDate, 'EEEE, d MMMM yyyy')}
                        at {booking.courseDetails.startTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Summary */}
              <div className="border-t pt-6 mb-8">
                <h3 className="font-semibold mb-3">Booking Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Course:</dt>
                    <dd className="font-medium">{booking.courseDetails.courseType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Location:</dt>
                    <dd className="font-medium">{booking.courseDetails.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Attendees:</dt>
                    <dd className="font-medium">{booking.numberOfAttendees}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Total Paid:</dt>
                    <dd className="font-medium text-green-600">£{booking.totalAmount}</dd>
                  </div>
                </dl>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={downloadConfirmation}
                  variant="primary"
                  disabled={downloadingPDF}
                  className="flex-1"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {downloadingPDF ? 'Downloading...' : 'Download Confirmation'}
                </Button>
                <Button
                  onClick={downloadCalendar}
                  variant="secondary"
                  disabled={downloadingICS}
                  className="flex-1"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {downloadingICS ? 'Downloading...' : 'Add to Calendar'}
                </Button>
              </div>

              {/* Manage Booking Link */}
              <div className="text-center mt-8 pt-8 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Need to make changes to your booking?
                </p>
                <Link
                  to="/my-bookings"
                  className="text-primary-600 hover:underline font-medium"
                >
                  Manage Your Bookings →
                </Link>
              </div>

              {/* Return Home */}
              <div className="text-center mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4" />
                  Return to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Important Reminders</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Please arrive 15 minutes before the start time</li>
              <li>• Bring photo ID for registration</li>
              <li>• Wear comfortable clothing suitable for practical exercises</li>
              <li>• We'll send a reminder email 24 hours before your course</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};