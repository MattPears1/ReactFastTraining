import React, { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingHistoryService } from '@/services/client';
import { CourseItem } from './CourseItem';
import type { UpcomingCourse } from '@/types/client';

interface CourseListProps {
  courses: UpcomingCourse[];
  onUpdate: () => void;
}

const CourseListComponent: React.FC<CourseListProps> = ({ courses, onUpdate }) => {
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleReschedule = useCallback((bookingId: string) => {
    navigate(`/client/bookings/${bookingId}/reschedule`);
  }, [navigate]);

  const handleCancel = useCallback(async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await bookingHistoryService.cancelBooking(bookingId, 'Customer requested cancellation');
      onUpdate();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }, [onUpdate]);

  return (
    <div className="space-y-4" role="list">
      {courses.map((course) => (
        <div key={course.booking.id} role="listitem">
          <CourseItem
            course={course}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
            isLoading={cancellingId === course.booking.id}
          />
        </div>
      ))}
    </div>
  );
};

export const CourseList = memo(CourseListComponent, (prevProps, nextProps) => {
  // Only re-render if courses array changes
  return (
    prevProps.courses.length === nextProps.courses.length &&
    prevProps.courses.every((course, index) => 
      course.booking.id === nextProps.courses[index]?.booking.id &&
      course.booking.status === nextProps.courses[index]?.booking.status
    )
  );
});