import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Users,
  Clock,
  PoundSterling,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Course {
  id: string;
  name: string;
  code: string;
  type: string;
  duration: number;
  price: number;
  maxParticipants: number;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  totalBookings: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Emergency First Aid at Work (EFAW)',
    code: 'EFAW-001',
    type: 'EFAW',
    duration: 6,
    price: 75,
    maxParticipants: 12,
    description: 'HSE approved Emergency First Aid at Work training course',
    status: 'active',
    totalBookings: 45,
    revenue: 3375,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'First Aid at Work (FAW)',
    code: 'FAW-001',
    type: 'FAW',
    duration: 18,
    price: 150,
    maxParticipants: 12,
    description: 'Comprehensive First Aid at Work training over 3 days',
    status: 'active',
    totalBookings: 32,
    revenue: 4800,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-18T16:00:00Z'
  },
  {
    id: '3',
    name: 'Paediatric First Aid',
    code: 'PFA-001',
    type: 'PAEDIATRIC',
    duration: 6,
    price: 85,
    maxParticipants: 10,
    description: 'Specialized first aid training for children and infants',
    status: 'active',
    totalBookings: 28,
    revenue: 2380,
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-19T11:15:00Z'
  }
];

export const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // Mock data fetching - replace with actual API call
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['admin-courses', searchTerm, statusFilter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = mockCourses;
      
      if (searchTerm) {
        filtered = filtered.filter(course => 
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(course => course.status === statusFilter);
      }
      
      return filtered;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting course:', courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const handleDelete = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(courseId);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load courses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your training courses, pricing, and availability
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search courses..."
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="inline-flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
                <span className={getStatusBadge(course.status)}>
                  {course.status}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {course.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {course.duration}h
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  Max {course.maxParticipants}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <PoundSterling className="h-4 w-4 mr-1" />
                  £{course.price}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {course.totalBookings} bookings
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      £{course.revenue.toLocaleString()} revenue
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated {new Date(course.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {courses?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Users className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Get started by creating your first course'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};