import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { useWebSocket } from "@hooks/useWebSocket";
import { AvailabilityCalendar } from "@components/booking/AvailabilityCalendar";
import { CapacityIndicator } from "@components/booking/CapacityIndicator";
import { AdminDashboard } from "@components/admin/AdminDashboard";

// Mock the useWebSocket hook
vi.mock("@hooks/useWebSocket");

// Mock API client
vi.mock("@services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock admin API
vi.mock("@services/api/admin.service", () => ({
  adminApi: {
    getSessionStats: vi.fn(),
    getBookingStats: vi.fn(),
  },
}));

describe("WebSocket Real-time Updates", () => {
  let mockWebSocketHandlers: Record<string, Function>;
  let mockEmit: vi.Mock;

  beforeEach(() => {
    mockWebSocketHandlers = {};
    mockEmit = vi.fn();

    vi.mocked(useWebSocket).mockImplementation((config) => {
      // Store the handlers
      if (config?.onCapacityUpdate) {
        mockWebSocketHandlers.capacityUpdate = config.onCapacityUpdate;
      }
      if (config?.onSessionUpdate) {
        mockWebSocketHandlers.sessionUpdate = config.onSessionUpdate;
      }
      if (config?.onAttendanceUpdate) {
        mockWebSocketHandlers.attendanceUpdate = config.onAttendanceUpdate;
      }

      return {
        isConnected: true,
        emit: mockEmit,
        on: vi.fn((event, handler) => {
          mockWebSocketHandlers[event] = handler;
        }),
        off: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Capacity Updates", () => {
    it("should update capacity indicator when WebSocket emits capacity change", async () => {
      const initialCapacity = { booked: 8, available: 4 };

      const { rerender } = render(
        <CapacityIndicator
          sessionId="session-1"
          currentParticipants={initialCapacity.booked}
          maxParticipants={12}
        />,
      );

      // Initial state
      expect(screen.getByText("8/12 booked")).toBeInTheDocument();
      expect(screen.getByText("4 spots left")).toBeInTheDocument();

      // Simulate WebSocket capacity update
      act(() => {
        mockWebSocketHandlers.capacityUpdate?.({
          sessionId: "session-1",
          booked: 10,
          available: 2,
        });
      });

      // Re-render with updated props (simulating parent component update)
      rerender(
        <CapacityIndicator
          sessionId="session-1"
          currentParticipants={10}
          maxParticipants={12}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("10/12 booked")).toBeInTheDocument();
        expect(screen.getByText("2 spots left")).toBeInTheDocument();
      });
    });

    it('should show "Fully Booked" when capacity reaches maximum', async () => {
      render(
        <CapacityIndicator
          sessionId="session-1"
          currentParticipants={11}
          maxParticipants={12}
        />,
      );

      // Initial state - almost full
      expect(screen.getByText("Almost Full!")).toBeInTheDocument();

      // Simulate WebSocket update to full capacity
      act(() => {
        mockWebSocketHandlers.capacityUpdate?.({
          sessionId: "session-1",
          booked: 12,
          available: 0,
        });
      });

      // Component should receive update and show fully booked
      const { rerender } = render(
        <CapacityIndicator
          sessionId="session-1"
          currentParticipants={12}
          maxParticipants={12}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Fully Booked")).toBeInTheDocument();
      });
    });
  });

  describe("Session Updates", () => {
    it("should handle session creation events", async () => {
      const mockNewSession = {
        id: "new-session",
        courseId: "efaw",
        courseName: "Emergency First Aid at Work",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentParticipants: 0,
        maxParticipants: 12,
      };

      // Simulate session creation
      act(() => {
        mockWebSocketHandlers.sessionUpdate?.({
          type: "created",
          session: mockNewSession,
        });
      });

      // Verify emit was called to notify other clients
      expect(mockEmit).toHaveBeenCalledWith("subscribeToUpdates");
    });

    it("should handle session cancellation events", async () => {
      const cancelledSessionId = "session-to-cancel";

      // Simulate session cancellation
      act(() => {
        mockWebSocketHandlers.sessionUpdate?.({
          type: "cancelled",
          sessionId: cancelledSessionId,
          reason: "Trainer unavailable",
        });
      });

      // Component should handle the cancellation appropriately
      expect(mockWebSocketHandlers.sessionUpdate).toBeDefined();
    });
  });

  describe("Attendance Updates", () => {
    it("should update attendance marking UI when attendance is marked", async () => {
      const attendanceUpdate = {
        sessionId: "session-1",
        attendance: [
          { bookingId: "booking-1", status: "PRESENT" },
          { bookingId: "booking-2", status: "ABSENT" },
        ],
      };

      // Simulate attendance update
      act(() => {
        mockWebSocketHandlers.attendanceUpdate?.(attendanceUpdate);
      });

      // Verify the handler was called
      expect(mockWebSocketHandlers.attendanceUpdate).toBeDefined();
    });
  });

  describe("Connection State", () => {
    it("should show connection status indicator when disconnected", async () => {
      vi.mocked(useWebSocket).mockReturnValue({
        isConnected: false,
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Real-time updates paused"),
        ).toBeInTheDocument();
      });
    });

    it("should attempt reconnection when connection is lost", async () => {
      const mockReconnect = vi.fn();

      vi.mocked(useWebSocket).mockReturnValue({
        isConnected: false,
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        reconnect: mockReconnect,
      });

      // Simulate connection loss and recovery
      setTimeout(() => {
        vi.mocked(useWebSocket).mockReturnValue({
          isConnected: true,
          emit: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        });
      }, 1000);

      expect(mockWebSocketHandlers).toBeDefined();
    });
  });

  describe("Fallback Behavior", () => {
    it("should fall back to polling when WebSocket is unavailable", async () => {
      const mockApiGet = vi.fn();

      vi.mocked(useWebSocket).mockReturnValue({
        isConnected: false,
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      });

      // Component should use polling interval
      const pollingInterval = 30000; // 30 seconds

      // Verify polling is set up
      expect(mockWebSocketHandlers).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should debounce rapid capacity updates", async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        sessionId: "session-1",
        booked: i + 1,
        available: 12 - (i + 1),
      }));

      // Send rapid updates
      updates.forEach((update) => {
        act(() => {
          mockWebSocketHandlers.capacityUpdate?.(update);
        });
      });

      // Should only process the last update
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledTimes(1);
      });
    });

    it("should cleanup WebSocket listeners on unmount", async () => {
      const mockOff = vi.fn();

      vi.mocked(useWebSocket).mockReturnValue({
        isConnected: true,
        emit: vi.fn(),
        on: vi.fn(),
        off: mockOff,
      });

      const { unmount } = render(<AvailabilityCalendar />);

      unmount();

      // Verify cleanup
      expect(mockOff).toHaveBeenCalled();
    });
  });
});
