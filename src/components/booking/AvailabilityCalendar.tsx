import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, Event as CalendarEvent, View } from 'react-big-calendar';
import moment from 'moment';
import { useWebSocket, SessionUpdateEvent } from '@hooks/useWebSocket';
import { calendarApi } from '@services/api/calendar.service';
import { Loader2 } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CustomEvent extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    availableSpots: number;
    maxCapacity: number;
    location: string;
    color: string;
    currentBookings: number;
    percentFull: number;
    status: string;
  };
}

interface AvailabilityCalendarProps {
  onSessionSelect?: (sessionId: string) => void;
  onDateSelect?: (date: Date, sessions: any[]) => void;
  className?: string;
  filters?: {
    courseType?: string;
    location?: string;
  };
  isAdminView?: boolean;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onSessionSelect,
  onDateSelect,
  className = '',
  filters: externalFilters,
  isAdminView = false,
}) => {
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    courseType: externalFilters?.courseType || '',
    location: externalFilters?.location || '',
  });

  // Update filters when external filters change
  useEffect(() => {
    if (externalFilters) {
      setFilters({
        courseType: externalFilters.courseType || '',
        location: externalFilters.location || '',
      });
    }
  }, [externalFilters]);

  const { subscribe, unsubscribe } = useWebSocket();

  // Load events for current view
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = moment(date).startOf(view).toDate();
      const endDate = moment(date).endOf(view).toDate();

      const sessions = await calendarApi.getAvailability({
        startDate,
        endDate,
        courseType: filters.courseType || undefined,
        location: filters.location || undefined,
      });

      const calendarEvents: CustomEvent[] = sessions.map(session => ({
        id: session.id,
        title: session.title,
        start: new Date(session.start),
        end: new Date(session.end),
        resource: {
          availableSpots: session.availableSpots,
          maxCapacity: session.maxCapacity,
          location: session.location,
          color: session.color,
          currentBookings: session.extendedProps.currentBookings,
          percentFull: session.extendedProps.percentFull,
          status: session.extendedProps.status,
        },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [date, view, filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleSessionUpdate = (data: SessionUpdateEvent) => {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === data.sessionId
            ? {
                ...event,
                resource: {
                  ...event.resource,
                  currentBookings: data.currentBookings,
                  availableSpots: data.availableSpots,
                  percentFull: Math.round((data.currentBookings / event.resource.maxCapacity) * 100),
                  status: data.availableSpots === 0 ? 'FULL' : 
                         data.availableSpots <= 3 ? 'ALMOST_FULL' : 'AVAILABLE',
                },
              }
            : event
        )
      );
    };

    const unsubscribeFn = subscribe('session-update', handleSessionUpdate);
    return unsubscribeFn;
  }, [subscribe]);

  // Custom event style
  const eventStyleGetter = (event: CustomEvent) => {
    const { availableSpots, color } = event.resource;
    const isFull = availableSpots === 0;
    const isAlmostFull = availableSpots <= 3 && availableSpots > 0;

    return {
      style: {
        backgroundColor: isFull ? '#DC2626' : color,
        opacity: isFull ? 0.7 : 1,
        border: isAlmostFull ? '2px solid #F59E0B' : 'none',
        color: '#FFFFFF',
        fontWeight: 600,
      },
    };
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CustomEvent }) => (
    <div className="p-1 h-full">
      <div className="font-semibold text-xs truncate">{event.title}</div>
      <div className="text-xs mt-1">
        {event.resource.availableSpots > 0 ? (
          <span className="text-green-100">
            {event.resource.availableSpots} spots
          </span>
        ) : (
          <span className="text-red-100 font-bold">FULL</span>
        )}
      </div>
    </div>
  );

  const handleSelectEvent = (event: CustomEvent) => {
    if (isAdminView && onSessionSelect) {
      onSessionSelect(event.id);
    } else if (!isAdminView && event.resource.availableSpots > 0 && onSessionSelect) {
      onSessionSelect(event.id);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (isAdminView && onDateSelect) {
      // Find sessions on this date
      const selectedDate = moment(slotInfo.start).startOf('day');
      const sessionsOnDate = events.filter(event => 
        moment(event.start).isSame(selectedDate, 'day')
      );
      onDateSelect(slotInfo.start, sessionsOnDate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Filter Controls - Only show if not in admin view */}
      {!isAdminView && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.courseType}
              onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Courses</option>
              <option value="Emergency First Aid at Work">Emergency First Aid at Work</option>
              <option value="First Aid at Work">First Aid at Work</option>
              <option value="Paediatric First Aid">Paediatric First Aid</option>
              <option value="CPR and AED">CPR and AED</option>
              <option value="Mental Health First Aid">Mental Health First Aid</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Locations</option>
              <option value="Location A">Location A</option>
              <option value="Location B">Location B</option>
            </select>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="p-4" style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={(newView) => setView(newView)}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={isAdminView}
          popup
          tooltipAccessor={(event: CustomEvent) =>
            `${event.title} - ${event.resource.location}\n` +
            `${event.resource.availableSpots} of ${event.resource.maxCapacity} spots available`
          }
          messages={{
            next: 'Next',
            previous: 'Previous',
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
          }}
        />
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Almost Full (≤3 spots)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Fully Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
};