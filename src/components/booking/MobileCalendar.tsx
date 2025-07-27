import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { CalendarEvent } from '@services/api/calendar.service';

interface MobileCalendarProps {
  events: CalendarEvent[];
  onSessionSelect?: (sessionId: string) => void;
  className?: string;
}

export const MobileCalendar: React.FC<MobileCalendarProps> = ({
  events,
  onSessionSelect,
  className = '',
}) => {
  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = format(new Date(event.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No courses scheduled for the selected period.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedDates.map(date => (
        <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Date Header */}
          <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
            <div className="flex items-center gap-2 text-primary-700">
              <Calendar className="w-4 h-4" />
              <h3 className="font-semibold">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>
          </div>

          {/* Events for this date */}
          <div className="divide-y divide-gray-100">
            {groupedEvents[date].map(event => {
              const isFull = event.availableSpots === 0;
              const isAlmostFull = event.availableSpots > 0 && event.availableSpots <= 3;
              
              return (
                <div
                  key={event.id}
                  onClick={() => !isFull && onSessionSelect?.(event.id)}
                  className={`p-4 transition-colors ${
                    isFull 
                      ? 'bg-gray-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {/* Course Title */}
                  <h4 className={`font-medium text-lg mb-2 ${
                    isFull ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {event.title}
                  </h4>

                  {/* Course Details */}
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(event.start), 'h:mm a')} - 
                        {format(new Date(event.end), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.extendedProps.currentBookings} / {event.maxCapacity} attendees
                      </span>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      {isFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Fully Booked
                        </span>
                      ) : isAlmostFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Only {event.availableSpots} spots left!
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {event.availableSpots} spots available
                        </span>
                      )}
                    </div>
                    {!isFull && (
                      <button className="text-primary-600 font-medium text-sm hover:text-primary-700">
                        Book Now →
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFull 
                            ? 'bg-red-500' 
                            : isAlmostFull 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${event.extendedProps.percentFull}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};