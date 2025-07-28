import React, { useState } from 'react';
import { 
  X, 
  Star, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  BookOpen,
  Image,
  CheckCircle,
  XCircle,
  Home,
  MessageSquare
} from 'lucide-react';
import { AdminBadge } from '../../../components/ui/AdminBadge';

interface TestimonialDetailsModalProps {
  testimonial: any;
  onClose: () => void;
  onStatusChange: (id: number, status: string, reason?: string) => void;
  onToggleHomepage: (id: number, show: boolean) => void;
}

export const TestimonialDetailsModal: React.FC<TestimonialDetailsModalProps> = ({
  testimonial,
  onClose,
  onStatusChange,
  onToggleHomepage,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <AdminBadge variant="warning">Pending Review</AdminBadge>;
      case 'approved':
        return <AdminBadge variant="success">Approved</AdminBadge>;
      case 'rejected':
        return <AdminBadge variant="danger">Rejected</AdminBadge>;
      case 'featured':
        return <AdminBadge variant="primary">Featured</AdminBadge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    onStatusChange(testimonial.id, 'approved');
  };

  const handleFeature = () => {
    onStatusChange(testimonial.id, 'featured');
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onStatusChange(testimonial.id, 'rejected', rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Testimonial Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusBadge(testimonial.status)}
              {testimonial.verifiedBooking && (
                <AdminBadge variant="info" icon={<CheckCircle className="w-3 h-3" />}>
                  Verified Booking
                </AdminBadge>
              )}
              {testimonial.showOnHomepage && (
                <AdminBadge variant="primary" icon={<Home className="w-3 h-3" />}>
                  On Homepage
                </AdminBadge>
              )}
            </div>
            
            <div className="flex gap-2">
              {testimonial.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              
              {(testimonial.status === 'approved' || testimonial.status === 'featured') && (
                <>
                  <button
                    onClick={() => onToggleHomepage(testimonial.id, !testimonial.showOnHomepage)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {testimonial.showOnHomepage ? 'Remove from Homepage' : 'Add to Homepage'}
                  </button>
                  {testimonial.status === 'approved' && (
                    <button
                      onClick={handleFeature}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Mark as Featured
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Rejection Reason</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Author Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Author Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{testimonial.authorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <a href={`mailto:${testimonial.authorEmail}`} className="font-medium text-primary-600 hover:underline">
                    {testimonial.authorEmail}
                  </a>
                </div>
                {testimonial.authorLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{testimonial.authorLocation}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Course Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium">{testimonial.courseTaken}</span>
                </div>
                {testimonial.courseDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(testimonial.courseDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
                {testimonial.bookingReference && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Booking Ref:</span>
                    <span className="font-medium">{testimonial.bookingReference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Rating</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-medium">{testimonial.rating} out of 5</span>
            </div>
          </div>

          {/* Testimonial Content */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Testimonial Content
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{testimonial.content}</p>
            </div>
          </div>

          {/* Photo */}
          {testimonial.photoUrl && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Submitted Photo
              </h3>
              <div className="space-y-2">
                <img
                  src={testimonial.photoUrl}
                  alt="Testimonial"
                  className="max-w-xs rounded-lg border"
                />
                <p className="text-sm text-gray-600">
                  Photo consent: {' '}
                  <span className={`font-medium ${
                    testimonial.photoConsent === 'given' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testimonial.photoConsent === 'given' ? 'Given' : 'Not Given'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Display Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Show Full Name:</span>
                  <span className="font-medium">
                    {testimonial.showFullName ? 'Yes' : 'No (First name + last initial)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Display Order:</span>
                  <span className="font-medium">{testimonial.displayOrder || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Timestamps</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">
                    {new Date(testimonial.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>
                {testimonial.approvedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Approved:</span>
                    <span className="font-medium">
                      {new Date(testimonial.approvedAt).toLocaleString('en-GB')}
                      {testimonial.approvedBy && ` by ${testimonial.approvedBy}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {testimonial.status === 'rejected' && testimonial.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Rejection Reason</h3>
              <p className="text-red-700">{testimonial.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};