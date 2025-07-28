import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Eye, 
  Check, 
  X, 
  MessageSquare, 
  Calendar,
  User,
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminTable } from '../../components/ui/AdminTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotifications } from '../../contexts/NotificationContext';
import { TestimonialDetailsModal } from './components/TestimonialDetailsModal';

interface Testimonial {
  id: number;
  authorName: string;
  authorEmail: string;
  authorLocation?: string;
  courseTaken: string;
  courseDate?: string;
  content: string;
  rating: number;
  photoUrl?: string;
  photoConsent: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  showOnHomepage: boolean;
  verifiedBooking: boolean;
  bookingReference?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export const TestimonialsPage: React.FC = () => {
  const { showNotification } = useNotifications();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    averageRating: 0,
  });

  useEffect(() => {
    fetchTestimonials();
    fetchStats();
  }, [filterStatus]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/testimonials?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      // Use mock data for development
      setTestimonials(getMockTestimonials());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/testimonials/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Use mock stats
      setStats({
        total: 45,
        pending: 5,
        approved: 35,
        rejected: 3,
        featured: 2,
        averageRating: 4.8,
      });
    }
  };

  const handleStatusChange = async (testimonialId: number, newStatus: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          rejectionReason: rejectionReason,
        }),
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Testimonial ${newStatus} successfully`,
        });
        fetchTestimonials();
        fetchStats();
        setSelectedTestimonial(null);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update testimonial status',
      });
    }
  };

  const handleToggleHomepage = async (testimonialId: number, showOnHomepage: boolean) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ showOnHomepage }),
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          title: 'Updated',
          message: showOnHomepage ? 'Added to homepage' : 'Removed from homepage',
        });
        fetchTestimonials();
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update homepage display',
      });
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.courseTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <AdminBadge variant="warning" icon={<Clock className="w-3 h-3" />}>Pending</AdminBadge>;
      case 'approved':
        return <AdminBadge variant="success" icon={<CheckCircle className="w-3 h-3" />}>Approved</AdminBadge>;
      case 'rejected':
        return <AdminBadge variant="danger" icon={<XCircle className="w-3 h-3" />}>Rejected</AdminBadge>;
      case 'featured':
        return <AdminBadge variant="primary" icon={<Star className="w-3 h-3" />}>Featured</AdminBadge>;
      default:
        return null;
    }
  };

  const columns = [
    {
      header: 'Author',
      accessor: (testimonial: Testimonial) => (
        <div>
          <p className="font-medium">{testimonial.authorName}</p>
          <p className="text-sm text-gray-500">{testimonial.authorEmail}</p>
          {testimonial.authorLocation && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {testimonial.authorLocation}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Course',
      accessor: (testimonial: Testimonial) => (
        <div>
          <p className="text-sm">{testimonial.courseTaken}</p>
          {testimonial.courseDate && (
            <p className="text-xs text-gray-500">
              {new Date(testimonial.courseDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: (testimonial: Testimonial) => (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      header: 'Content',
      accessor: (testimonial: Testimonial) => (
        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
          {testimonial.content}
        </p>
      ),
    },
    {
      header: 'Status',
      accessor: (testimonial: Testimonial) => getStatusBadge(testimonial.status),
    },
    {
      header: 'Verified',
      accessor: (testimonial: Testimonial) => (
        testimonial.verifiedBooking ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      header: 'Homepage',
      accessor: (testimonial: Testimonial) => (
        <button
          onClick={() => handleToggleHomepage(testimonial.id, !testimonial.showOnHomepage)}
          className={`p-1 rounded ${
            testimonial.showOnHomepage
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          disabled={testimonial.status !== 'approved' && testimonial.status !== 'featured'}
        >
          {testimonial.showOnHomepage ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: (testimonial: Testimonial) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTestimonial(testimonial)}
            className="text-gray-600 hover:text-gray-900"
            title="View details"
          >
            <Eye className="w-5 h-5" />
          </button>
          {testimonial.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(testimonial.id, 'approved')}
                className="text-green-600 hover:text-green-700"
                title="Approve"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  if (reason) {
                    handleStatusChange(testimonial.id, 'rejected', reason);
                  }
                }}
                className="text-red-600 hover:text-red-700"
                title="Reject"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Testimonials Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-primary-600">{stats.featured}</p>
            </div>
            <Star className="w-8 h-8 text-primary-400" />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="featured">Featured</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={filteredTestimonials}
          emptyMessage="No testimonials found"
        />
      </AdminCard>

      {/* Details Modal */}
      {selectedTestimonial && (
        <TestimonialDetailsModal
          testimonial={selectedTestimonial}
          onClose={() => setSelectedTestimonial(null)}
          onStatusChange={handleStatusChange}
          onToggleHomepage={handleToggleHomepage}
        />
      )}
    </div>
  );
};

// Mock data for development
function getMockTestimonials(): Testimonial[] {
  return [
    {
      id: 1,
      authorName: 'John Smith',
      authorEmail: 'john.smith@example.com',
      authorLocation: 'Leeds, Yorkshire',
      courseTaken: 'Emergency First Aid at Work',
      courseDate: '2025-01-15',
      content: 'Excellent course! The instructor was very knowledgeable and made the content easy to understand.',
      rating: 5,
      photoUrl: 'https://via.placeholder.com/150',
      photoConsent: 'given',
      status: 'pending',
      showOnHomepage: false,
      verifiedBooking: true,
      bookingReference: 'RFT-2025-0001',
      createdAt: '2025-01-16T10:00:00Z',
    },
    {
      id: 2,
      authorName: 'Sarah Johnson',
      authorEmail: 'sarah.j@example.com',
      authorLocation: 'Sheffield',
      courseTaken: 'Paediatric First Aid',
      courseDate: '2025-01-10',
      content: 'Great training! I feel much more confident handling emergencies with children now.',
      rating: 5,
      photoUrl: null,
      photoConsent: 'not_given',
      status: 'approved',
      showOnHomepage: true,
      verifiedBooking: true,
      bookingReference: 'RFT-2025-0002',
      createdAt: '2025-01-11T14:30:00Z',
      approvedAt: '2025-01-12T09:00:00Z',
      approvedBy: 'Admin',
    },
  ];
}