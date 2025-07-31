import { useState, useCallback } from "react";
import { Views } from "react-big-calendar";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { CalendarEvent, FilterState } from "../types";
import { getRange } from "../utils/calendar-utils";

export const useCalendarData = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({
    courseType: "",
    location: "",
    instructor: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const range = getRange(date, view);
      
      // Mock data for now - replace with actual API call
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Emergency First Aid at Work",
          start: new Date(2025, 0, 29, 9, 0),
          end: new Date(2025, 0, 29, 16, 0),
          resource: {
            sessionId: "S001",
            courseType: "EFAW",
            location: "Leeds Training Center",
            instructor: "John Smith",
            capacity: {
              max: 12,
              booked: 8,
              available: 4,
              percentFull: 67,
              status: "filling",
            },
            stats: {
              bookings: 8,
              revenue: 600,
              waitlist: 0,
              hasSpecialRequirements: false,
            },
            status: "scheduled",
          },
        },
        // Add more mock events as needed
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    try {
      // Update event times
      const updatedEvent = {
        ...event,
        start,
        end,
      };

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? updatedEvent : e))
      );

      // API call would go here
      console.log("Event rescheduled:", updatedEvent);
    } catch (error) {
      console.error("Failed to reschedule event:", error);
    }
  }, []);

  return {
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
  };
};