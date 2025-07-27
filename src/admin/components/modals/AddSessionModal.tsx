import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { adminCourseSessionService } from '../../services/course-session.service';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Course {
  id: number;
  name: string;
  course_type: string;
  duration_hours: number;
  price: number;
  max_capacity: number;
}

interface Venue {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  capacity: number;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    courseId: '',
    venueId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('adminAccessToken');
      
      const response = await fetch(`${apiUrl}/api/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json() as Course[];
    },
    enabled: isOpen
  });

  // Fetch venues for dropdown
  const { data: venues } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('adminAccessToken');
      
      const response = await fetch(`${apiUrl}/api/admin/venues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch venues');
      return response.json() as Venue[];
    },
    enabled: isOpen
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('adminAccessToken');
      
      const startDatetime = `${data.date} ${data.startTime}:00`;
      const endDatetime = `${data.date} ${data.endTime}:00`;
      
      const response = await fetch(`${apiUrl}/course-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: parseInt(data.courseId),
          venueId: parseInt(data.venueId),
          startDatetime,
          endDatetime,
          notes: data.notes
        })
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      onClose();
      setFormData({
        courseId: '',
        venueId: '',
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        notes: ''
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Course
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a course...</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} (£{course.price})
                </option>
              ))}
            </select>
          </div>

          {/* Venue Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              Venue
            </label>
            <select
              name="venueId"
              value={formData.venueId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a venue...</option>
              {venues?.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.city}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-4 w-4 mr-1" />
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes for this session..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSessionMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
            </button>
          </div>

          {createSessionMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Failed to create session. Please try again.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};