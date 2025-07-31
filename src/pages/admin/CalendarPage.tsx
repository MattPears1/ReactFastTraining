import React, { useEffect } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Plus } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";

// Components
import { CalendarFilters } from "./calendar/components/CalendarFilters";
import { EventComponent } from "./calendar/components/EventComponent";
import { CustomToolbar } from "./calendar/components/CustomToolbar";
import { EventDetailsModal } from "./calendar/components/EventDetailsModal";
import { CreateSessionModal } from "./calendar/components/CreateSessionModal";

// Hooks and utilities
import { useCalendarData } from "./calendar/hooks/useCalendarData";
import { getEventStyle, filterEvents } from "./calendar/utils/calendar-utils";
import { CalendarEvent } from "./calendar/types";

// Constants
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

export const AdminCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const {
    events,
    loading,
    view,
    setView,
    date,
    setDate,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    selectedEvent,
    setSelectedEvent,
    showCreateModal,
    setShowCreateModal,
    loadCalendarData,
    handleEventDrop,
  } = useCalendarData();

  // Load data on mount and when view/date changes
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Filter events based on current filters
  const filteredEvents = filterEvents(events, filters);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Training Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your training sessions and schedules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <CalendarFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
          events={events}
        />
      )}

      {/* Calendar */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <DragAndDropCalendar
            localizer={localizer}
            events={filteredEvents}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={setSelectedEvent}
            onEventDrop={handleEventDrop}
            eventPropGetter={getEventStyle}
            components={{
              event: EventComponent,
              toolbar: (props) => (
                <CustomToolbar
                  {...props}
                  onShowFilters={() => setShowFilters(true)}
                  activeFilters={Object.values(filters).filter(Boolean).length}
                />
              ),
            }}
            style={{ height: "100%" }}
            popup
            dragFromOutsideItem={() => null}
            onDropFromOutside={() => null}
            draggableAccessor={() => true}
            resizable={false}
          />
        )}
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={loadCalendarData}
        />
      )}

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCalendarData();
            showToast("Session created successfully", "success");
          }}
        />
      )}
    </div>
  );
};