import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Filter, Plus } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";
import { CalendarEvent, FilterState, CalendarView } from "./types";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { CalendarEventComponent } from "./components/CalendarEvent";
import { CalendarFilters } from "./components/CalendarFilters";
import { CalendarLegend } from "./components/CalendarLegend";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { getRange, eventStyleGetter } from "./utils/calendar-helpers";

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Drag and drop calendar component
const DragAndDropCalendar = withDragAndDrop(Calendar);

export const AdminCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    courseType: "",
    location: "",
    instructor: "",
  });

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range based on current view
      const range = getRange(date, view);

      // Mock data for now - replace with actual API call
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Emergency First Aid at Work",
          start: new Date(2025, 0, 29, 9, 0),
          end: new Date(2025, 0, 29, 16, 0),
          resource: {
            sessionId: "1",
            courseType: "EFAW",
            location: "Leeds Training Center",
            instructor: "John Smith",
            capacity: {
              max: 12,
              booked: 8,
              available: 4,
              percentFull: 66.67,
              status: "filling",
            },
            stats: {
              bookings: 8,
              revenue: 600,
              waitlist: 0,
              hasSpecialRequirements: true,
            },
            status: "scheduled",
          },
        },
        {
          id: "2",
          title: "Paediatric First Aid",
          start: new Date(2025, 0, 30, 9, 0),
          end: new Date(2025, 0, 30, 16, 0),
          resource: {
            sessionId: "2",
            courseType: "Paediatric",
            location: "Sheffield Venue",
            instructor: "Sarah Johnson",
            capacity: {
              max: 10,
              booked: 10,
              available: 0,
              percentFull: 100,
              status: "full",
            },
            stats: {
              bookings: 10,
              revenue: 750,
              waitlist: 2,
              hasSpecialRequirements: false,
            },
            status: "scheduled",
          },
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      showToast("Failed to load calendar data", "error");
      console.error("Error loading calendar:", error);
    } finally {
      setLoading(false);
    }
  }, [date, view, filters, showToast]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Handle event drag and drop
  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      // Validate business hours
      const startHour = moment(start).hour();
      const endHour = moment(end).hour();

      if (startHour < 8 || endHour > 18) {
        showToast("Sessions must be between 8:00 AM and 6:00 PM", "error");
        return;
      }

      // Update event locally for instant feedback
      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === event.id ? { ...e, start, end } : e)),
      );

      // API call to update session
      // await adminDashboardApi.rescheduleSession(event.resource.sessionId, start, end);

      showToast("Session rescheduled successfully", "success");
    } catch (error) {
      showToast("Failed to reschedule session", "error");
      // Reload to reset changes
      loadCalendarData();
    }
  };

  // Handle slot selection for creating new sessions
  const handleSelectSlot = ({ start, end }: any) => {
    // Open create session modal with pre-filled dates
    setShowCreateModal(true);
  };

  // Custom toolbar wrapper to match expected props
  const CustomToolbarWrapper = (toolbar: any) => {
    return (
      <CalendarToolbar
        date={toolbar.date}
        view={toolbar.view}
        onNavigate={toolbar.onNavigate}
        onView={toolbar.onView}
      />
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Calendar Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all course sessions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors",
                showFilters
                  ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <CalendarFilters filters={filters} onChange={setFilters} />
      )}

      {/* Calendar Legend */}
      <CalendarLegend />

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={(newView: any) => setView(newView)}
            onNavigate={(newDate: Date) => setDate(newDate)}
            onEventDrop={handleEventDrop}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbarWrapper,
              event: CalendarEventComponent,
            }}
            views={["month", "week", "day", "agenda"]}
            step={30}
            showMultiDayTimes
            selectable
            resizable={false}
            style={{ height: 600 }}
            className="admin-calendar"
          />
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedEvent && (
        <SessionDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={loadCalendarData}
        />
      )}
    </div>
  );
};

export default AdminCalendarPage;
