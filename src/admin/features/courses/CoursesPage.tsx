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
  Download,
  BookOpen
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { AdminEmptyState } from '../../components/ui/AdminEmptyState';
import '../../styles/admin-design-system.css';

interface Course {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: number;
  status: 'active' | 'inactive';
  attendees: number;
}


export const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch courses from API
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/admin/courses`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter courses locally
  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];
    
    let filtered = courses;
    
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }
    
    return filtered;
  }, [courses, searchTerm, statusFilter]);

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

  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load courses</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">Please try refreshing the page</p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Course Management</h1>
            <p className="admin-page-subtitle">
              Manage your training courses, pricing, and availability
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus className="admin-icon-sm" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn admin-btn-secondary">
              <Download className="admin-icon-sm" />
              Export
            </button>
          </div>
        </div>
      </AdminCard>

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses?.map((course) => (
          <AdminCard key={course.id} className="admin-hover-lift">
            <div className="flex items-start justify-between admin-mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.name}
                </h3>
                <p className="admin-text-small admin-text-muted capitalize">{course.category}</p>
              </div>
              <AdminBadge variant={getStatusVariant(course.status)}>
                {course.status}
              </AdminBadge>
            </div>

            <div className="grid grid-cols-2 gap-3 admin-mb-4">
              <div className="flex items-center admin-text-small admin-text-muted">
                <Clock className="admin-icon-sm mr-1.5 text-primary-500" />
                {course.duration}
              </div>
              <div className="flex items-center admin-text-small admin-text-muted">
                <PoundSterling className="admin-icon-sm mr-1.5 text-primary-500" />
                £{course.price}
              </div>
              <div className="flex items-center admin-text-small admin-text-muted">
                <Users className="admin-icon-sm mr-1.5 text-primary-500" />
                {course.attendees} attendees
              </div>
              <div className="flex items-center admin-text-small admin-text-muted">
                <Calendar className="admin-icon-sm mr-1.5 text-primary-500" />
                £{(course.price * course.attendees).toLocaleString()} revenue
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="admin-text-small admin-text-muted">
                    Category: <span className="font-medium capitalize">{course.category}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="admin-btn admin-btn-secondary p-2" title="View">
                    <Eye className="admin-icon-sm" />
                  </button>
                  <button className="admin-btn admin-btn-secondary p-2" title="Edit">
                    <Edit3 className="admin-icon-sm" />
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id.toString())}
                    className="admin-btn admin-btn-secondary p-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 className="admin-icon-sm" />
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Empty state */}
      {filteredCourses?.length === 0 && (
        <AdminCard>
          <AdminEmptyState
            icon={BookOpen}
            title="No courses found"
            description={
              searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first course'
            }
            action={
              !searchTerm && statusFilter === 'all' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="admin-btn admin-btn-primary"
                >
                  <Plus className="admin-icon-sm" />
                  Add Course
                </button>
              )
            }
          />
        </AdminCard>
      )}
    </div>
  );
};