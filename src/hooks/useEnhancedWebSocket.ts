import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  timeout?: number;
  enableFallback?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  reconnectAttempt: number;
  latency: number;
}

interface QueuedMessage {
  event: string;
  data: any;
  timestamp: number;
  retries: number;
}

const MAX_QUEUE_SIZE = 100;
const MAX_MESSAGE_RETRIES = 3;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_BACKOFF_FACTOR = 1.5;

export const useEnhancedWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || "http://localhost:3000",
    autoConnect = true,
    reconnectAttempts = 10,
    reconnectDelay = 1000,
    reconnectDelayMax = 30000,
    timeout = 20000,
    enableFallback = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentReconnectDelay = useRef(reconnectDelay);

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempt: 0,
    latency: 0,
  });

  // Heartbeat mechanism to detect connection issues early
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const startTime = Date.now();
        socketRef.current.emit("ping", { timestamp: startTime });

        const pongHandler = (data: { timestamp: number }) => {
          const latency = Date.now() - data.timestamp;
          setConnectionState((prev) => ({ ...prev, latency }));
          socketRef.current?.off("pong", pongHandler);
        };

        socketRef.current.once("pong", pongHandler);

        // Timeout for pong response
        setTimeout(() => {
          socketRef.current?.off("pong", pongHandler);
        }, 5000);
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Process queued messages when reconnected
  const processMessageQueue = useCallback(() => {
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];

    queue.forEach(({ event, data, retries }) => {
      if (retries < MAX_MESSAGE_RETRIES) {
        emit(event, data);
      }
    });
  }, []);

  // Enhanced emit with queuing for offline messages
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      // Queue message if not connected
      if (messageQueueRef.current.length < MAX_QUEUE_SIZE) {
        messageQueueRef.current.push({
          event,
          data,
          timestamp: Date.now(),
          retries: 0,
        });
      } else {
        console.warn("Message queue full, dropping message:", event);
      }
    }
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setConnectionState((prev) => ({ ...prev, isConnecting: true }));
      socketRef.current.connect();
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    setConnectionState((prev) => ({ ...prev, isConnecting: true }));

    // Create socket with enhanced options
    socketRef.current = io(url, {
      transports: enableFallback ? ["websocket", "polling"] : ["websocket"],
      reconnection: true,
      reconnectionAttempts,
      reconnectionDelay,
      reconnectionDelayMax,
      timeout,
      autoConnect: true,
      query: {
        clientVersion: "1.0.0",
        timestamp: Date.now(),
      },
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
        latency: 0,
      });
      currentReconnectDelay.current = reconnectDelay;
      startHeartbeat();
      processMessageQueue();
      onConnect?.();
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: reason === "io server disconnect" ? false : true,
      }));
      stopHeartbeat();
      onDisconnect?.(reason);

      // Handle server-initiated disconnect differently
      if (reason === "io server disconnect") {
        // Manual reconnection needed
        reconnectTimerRef.current = setTimeout(() => {
          reconnect();
        }, currentReconnectDelay.current);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setConnectionState((prev) => ({
        ...prev,
        error: error,
        reconnectAttempt: prev.reconnectAttempt + 1,
      }));
      onError?.(error);

      // Exponential backoff for reconnection
      currentReconnectDelay.current = Math.min(
        currentReconnectDelay.current * RECONNECT_BACKOFF_FACTOR,
        reconnectDelayMax,
      );
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
      setConnectionState((prev) => ({
        ...prev,
        reconnectAttempt: 0,
      }));
    });

    socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      setConnectionState((prev) => ({
        ...prev,
        isConnecting: false,
        error: new Error("Failed to reconnect after maximum attempts"),
      }));
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
      stopHeartbeat();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    url,
    autoConnect,
    reconnectAttempts,
    reconnectDelay,
    reconnectDelayMax,
    timeout,
    enableFallback,
    onConnect,
    onDisconnect,
    onError,
    startHeartbeat,
    stopHeartbeat,
    processMessageQueue,
    reconnect,
  ]);

  const subscribe = useCallback((event: string, handler: Function) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    // Join room on server if connected
    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe", event);
    }

    // Return unsubscribe function
    return () => {
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          listenersRef.current.delete(event);
          if (socketRef.current?.connected) {
            socketRef.current.emit("unsubscribe", event);
          }
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
        if (socketRef.current?.connected) {
          socketRef.current.emit("unsubscribe", event);
        }
      }
    }
  }, []);

  // Request-response pattern with timeout
  const request = useCallback(
    <T = any>(event: string, data?: any, timeoutMs = 5000): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        const requestId = `${event}-${Date.now()}-${Math.random()}`;
        const timeoutId = setTimeout(() => {
          socketRef.current?.off(`${event}:response:${requestId}`);
          reject(new Error(`Request timeout for ${event}`));
        }, timeoutMs);

        socketRef.current.once(
          `${event}:response:${requestId}`,
          (response: T) => {
            clearTimeout(timeoutId);
            resolve(response);
          },
        );

        socketRef.current.emit(event, { ...data, requestId });
      });
    },
    [],
  );

  return {
    subscribe,
    unsubscribe,
    emit,
    request,
    reconnect,
    connectionState,
    socket: socketRef.current,
  };
};

// Re-export event types from original hook
export type {
  SessionUpdateEvent,
  SessionCreatedEvent,
  SessionCancelledEvent,
  BookingConfirmedEvent,
} from "./useWebSocket";
