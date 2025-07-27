import {Socket} from 'socket.io';
import {ws} from '@loopback/websocket';
import {repository} from '@loopback/repository';
import {BookingEnhancedRepository} from '../repositories/enhanced/booking-enhanced.repository';
import {CourseSessionRepository} from '../repositories/course-session.repository';
import {inject} from '@loopback/core';
import {SecurityBindings, UserProfile} from '@loopback/security';

interface RoomSubscription {
  sessionId: string;
  userId?: string;
  subscribedAt: Date;
}

@ws.controller('/availability')
export class BookingWebSocketController {
  private roomSubscriptions: Map<string, RoomSubscription[]> = new Map();
  private userSockets: Map<string, string[]> = new Map();

  constructor(
    @ws.socket() private socket: Socket,
    @repository(BookingEnhancedRepository)
    private bookingRepository: BookingEnhancedRepository,
    @repository(CourseSessionRepository)
    private sessionRepository: CourseSessionRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser?: UserProfile,
  ) {
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    // Handle connection
    this.socket.on('connect', () => {
      console.log(`Client connected: ${this.socket.id}`);
      this.socket.emit('connected', {
        socketId: this.socket.id,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log(`Client disconnected: ${this.socket.id}`);
      this.cleanupSubscriptions(this.socket.id);
    });

    // Subscribe to session availability updates
    this.socket.on('subscribe:session', async (data: {sessionId: string}) => {
      await this.subscribeToSession(data.sessionId);
    });

    // Unsubscribe from session
    this.socket.on('unsubscribe:session', async (data: {sessionId: string}) => {
      await this.unsubscribeFromSession(data.sessionId);
    });

    // Subscribe to multiple sessions
    this.socket.on('subscribe:sessions', async (data: {sessionIds: string[]}) => {
      await this.subscribeToMultipleSessions(data.sessionIds);
    });

    // Get current availability
    this.socket.on('get:availability', async (data: {sessionId: string}) => {
      await this.sendAvailability(data.sessionId);
    });

    // Handle booking creation (for real-time updates)
    this.socket.on('booking:intent', async (data: {sessionId: string; spots: number}) => {
      await this.handleBookingIntent(data.sessionId, data.spots);
    });

    // Handle booking cancellation intent
    this.socket.on('booking:cancel-intent', async (data: {sessionId: string; spots: number}) => {
      await this.handleBookingCancelIntent(data.sessionId, data.spots);
    });
  }

  private async subscribeToSession(sessionId: string): Promise<void> {
    try {
      // Verify session exists
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        this.socket.emit('error', {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        });
        return;
      }

      // Join room for this session
      const roomName = `session:${sessionId}`;
      await this.socket.join(roomName);

      // Track subscription
      const subscription: RoomSubscription = {
        sessionId,
        userId: this.currentUser?.id,
        subscribedAt: new Date(),
      };

      if (!this.roomSubscriptions.has(roomName)) {
        this.roomSubscriptions.set(roomName, []);
      }
      this.roomSubscriptions.get(roomName)!.push(subscription);

      // Send current availability
      await this.sendAvailability(sessionId);

      // Confirm subscription
      this.socket.emit('subscribed:session', {
        sessionId,
        roomName,
        timestamp: new Date(),
      });

      console.log(`Socket ${this.socket.id} subscribed to session ${sessionId}`);
    } catch (error) {
      this.socket.emit('error', {
        code: 'SUBSCRIPTION_FAILED',
        message: error.message,
      });
    }
  }

  private async unsubscribeFromSession(sessionId: string): Promise<void> {
    const roomName = `session:${sessionId}`;
    await this.socket.leave(roomName);

    // Remove from subscriptions
    const subscriptions = this.roomSubscriptions.get(roomName) || [];
    const filtered = subscriptions.filter(sub => 
      sub.sessionId !== sessionId || sub.userId !== this.currentUser?.id
    );
    this.roomSubscriptions.set(roomName, filtered);

    this.socket.emit('unsubscribed:session', {
      sessionId,
      timestamp: new Date(),
    });
  }

  private async subscribeToMultipleSessions(sessionIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      sessionIds.map(id => this.subscribeToSession(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.socket.emit('subscribed:sessions', {
      total: sessionIds.length,
      successful,
      failed,
      timestamp: new Date(),
    });
  }

  private async sendAvailability(sessionId: string): Promise<void> {
    try {
      const availability = await this.bookingRepository.checkSessionAvailability(
        sessionId,
        0 // Just checking current availability
      );

      this.socket.emit('availability:update', {
        sessionId,
        totalCapacity: availability.totalCapacity,
        bookedCount: availability.bookedCount,
        availableSpots: availability.availableSpots,
        isAvailable: availability.isAvailable,
        percentageFull: Math.round((availability.bookedCount / availability.totalCapacity) * 100),
        timestamp: new Date(),
      });
    } catch (error) {
      this.socket.emit('error', {
        code: 'AVAILABILITY_CHECK_FAILED',
        message: error.message,
      });
    }
  }

  private async handleBookingIntent(sessionId: string, spots: number): Promise<void> {
    // Broadcast to all clients in the room that someone is booking
    const roomName = `session:${sessionId}`;
    
    // Emit to all clients except sender
    this.socket.to(roomName).emit('booking:intent:active', {
      sessionId,
      spots,
      userId: this.currentUser?.id,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute intent
    });

    // Check if booking would fill the session
    const availability = await this.bookingRepository.checkSessionAvailability(sessionId, spots);
    
    if (availability.availableSpots - spots <= 3) {
      // Send urgency notification
      this.socket.to(roomName).emit('availability:urgent', {
        sessionId,
        remainingSpots: availability.availableSpots - spots,
        message: 'Limited spots remaining!',
        timestamp: new Date(),
      });
    }
  }

  private async handleBookingCancelIntent(sessionId: string, spots: number): Promise<void> {
    const roomName = `session:${sessionId}`;
    
    this.socket.to(roomName).emit('booking:intent:cancelled', {
      sessionId,
      spots,
      userId: this.currentUser?.id,
      timestamp: new Date(),
    });

    // Refresh availability for all clients
    await this.broadcastAvailability(sessionId);
  }

  async broadcastAvailability(sessionId: string): Promise<void> {
    try {
      const availability = await this.bookingRepository.checkSessionAvailability(sessionId, 0);
      const roomName = `session:${sessionId}`;

      // Emit to all clients in the room
      this.socket.to(roomName).emit('availability:update', {
        sessionId,
        totalCapacity: availability.totalCapacity,
        bookedCount: availability.bookedCount,
        availableSpots: availability.availableSpots,
        isAvailable: availability.isAvailable,
        percentageFull: Math.round((availability.bookedCount / availability.totalCapacity) * 100),
        timestamp: new Date(),
      });

      // Also emit to the sender
      await this.sendAvailability(sessionId);
    } catch (error) {
      console.error('Failed to broadcast availability:', error);
    }
  }

  private cleanupSubscriptions(socketId: string): void {
    // Remove socket from all room subscriptions
    this.roomSubscriptions.forEach((subscriptions, roomName) => {
      const filtered = subscriptions.filter(sub => {
        // This would need to track socket IDs with subscriptions
        return true; // Placeholder
      });
      this.roomSubscriptions.set(roomName, filtered);
    });

    // Clean up user socket mappings
    if (this.currentUser?.id) {
      const userSockets = this.userSockets.get(this.currentUser.id) || [];
      const filtered = userSockets.filter(id => id !== socketId);
      if (filtered.length > 0) {
        this.userSockets.set(this.currentUser.id, filtered);
      } else {
        this.userSockets.delete(this.currentUser.id);
      }
    }
  }

  // Static method to broadcast updates from other parts of the application
  static async notifyAvailabilityChange(
    io: any,
    sessionId: string,
    change: {
      bookedCount: number;
      availableSpots: number;
      action: 'booking_created' | 'booking_cancelled' | 'session_updated';
    }
  ): Promise<void> {
    const roomName = `session:${sessionId}`;
    
    io.to(roomName).emit('availability:changed', {
      sessionId,
      ...change,
      timestamp: new Date(),
    });

    // Special notifications for low availability
    if (change.availableSpots <= 3 && change.availableSpots > 0) {
      io.to(roomName).emit('availability:low', {
        sessionId,
        availableSpots: change.availableSpots,
        message: `Only ${change.availableSpots} spots remaining!`,
        urgency: 'high',
        timestamp: new Date(),
      });
    } else if (change.availableSpots === 0) {
      io.to(roomName).emit('availability:full', {
        sessionId,
        message: 'Session is now fully booked',
        timestamp: new Date(),
      });
    }
  }
}

// WebSocket namespace configuration
export const bookingWebSocketConfig = {
  path: '/ws/booking',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
};