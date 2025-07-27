import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import { adminApi } from '@services/api/admin.service';
import { Calendar, Clock, MapPin, Users, Plus, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@utils/cn';
import "react-datepicker/dist/react-datepicker.css";

const courseSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  trainerId: z.string().min(1, 'Trainer is required'),
  locationId: z.string().min(1, 'Location is required'),
  sessionDate: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  maxParticipants: z.number().min(1).max(12, 'Maximum 12 participants allowed'),
  pricePerPerson: z.number().min(0, 'Price must be positive'),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
  recurrence: z.object({
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.number()).optional(),
  }).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseCreationFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const CourseCreationForm: React.FC<CourseCreationFormProps> = ({
  onSuccess,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [courses, setCourses] = useState<Array<{id: string; name: string; duration: string}>>([]);
  const [trainers, setTrainers] = useState<Array<{id: string; name: string}>>([]);
  const [locations, setLocations] = useState<Array<{id: string; name: string}>>([]);

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      maxParticipants: 12,
      isRecurring: false,
      recurrence: {
        daysOfWeek: [],
      },
    },
  });

  const isRecurring = watch('isRecurring');
  const selectedCourseId = watch('courseId');

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [coursesData, trainersData, locationsData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getTrainers(),
        adminApi.getLocations(),
      ]);

      setCourses(coursesData);
      setTrainers(trainersData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    setSuccess(false);

    try {
      const sessionData = {
        courseId: data.courseId,
        trainerId: data.trainerId,
        locationId: data.locationId,
        startDate: data.sessionDate,
        endDate: data.sessionDate, // Single day courses
        startTime: data.startTime,
        endTime: data.endTime,
        maxParticipants: data.maxParticipants,
        pricePerPerson: data.pricePerPerson,
        notes: data.notes,
      };

      if (data.isRecurring && data.recurrence?.endDate && data.recurrence?.daysOfWeek?.length) {
        await adminApi.createRecurringSessions({
          ...sessionData,
          recurrenceEndDate: data.recurrence.endDate,
          daysOfWeek: data.recurrence.daysOfWeek,
        });
      } else {
        await adminApi.createSession(sessionData);
      }

      setSuccess(true);
      reset();
      onSuccess?.();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to create session:', error);
      alert(error.response?.data?.error?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">Session(s) created successfully!</p>
        </div>
      )}

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Type
        </label>
        <select
          {...register('courseId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        >
          <option value="">Select a course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.duration})
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="text-red-600 text-sm mt-1">{errors.courseId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trainer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer
          </label>
          <select
            {...register('trainerId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          >
            <option value="">Select trainer</option>
            {trainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
          {errors.trainerId && (
            <p className="text-red-600 text-sm mt-1">{errors.trainerId.message}</p>
          )}
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            {...register('locationId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          >
            <option value="">Select location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          {errors.locationId && (
            <p className="text-red-600 text-sm mt-1">{errors.locationId.message}</p>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session Date
        </label>
        <Controller
          control={control}
          name="sessionDate"
          render={({ field }) => (
            <DatePicker
              selected={field.value}
              onChange={field.onChange}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholderText="Select date"
              disabled={loading}
            />
          )}
        />
        {errors.sessionDate && (
          <p className="text-red-600 text-sm mt-1">{errors.sessionDate.message}</p>
        )}
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            {...register('startTime')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          {errors.startTime && (
            <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            {...register('endTime')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          {errors.endTime && (
            <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {/* Capacity and Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Participants
          </label>
          <input
            type="number"
            {...register('maxParticipants', { valueAsNumber: true })}
            min="1"
            max="12"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          {errors.maxParticipants && (
            <p className="text-red-600 text-sm mt-1">{errors.maxParticipants.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price per Person (£)
          </label>
          <input
            type="number"
            {...register('pricePerPerson', { valueAsNumber: true })}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          {errors.pricePerPerson && (
            <p className="text-red-600 text-sm mt-1">{errors.pricePerPerson.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Any special notes for this session..."
          disabled={loading}
        />
      </div>

      {/* Recurring Sessions */}
      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="mr-2 rounded text-primary-600"
            disabled={loading}
          />
          <span className="text-sm font-medium text-gray-700">Create recurring sessions</span>
        </label>

        {isRecurring && (
          <div className="mt-4 pl-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat until
              </label>
              <Controller
                control={control}
                name="recurrence.endDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholderText="Select end date"
                    disabled={loading}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat on days
              </label>
              <div className="flex gap-2">
                {daysOfWeek.map((day, index) => (
                  <label
                    key={day}
                    className="flex items-center justify-center w-10 h-10 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      value={index}
                      {...register(`recurrence.daysOfWeek.${index}` as const, {
                        valueAsNumber: true,
                      })}
                      className="sr-only"
                      disabled={loading}
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Session...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Create Session
          </>
        )}
      </button>
    </form>
  );
};