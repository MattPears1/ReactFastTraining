import { io, Socket } from "socket.io-client";

export interface AvailabilityUpdate {
  sessionId: string;
  totalCapacity: number;
  bookedCount: number;
  availableSpots: number;
  isAvailable: boolean;
  percentageFull: number;
  timestamp: Date;
}

export interface BookingIntent {
  sessionId: string;
  spots: number;
  userId?: string;
  timestamp: Date;
  expiresAt: Date;
}

export type WebSocketEventCallback<T = any> = (data: T) => void;

export class BookingWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private subscribedSessions: Set<string> = new Set();
  private connectionPromise: Promise<void> | null = null;

  constructor(
    private url: string = process.env.REACT_APP_WS_URL ||
      "http://localhost:3000",
    private options: {
      autoConnect?: boolean;
      reconnection?: boolean;
      reconnectionDelay?: number;
      reconnectionAttempts?: number;
    } = {},
  ) {
    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          path: "/ws/booking",
          transports: ["websocket", "polling"],
          reconnection: this.options.reconnection !== false,
          reconnectionDelay:
            this.options.reconnectionDelay || this.reconnectDelay,
          reconnectionAttempts:
            this.options.reconnectionAttempts || this.maxReconnectAttempts,
        });

        this.setupEventHandlers();

        this.socket.once("connected", () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;

          // Re-subscribe to sessions after reconnection
          if (this.subscribedSessions.size > 0) {
            this.subscribeToSessions(Array.from(this.subscribedSessions));
          }

          resolve();
        });

        this.socket.once("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          this.connectionPromise = null;
          reject(error);
        });
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.emit("connection:established", { timestamp: new Date() });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.emit("connection:lost", { reason, timestamp: new Date() });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
      this.emit("connection:reconnected", { attempts: attemptNumber });
    });

    // Availability events
    this.socket.on("availability:update", (data: AvailabilityUpdate) => {
      this.emit("availability:update", data);
      this.emit(`availability:${data.sessionId}`, data);
    });

    this.socket.on("availability:changed", (data: any) => {
      this.emit("availability:changed", data);
    });

    this.socket.on("availability:urgent", (data: any) => {
      this.emit("availability:urgent", data);
    });

    this.socket.on("availability:low", (data: any) => {
      this.emit("availability:low", data);
    });

    this.socket.on("availability:full", (data: any) => {
      this.emit("availability:full", data);
    });

    // Booking intent events
    this.socket.on("booking:intent:active", (data: BookingIntent) => {
      this.emit("booking:intent:active", data);
    });

    this.socket.on("booking:intent:cancelled", (data: any) => {
      this.emit("booking:intent:cancelled", data);
    });

    // Subscription events
    this.socket.on("subscribed:session", (data: any) => {
      this.subscribedSessions.add(data.sessionId);
      this.emit("subscription:confirmed", data);
    });

    this.socket.on("unsubscribed:session", (data: any) => {
      this.subscribedSessions.delete(data.sessionId);
      this.emit("subscription:removed", data);
    });

    // Error handling
    this.socket.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      this.emit("error", error);
    });
  }

  async subscribeToSession(sessionId: string): Promise<void> {
    await this.ensureConnected();

    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Subscription timeout"));
      }, 5000);

      this.socket!.once("subscribed:session", (data) => {
        if (data.sessionId === sessionId) {
          clearTimeout(timeout);
          resolve();
        }
      });

      this.socket!.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket!.emit("subscribe:session", { sessionId });
    });
  }

  async unsubscribeFromSession(sessionId: string): Promise<void> {
    await this.ensureConnected();

    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit("unsubscribe:session", { sessionId });
    this.subscribedSessions.delete(sessionId);
  }

  async subscribeToSessions(sessionIds: string[]): Promise<void> {
    await this.ensureConnected();

    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Subscription timeout"));
      }, 10000);

      this.socket!.once("subscribed:sessions", (data) => {
        clearTimeout(timeout);
        sessionIds.forEach((id) => this.subscribedSessions.add(id));
        resolve();
      });

      this.socket!.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket!.emit("subscribe:sessions", { sessionIds });
    });
  }

  async getAvailability(sessionId: string): Promise<AvailabilityUpdate> {
    await this.ensureConnected();

    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Availability request timeout"));
      }, 5000);

      this.socket!.once(
        `availability:${sessionId}`,
        (data: AvailabilityUpdate) => {
          clearTimeout(timeout);
          resolve(data);
        },
      );

      this.socket!.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket!.emit("get:availability", { sessionId });
    });
  }

  sendBookingIntent(sessionId: string, spots: number): void {
    if (!this.socket || !this.socket.connected) {
      console.warn("Cannot send booking intent - WebSocket not connected");
      return;
    }

    this.socket.emit("booking:intent", { sessionId, spots });
  }

  cancelBookingIntent(sessionId: string, spots: number): void {
    if (!this.socket || !this.socket.connected) {
      console.warn("Cannot cancel booking intent - WebSocket not connected");
      return;
    }

    this.socket.emit("booking:cancel-intent", { sessionId, spots });
  }

  on<T = any>(event: string, callback: WebSocketEventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  off(event: string, callback?: WebSocketEventCallback): void {
    if (!callback) {
      this.eventListeners.delete(event);
    } else {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.subscribedSessions.clear();
      this.eventListeners.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSubscribedSessions(): string[] {
    return Array.from(this.subscribedSessions);
  }
}

// Singleton instance
let instance: BookingWebSocketClient | null = null;

export function getBookingWebSocketClient(): BookingWebSocketClient {
  if (!instance) {
    instance = new BookingWebSocketClient();
  }
  return instance;
}

export function disconnectBookingWebSocket(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
