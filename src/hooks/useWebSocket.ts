import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || "http://localhost:3000",
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    // Create socket connection
    socketRef.current = io(url, {
      transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // Handle incoming messages
    socket.onAny((eventName, ...args) => {
      const handlers = listenersRef.current.get(eventName);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(...args);
          } catch (error) {
            console.error(
              `Error in WebSocket handler for ${eventName}:`,
              error,
            );
          }
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, autoConnect]);

  const subscribe = useCallback((event: string, handler: Function) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    // Join room on server
    socketRef.current?.emit("subscribe", event);

    // Return unsubscribe function
    return () => {
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          listenersRef.current.delete(event);
          socketRef.current?.emit("unsubscribe", event);
        }
      }
    };
  }, []);

  const unsubscribe = useCallback((event: string, handler: Function) => {
    const handlers = listenersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        listenersRef.current.delete(event);
        socketRef.current?.emit("unsubscribe", event);
      }
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("WebSocket not connected, cannot emit event:", event);
    }
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  return {
    subscribe,
    unsubscribe,
    emit,
    isConnected,
    socket: socketRef.current,
  };
};

// Export specific event types for type safety
export type SessionUpdateEvent = {
  type: "session-update";
  sessionId: string;
  currentBookings: number;
  availableSpots: number;
  timestamp: string;
};

export type SessionCreatedEvent = {
  type: "session-created";
  session: any;
  timestamp: string;
};

export type SessionCancelledEvent = {
  type: "session-cancelled";
  sessionId: string;
  reason?: string;
  timestamp: string;
};

export type BookingConfirmedEvent = {
  type: "booking-confirmed";
  sessionId: string;
  bookingId: string;
  timestamp: string;
};
