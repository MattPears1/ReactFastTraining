import {bind, BindingScope} from '@loopback/core';
import {Server as HttpServer} from 'http';
import {Server as SocketIOServer, Socket} from 'socket.io';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

@bind({scope: BindingScope.SINGLETON})
export class WebSocketService {
  private io: SocketIOServer | null = null;
  private clients: Map<string, Socket> = new Map();

  /**
   * Initialize WebSocket server
   */
  async initialize(httpServer: HttpServer): Promise<void> {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);
      this.clients.set(socket.id, socket);

      // Handle client events
      socket.on('subscribe', (event: string) => {
        socket.join(event);
        console.log(`Client ${socket.id} subscribed to ${event}`);
      });

      socket.on('unsubscribe', (event: string) => {
        socket.leave(event);
        console.log(`Client ${socket.id} unsubscribed from ${event}`);
      });

      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Send message to specific room
   */
  sendToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(room).emit(event, data);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Emit session capacity update
   */
  emitCapacityUpdate(sessionId: string, currentBookings: number, availableSpots: number): void {
    const updateData = {
      type: 'session-update',
      sessionId,
      currentBookings,
      availableSpots,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients
    this.broadcast('session-update', updateData);
    
    // Also send to session-specific room
    this.sendToRoom(`session:${sessionId}`, 'session-update', updateData);
  }

  /**
   * Emit session creation event
   */
  emitSessionCreated(session: any): void {
    this.broadcast('session-created', {
      type: 'session-created',
      session,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit session cancellation event
   */
  emitSessionCancelled(sessionId: string, reason?: string): void {
    this.broadcast('session-cancelled', {
      type: 'session-cancelled',
      sessionId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit booking confirmation event
   */
  emitBookingConfirmed(sessionId: string, bookingId: string): void {
    this.broadcast('booking-confirmed', {
      type: 'booking-confirmed',
      sessionId,
      bookingId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    if (this.io) {
      await this.io.close();
      this.io = null;
      this.clients.clear();
      console.log('WebSocket server shut down');
    }
  }
}

// Create a singleton instance for easy access
export const websocketService = new WebSocketService();