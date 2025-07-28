import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import {
  Filter,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { cn } from "@utils/cn";

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Drag and drop calendar component
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    sessionId: string;
    courseType: string;
    location: string;
    instructor: string;
    capacity: {
      max: number;
      booked: number;
      available: number;
      percentFull: number;
      status: "available" | "filling" | "nearly-full" | "full";
    };
    stats: {
      bookings: number;
      revenue: number;
      waitlist: number;
      hasSpecialRequirements: boolean;
    };
    status: string;
  };
}

interface FilterState {
  courseType: string;
  location: string;
  instructor: string;
}

export const AdminCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(
    Views.MONTH,
  );
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

  // Get date range for current view
  const getRange = (date: Date, view: string) => {
    const start = moment(date)
      .startOf(view as any)
      .toDate();
    const end = moment(date)
      .endOf(view as any)
      .toDate();
    return { start, end };
  };

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

  // Event style getter for color coding
  const eventStyleGetter = (event: CalendarEvent) => {
    const { capacity, status } = event.resource;

    let backgroundColor = "#10B981"; // Green - available
    if (status === "cancelled") {
      backgroundColor = "#6B7280"; // Gray
    } else if (status === "completed") {
      backgroundColor = "#8B5CF6"; // Purple
    } else if (capacity.percentFull >= 100) {
      backgroundColor = "#EF4444"; // Red - full
    } else if (capacity.percentFull >= 75) {
      backgroundColor = "#F59E0B"; // Amber - nearly full
    } else if (capacity.percentFull >= 50) {
      backgroundColor = "#3B82F6"; // Blue - filling
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        fontSize: "12px",
        padding: "2px 4px",
      },
    };
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { capacity, stats } = event.resource;
    const isFull = capacity.percentFull >= 100;

    return (
      <div className="h-full p-1">
        <div className="font-semibold text-xs truncate">{event.title}</div>

        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className={isFull ? "font-bold" : ""}>
              {capacity.booked}/{capacity.max}
            </span>
          </div>

          {stats.hasSpecialRequirements && (
            <AlertCircle className="w-3 h-3 text-yellow-300" />
          )}
        </div>

        {stats.waitlist > 0 && (
          <div className="text-xs mt-1 opacity-75">
            +{stats.waitlist} waiting
          </div>
        )}
      </div>
    );
  };

  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.date = moment(toolbar.date).subtract(1, toolbar.view).toDate();
      toolbar.onNavigate("prev");
    };

    const goToNext = () => {
      toolbar.date = moment(toolbar.date).add(1, toolbar.view).toDate();
      toolbar.onNavigate("next");
    };

    const goToCurrent = () => {
      toolbar.date = new Date();
      toolbar.onNavigate("current");
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-semibold">
          {toolbar.view === "month" && date.format("MMMM YYYY")}
          {toolbar.view === "week" &&
            `Week of ${date.startOf("week").format("MMM D")} - ${date.endOf("week").format("MMM D, YYYY")}`}
          {toolbar.view === "day" && date.format("dddd, MMMM D, YYYY")}
          {toolbar.view === "agenda" &&
            `${date.startOf("month").format("MMM D")} - ${date.endOf("month").format("MMM D, YYYY")}`}
        </span>
      );
    };

    return (
      <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={goToBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToCurrent}
            className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="ml-4">{label()}</div>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(Views).map((view) => (
            <button
              key={view}
              onClick={() => toolbar.onView(view.toLowerCase())}
              className={cn(
                "px-3 py-1 text-sm rounded-lg capitalize",
                toolbar.view === view.toLowerCase()
                  ? "bg-primary-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              {view.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
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
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.courseType}
              onChange={(e) =>
                setFilters({ ...filters, courseType: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Course Types</option>
              <option value="EFAW">Emergency First Aid at Work</option>
              <option value="FAW">First Aid at Work</option>
              <option value="Paediatric">Paediatric First Aid</option>
              <option value="Mental Health">Mental Health First Aid</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Locations</option>
              <option value="Leeds Training Center">
                Leeds Training Center
              </option>
              <option value="Sheffield Venue">Sheffield Venue</option>
              <option value="Bradford Office">Bradford Office</option>
              <option value="Client Site">Client Site</option>
            </select>

            <select
              value={filters.instructor}
              onChange={(e) =>
                setFilters({ ...filters, instructor: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Instructors</option>
              <option value="John Smith">John Smith</option>
              <option value="Sarah Johnson">Sarah Johnson</option>
              <option value="Mike Wilson">Mike Wilson</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() =>
                setFilters({ courseType: "", location: "", instructor: "" })
              }
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Calendar Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>Filling Up</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span>Nearly Full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500"></div>
          <span>Cancelled</span>
        </div>
      </div>

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
              toolbar: CustomToolbar,
              event: EventComponent,
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

// Session Detail Modal Component
const SessionDetailModal: React.FC<{
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ event, onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "details" | "bookings" | "actions"
  >("details");

  const handleCancelSession = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this session? All attendees will be notified.",
      )
    ) {
      return;
    }

    try {
      // API call to cancel session
      showToast("Session cancelled successfully", "success");
      onUpdate();
      onClose();
    } catch (error) {
      showToast("Failed to cancel session", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {event.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {moment(event.start).format("dddd, MMMM D, YYYY")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("details")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "details"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Session Details
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "bookings"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Bookings ({event.resource.stats.bookings})
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "actions"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Time and Location */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Time
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {moment(event.start).format("h:mm A")} -{" "}
                      {moment(event.end).format("h:mm A")}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Location
                  </h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {event.resource.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Capacity
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Capacity
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {event.resource.capacity.max}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Booked
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {event.resource.capacity.booked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Available
                      </span>
                      <span className="font-semibold text-green-600">
                        {event.resource.capacity.available}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          event.resource.capacity.percentFull >= 100
                            ? "bg-red-500"
                            : event.resource.capacity.percentFull >= 75
                              ? "bg-amber-500"
                              : event.resource.capacity.percentFull >= 50
                                ? "bg-blue-500"
                                : "bg-green-500",
                        )}
                        style={{
                          width: `${Math.min(100, event.resource.capacity.percentFull)}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {event.resource.capacity.percentFull.toFixed(0)}% full
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Financial Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Revenue
                    </span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      £{event.resource.stats.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Booking list would be displayed here
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <CalendarIcon className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Edit Session
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Change time, location, or capacity
                  </p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email Attendees
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send message to all confirmed bookings
                  </p>
                </div>
              </button>

              <button
                onClick={handleCancelSession}
                className="w-full flex items-center gap-3 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <AlertCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Cancel Session</p>
                  <p className="text-sm">
                    Notify all attendees and process refunds
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendarPage;
