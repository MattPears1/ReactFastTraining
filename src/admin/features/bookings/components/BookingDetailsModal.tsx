import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Building,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Edit3,
  Send,
  FileText,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AdminCard } from '../../../components/ui/AdminCard';
import { AdminBadge } from '../../../components/ui/AdminBadge';
import { Button } from '../../../../components/ui/Button';
import type { Booking } from '../../../../types/booking';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdate: (data: Partial<Booking>) => void;
  isUpdating: boolean;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onUpdate,
  isUpdating
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editedBooking, setEditedBooking] = useState(booking);
  const [emailData, setEmailData] = useState({
    subject: `Booking Confirmation - ${booking.courseName}`,
    message: `Dear ${booking.customerName},

Thank you for your booking with React Fast Training.

Course Details:
- Course: ${booking.courseName}
- Date: ${format(parseISO(booking.courseDate), 'dd MMMM yyyy')}
- Time: ${booking.courseTime}
- Venue: ${booking.courseVenue}
- Number of Attendees: ${booking.attendees}

Booking Reference: ${booking.bookingReference}
Total Amount: £${booking.totalAmount}

If you have any questions, please don't hesitate to contact us.

Best regards,
React Fast Training Team`
  });

  const handleUpdate = () => {
    onUpdate(editedBooking);
    setIsEditing(false);
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: booking.customerEmail,
          subject: emailData.subject,
          message: emailData.message
        })
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
        setShowEmailForm(false);
      }
    } catch (error) {
      alert('Failed to send email');
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Booking Details - {booking.bookingReference}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AdminBadge variant={getStatusVariant(booking.status)}>
                {booking.status}
              </AdminBadge>
              <AdminBadge variant={getPaymentVariant(booking.paymentStatus)}>
                Payment: {booking.paymentStatus}
              </AdminBadge>
            </div>
            <div className="flex gap-2">
              {!isEditing && !showEmailForm && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="admin-btn admin-btn-secondary"
                  >
                    <Edit3 className="admin-icon-sm" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="admin-btn admin-btn-primary"
                  >
                    <Mail className="admin-icon-sm" />
                    Send Email
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email Form */}
          {showEmailForm && (
            <AdminCard className="border-2 border-primary-500">
              <h3 className="text-lg font-semibold mb-4">Send Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To:
                  </label>
                  <input
                    type="text"
                    value={booking.customerEmail}
                    readOnly
                    className="admin-input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message:
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    rows={10}
                    className="admin-input"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendEmail}
                    className="admin-btn admin-btn-primary"
                  >
                    <Send className="admin-icon-sm" />
                    Send Email
                  </button>
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </AdminCard>
          )}

          {/* Customer Information */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.customerName}
                    onChange={(e) => setEditedBooking({ ...editedBooking, customerName: e.target.value })}
                    className="admin-input mt-1"
                  />
                ) : (
                  <p className="font-medium">{booking.customerName}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedBooking.customerEmail}
                    onChange={(e) => setEditedBooking({ ...editedBooking, customerEmail: e.target.value })}
                    className="admin-input mt-1"
                  />
                ) : (
                  <p className="font-medium">{booking.customerEmail}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedBooking.customerPhone}
                    onChange={(e) => setEditedBooking({ ...editedBooking, customerPhone: e.target.value })}
                    className="admin-input mt-1"
                  />
                ) : (
                  <p className="font-medium">{booking.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.companyName || ''}
                    onChange={(e) => setEditedBooking({ ...editedBooking, companyName: e.target.value })}
                    className="admin-input mt-1"
                  />
                ) : (
                  <p className="font-medium">{booking.companyName || 'N/A'}</p>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Course Information */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Course Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Course
                </p>
                <p className="font-medium">{booking.courseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date
                </p>
                <p className="font-medium">{format(parseISO(booking.courseDate), 'dd MMMM yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Time
                </p>
                <p className="font-medium">{booking.courseTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Venue
                </p>
                <p className="font-medium">{booking.courseVenue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Attendees
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedBooking.attendees}
                    onChange={(e) => setEditedBooking({ ...editedBooking, attendees: parseInt(e.target.value) })}
                    className="admin-input mt-1"
                    min="1"
                  />
                ) : (
                  <p className="font-medium">{booking.attendees}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  Total Amount
                </p>
                <p className="font-medium text-lg">£{booking.totalAmount}</p>
              </div>
            </div>
          </AdminCard>

          {/* Booking Status */}
          {isEditing && (
            <AdminCard>
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Status
                  </label>
                  <select
                    value={editedBooking.status}
                    onChange={(e) => setEditedBooking({ ...editedBooking, status: e.target.value as any })}
                    className="admin-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editedBooking.paymentStatus}
                    onChange={(e) => setEditedBooking({ ...editedBooking, paymentStatus: e.target.value as any })}
                    className="admin-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </AdminCard>
          )}

          {/* Notes */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            {isEditing ? (
              <textarea
                value={editedBooking.notes || ''}
                onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })}
                rows={3}
                className="admin-input"
                placeholder="Add any notes about this booking..."
              />
            ) : (
              <p className="text-gray-700">{booking.notes || 'No notes added'}</p>
            )}
          </AdminCard>

          {/* Timestamps */}
          <div className="text-sm text-gray-500">
            <p>Created: {format(parseISO(booking.createdAt), 'dd MMM yyyy HH:mm')}</p>
            <p>Last Updated: {format(parseISO(booking.updatedAt), 'dd MMM yyyy HH:mm')}</p>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="admin-btn admin-btn-primary"
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditedBooking(booking);
                  setIsEditing(false);
                }}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};