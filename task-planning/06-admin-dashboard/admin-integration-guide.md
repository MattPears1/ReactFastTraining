# Admin Dashboard Integration Guide

## Overview
This guide details how the admin dashboard integrates with other worker systems (authentication, course management, booking system, payment system, and client portal).

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
├─────────────────────────────────────────────────────────────┤
│                    Integration Layer                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Auth   │ │ Courses │ │Bookings │ │Payments │ │ Email  ││
│  │ Service │ │ Service │ │ Service │ │ Service │ │Service ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       │           │           │           │           │      │
├───────┴───────────┴───────────┴───────────┴───────────┴──────┤
│                    Event Bus (Redis Pub/Sub)                 │
├─────────────────────────────────────────────────────────────┤
│                    Shared Database Layer                     │
└─────────────────────────────────────────────────────────────┘
```

## 1. Authentication System Integration

### Admin Authentication Flow
```typescript
// backend-loopback4/src/integration/admin-auth.integration.ts
export class AdminAuthIntegration {
  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private auditService: AuditService
  ) {}

  async authenticateAdmin(credentials: AdminCredentials): Promise<AdminSession> {
    // 1. Validate credentials with auth service
    const authResult = await this.authService.validateCredentials({
      email: credentials.email,
      password: credentials.password,
      userType: 'admin',
    });

    if (!authResult.success) {
      await this.auditService.logFailedLogin({
        email: credentials.email,
        reason: authResult.reason,
        ip: credentials.ip,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. Check admin-specific permissions
    const admin = await this.adminService.getAdminByUserId(authResult.userId);
    
    if (!admin || !admin.isActive) {
      throw new ForbiddenError('Admin access denied');
    }

    // 3. Verify MFA if enabled
    if (admin.mfaEnabled) {
      const mfaValid = await this.authService.verifyMFA(
        admin.id,
        credentials.mfaToken
      );
      
      if (!mfaValid) {
        throw new UnauthorizedError('Invalid MFA token');
      }
    }

    // 4. Create admin session
    const session = await this.adminService.createSession({
      adminId: admin.id,
      permissions: admin.permissions,
      ip: credentials.ip,
      userAgent: credentials.userAgent,
    });

    // 5. Log successful login
    await this.auditService.logAdminAction({
      adminId: admin.id,
      action: 'login',
      metadata: {
        sessionId: session.id,
        ip: credentials.ip,
      },
    });

    return session;
  }

  async refreshAdminToken(refreshToken: string): Promise<TokenPair> {
    // Delegate to auth service with admin context
    const newTokens = await this.authService.refreshToken(refreshToken, {
      tokenType: 'admin',
      includePermissions: true,
    });

    return newTokens;
  }
}
```

### Permission Synchronization
```typescript
// Sync permissions between auth service and admin dashboard
export class PermissionSyncService {
  async syncAdminPermissions(adminId: string) {
    // Get permissions from auth service
    const authPermissions = await this.authService.getUserPermissions(adminId);
    
    // Get admin-specific permissions
    const adminPermissions = await this.adminService.getAdminPermissions(adminId);
    
    // Merge and deduplicate
    const allPermissions = [...new Set([...authPermissions, ...adminPermissions])];
    
    // Update both systems
    await Promise.all([
      this.authService.updateUserPermissions(adminId, allPermissions),
      this.adminService.updateAdminPermissions(adminId, allPermissions),
    ]);
    
    // Invalidate permission cache
    await this.cacheService.invalidate(`permissions:${adminId}`);
  }
}
```

## 2. Course Management Integration

### Course Session Management
```typescript
// Admin can manage all course sessions
export class AdminCourseIntegration {
  constructor(
    private courseService: CourseService,
    private bookingService: BookingService,
    private emailService: EmailService
  ) {}

  async createCourseSession(
    adminId: string,
    sessionData: CreateSessionDto
  ): Promise<CourseSession> {
    // 1. Validate session data
    const validation = await this.courseService.validateSession(sessionData);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // 2. Check for conflicts
    const conflicts = await this.courseService.checkScheduleConflicts({
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      location: sessionData.location,
    });

    if (conflicts.length > 0) {
      throw new ConflictError('Schedule conflict detected', conflicts);
    }

    // 3. Create session
    const session = await this.courseService.createSession({
      ...sessionData,
      createdBy: adminId,
    });

    // 4. Publish event for other systems
    await this.eventBus.publish('session.created', {
      session,
      adminId,
      timestamp: new Date(),
    });

    return session;
  }

  async updateCourseSession(
    adminId: string,
    sessionId: string,
    updates: UpdateSessionDto
  ): Promise<CourseSession> {
    // 1. Get existing session
    const existingSession = await this.courseService.getSession(sessionId);
    
    // 2. Check if rescheduling
    const isRescheduling = 
      updates.date !== existingSession.date ||
      updates.startTime !== existingSession.startTime;

    // 3. Update session
    const updatedSession = await this.courseService.updateSession(
      sessionId,
      updates
    );

    // 4. Handle rescheduling impacts
    if (isRescheduling) {
      await this.handleSessionReschedule(
        adminId,
        existingSession,
        updatedSession
      );
    }

    return updatedSession;
  }

  private async handleSessionReschedule(
    adminId: string,
    oldSession: CourseSession,
    newSession: CourseSession
  ) {
    // 1. Get affected bookings
    const affectedBookings = await this.bookingService.getBookingsBySession(
      oldSession.id
    );

    // 2. Update booking records
    await this.bookingService.updateSessionDetails(
      oldSession.id,
      {
        sessionDate: newSession.date,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
      }
    );

    // 3. Queue notification emails
    for (const booking of affectedBookings) {
      await this.emailService.queueEmail({
        type: 'session_rescheduled',
        to: booking.userEmail,
        data: {
          bookingReference: booking.reference,
          oldDate: oldSession.date,
          newDate: newSession.date,
          oldTime: oldSession.startTime,
          newTime: newSession.startTime,
          courseName: oldSession.courseType,
        },
        priority: 'high',
      });
    }

    // 4. Log admin action
    await this.auditService.logAdminAction({
      adminId,
      action: 'session_rescheduled',
      resource: 'course_session',
      resourceId: oldSession.id,
      previousData: oldSession,
      newData: newSession,
      metadata: {
        affectedBookings: affectedBookings.length,
      },
    });

    // 5. Broadcast update
    await this.eventBus.publish('session.rescheduled', {
      sessionId: oldSession.id,
      affectedBookings: affectedBookings.map(b => b.id),
      changes: {
        date: { old: oldSession.date, new: newSession.date },
        time: { old: oldSession.startTime, new: newSession.startTime },
      },
    });
  }
}
```

## 3. Booking System Integration

### Booking Management
```typescript
export class AdminBookingIntegration {
  async getBookingDetails(
    adminId: string,
    bookingId: string
  ): Promise<BookingAdminView> {
    // 1. Get booking from booking service
    const booking = await this.bookingService.getBooking(bookingId);
    
    // 2. Enhance with admin-specific data
    const [user, session, payments, communications] = await Promise.all([
      this.userService.getUser(booking.userId),
      this.courseService.getSession(booking.sessionId),
      this.paymentService.getPaymentsByBooking(bookingId),
      this.emailService.getCommunicationHistory(booking.userId),
    ]);

    // 3. Check for special requirements
    const specialRequirements = await this.bookingService.getSpecialRequirements(
      bookingId
    );

    // 4. Calculate derived data
    const adminView: BookingAdminView = {
      ...booking,
      user: {
        ...user,
        totalBookings: await this.bookingService.countUserBookings(user.id),
        lifetimeValue: await this.calculateLifetimeValue(user.id),
      },
      session,
      payments,
      communications: communications.slice(0, 5), // Recent 5
      specialRequirements,
      flags: {
        hasRefundRequest: payments.some(p => p.refundRequested),
        isRepeatCustomer: await this.isRepeatCustomer(user.id),
        requiresAttention: this.requiresAdminAttention(booking, payments),
      },
    };

    // 5. Log access
    await this.auditService.logDataAccess({
      adminId,
      resource: 'booking',
      resourceId: bookingId,
      fields: ['user_details', 'payment_history'],
    });

    return adminView;
  }

  async cancelBooking(
    adminId: string,
    bookingId: string,
    reason: string
  ): Promise<void> {
    // 1. Validate booking can be cancelled
    const booking = await this.bookingService.getBooking(bookingId);
    
    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    // 2. Process cancellation
    await this.bookingService.cancelBooking(bookingId, {
      cancelledBy: 'admin',
      cancelledById: adminId,
      reason,
    });

    // 3. Process refund if applicable
    if (booking.paymentStatus === 'paid') {
      await this.paymentService.initiateRefund({
        bookingId,
        amount: booking.totalAmount,
        reason: `Admin cancellation: ${reason}`,
        initiatedBy: adminId,
      });
    }

    // 4. Send notification
    await this.emailService.sendCancellationEmail(booking);

    // 5. Update session capacity
    await this.courseService.updateSessionCapacity(
      booking.sessionId,
      booking.attendeeCount
    );

    // 6. Broadcast event
    await this.eventBus.publish('booking.cancelled', {
      bookingId,
      adminId,
      reason,
      refundInitiated: booking.paymentStatus === 'paid',
    });
  }

  async bulkUpdateBookings(
    adminId: string,
    bookingIds: string[],
    operation: BulkOperation
  ): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      successful: [],
      failed: [],
      total: bookingIds.length,
    };

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < bookingIds.length; i += batchSize) {
      const batch = bookingIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (bookingId) => {
          try {
            switch (operation.type) {
              case 'cancel':
                await this.cancelBooking(adminId, bookingId, operation.reason);
                break;
              case 'reschedule':
                await this.rescheduleBooking(
                  adminId,
                  bookingId,
                  operation.newSessionId
                );
                break;
              case 'email':
                await this.sendBookingEmail(
                  adminId,
                  bookingId,
                  operation.emailTemplate
                );
                break;
            }
            results.successful.push(bookingId);
          } catch (error) {
            results.failed.push({
              bookingId,
              error: error.message,
            });
          }
        })
      );

      // Update progress
      await this.broadcastProgress({
        adminId,
        operation: operation.type,
        progress: Math.round(((i + batch.length) / bookingIds.length) * 100),
      });
    }

    return results;
  }
}
```

## 4. Payment System Integration

### Payment Management
```typescript
export class AdminPaymentIntegration {
  async getPaymentDashboard(
    dateRange: DateRange
  ): Promise<PaymentDashboard> {
    // 1. Get payment statistics
    const stats = await this.paymentService.getStatistics(dateRange);
    
    // 2. Get pending refunds
    const pendingRefunds = await this.paymentService.getPendingRefunds();
    
    // 3. Get failed payments
    const failedPayments = await this.paymentService.getFailedPayments({
      dateFrom: dateRange.start,
      dateTo: dateRange.end,
    });

    // 4. Calculate revenue breakdown
    const revenueBreakdown = await this.calculateRevenueBreakdown(dateRange);

    return {
      summary: {
        totalRevenue: stats.totalRevenue,
        refundedAmount: stats.refundedAmount,
        netRevenue: stats.totalRevenue - stats.refundedAmount,
        transactionCount: stats.transactionCount,
        averageTransactionValue: stats.totalRevenue / stats.transactionCount,
      },
      pendingRefunds: {
        count: pendingRefunds.length,
        totalAmount: pendingRefunds.reduce((sum, r) => sum + r.amount, 0),
        items: pendingRefunds.slice(0, 10), // Top 10
      },
      failedPayments: {
        count: failedPayments.length,
        reasons: this.groupFailureReasons(failedPayments),
      },
      revenueBreakdown,
      chartData: await this.getRevenueChartData(dateRange),
    };
  }

  async processRefund(
    adminId: string,
    refundRequest: RefundRequest
  ): Promise<RefundResult> {
    // 1. Validate refund request
    const booking = await this.bookingService.getBooking(refundRequest.bookingId);
    const payment = await this.paymentService.getPayment(refundRequest.paymentId);

    if (payment.bookingId !== booking.id) {
      throw new Error('Payment does not match booking');
    }

    // 2. Check refund eligibility
    const eligibility = await this.checkRefundEligibility(booking, payment);
    
    if (!eligibility.eligible) {
      throw new Error(`Refund not eligible: ${eligibility.reason}`);
    }

    // 3. Process refund
    const refund = await this.paymentService.processRefund({
      paymentId: payment.id,
      amount: refundRequest.amount || payment.amount,
      reason: refundRequest.reason,
      processedBy: adminId,
    });

    // 4. Update booking status
    if (refund.amount === payment.amount) {
      await this.bookingService.updateBookingStatus(
        booking.id,
        'refunded'
      );
    } else {
      await this.bookingService.addBookingNote(
        booking.id,
        `Partial refund processed: £${refund.amount}`
      );
    }

    // 5. Send confirmation
    await this.emailService.sendRefundConfirmation({
      booking,
      refund,
      recipient: booking.userEmail,
    });

    // 6. Log action
    await this.auditService.logAdminAction({
      adminId,
      action: 'refund_processed',
      resource: 'payment',
      resourceId: payment.id,
      metadata: {
        amount: refund.amount,
        reason: refundRequest.reason,
      },
    });

    return refund;
  }

  async reconcilePayments(
    adminId: string,
    dateRange: DateRange
  ): Promise<ReconciliationReport> {
    // 1. Get all transactions from payment provider
    const providerTransactions = await this.paymentProvider.getTransactions(
      dateRange
    );

    // 2. Get all internal payment records
    const internalPayments = await this.paymentService.getPayments(dateRange);

    // 3. Match and identify discrepancies
    const matched = [];
    const unmatched = {
      provider: [],
      internal: [],
    };

    // Matching logic
    const internalMap = new Map(
      internalPayments.map(p => [p.providerTransactionId, p])
    );

    for (const providerTx of providerTransactions) {
      const internal = internalMap.get(providerTx.id);
      
      if (internal) {
        matched.push({
          provider: providerTx,
          internal,
          discrepancies: this.findDiscrepancies(providerTx, internal),
        });
        internalMap.delete(providerTx.id);
      } else {
        unmatched.provider.push(providerTx);
      }
    }

    // Remaining internal records are unmatched
    unmatched.internal = Array.from(internalMap.values());

    // 4. Generate report
    const report: ReconciliationReport = {
      period: dateRange,
      summary: {
        totalProvider: providerTransactions.reduce((sum, t) => sum + t.amount, 0),
        totalInternal: internalPayments.reduce((sum, p) => sum + p.amount, 0),
        matched: matched.length,
        unmatchedProvider: unmatched.provider.length,
        unmatchedInternal: unmatched.internal.length,
      },
      matched,
      unmatched,
      recommendations: this.generateReconciliationRecommendations(
        matched,
        unmatched
      ),
    };

    // 5. Save report
    await this.saveReconciliationReport(adminId, report);

    return report;
  }
}
```

## 5. Email Service Integration

### Communication Management
```typescript
export class AdminEmailIntegration {
  async sendBulkEmail(
    adminId: string,
    campaign: BulkEmailCampaign
  ): Promise<EmailCampaignResult> {
    // 1. Validate campaign
    if (!campaign.recipients || campaign.recipients.length === 0) {
      throw new Error('No recipients specified');
    }

    // 2. Check permissions
    const hasPermission = await this.permissionService.check(
      adminId,
      'clients:email:bulk'
    );
    
    if (!hasPermission) {
      throw new ForbiddenError('No permission for bulk emails');
    }

    // 3. Prepare email batch
    const emailBatch = await this.prepareEmailBatch(campaign);

    // 4. Send emails
    const results = await this.emailService.sendBatch(emailBatch, {
      trackOpens: true,
      trackClicks: true,
      batchSize: 50, // Send in batches of 50
      delayBetweenBatches: 1000, // 1 second delay
    });

    // 5. Save campaign record
    const campaignRecord = await this.saveCampaignRecord({
      adminId,
      campaign,
      results,
    });

    // 6. Log action
    await this.auditService.logAdminAction({
      adminId,
      action: 'bulk_email_sent',
      resource: 'email_campaign',
      resourceId: campaignRecord.id,
      metadata: {
        recipientCount: campaign.recipients.length,
        template: campaign.templateId,
      },
    });

    return results;
  }

  async getEmailAnalytics(
    campaignId: string
  ): Promise<EmailAnalytics> {
    const campaign = await this.emailService.getCampaign(campaignId);
    const events = await this.emailService.getCampaignEvents(campaignId);

    const analytics: EmailAnalytics = {
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        sentAt: campaign.sentAt,
        recipientCount: campaign.recipientCount,
      },
      metrics: {
        sent: events.filter(e => e.type === 'sent').length,
        delivered: events.filter(e => e.type === 'delivered').length,
        opened: events.filter(e => e.type === 'opened').length,
        clicked: events.filter(e => e.type === 'clicked').length,
        bounced: events.filter(e => e.type === 'bounced').length,
        unsubscribed: events.filter(e => e.type === 'unsubscribed').length,
      },
      rates: {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
      },
      timeline: this.generateEventTimeline(events),
      topLinks: this.getTopClickedLinks(events),
    };

    // Calculate rates
    if (analytics.metrics.sent > 0) {
      analytics.rates.deliveryRate = 
        (analytics.metrics.delivered / analytics.metrics.sent) * 100;
      analytics.rates.openRate = 
        (analytics.metrics.opened / analytics.metrics.delivered) * 100;
      analytics.rates.clickRate = 
        (analytics.metrics.clicked / analytics.metrics.opened) * 100;
      analytics.rates.bounceRate = 
        (analytics.metrics.bounced / analytics.metrics.sent) * 100;
    }

    return analytics;
  }
}
```

## 6. Real-time Event Synchronization

### Event Bus Implementation
```typescript
export class AdminEventBus {
  private redis: Redis;
  private subscribers: Map<string, Set<EventHandler>> = new Map();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Subscribe to all relevant channels
    const channels = [
      'bookings:*',
      'sessions:*',
      'payments:*',
      'users:*',
    ];

    channels.forEach(pattern => {
      this.redis.psubscribe(pattern);
    });

    this.redis.on('pmessage', (pattern, channel, message) => {
      this.handleMessage(channel, JSON.parse(message));
    });
  }

  private handleMessage(channel: string, message: any) {
    const handlers = this.subscribers.get(channel) || new Set();
    
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in event handler for ${channel}:`, error);
      }
    });
  }

  subscribe(channel: string, handler: EventHandler) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(handler);
    
    return () => {
      this.subscribers.get(channel)?.delete(handler);
    };
  }

  async publish(channel: string, data: any) {
    await this.redis.publish(channel, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      source: 'admin-dashboard',
    }));
  }
}

// WebSocket handler for real-time updates
export class AdminWebSocketHandler {
  constructor(
    private eventBus: AdminEventBus,
    private wsService: WebSocketService
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Booking events
    this.eventBus.subscribe('bookings:created', (data) => {
      this.wsService.broadcastToAdmins('booking:created', data);
    });

    this.eventBus.subscribe('bookings:updated', (data) => {
      this.wsService.broadcastToAdmins('booking:updated', data);
    });

    this.eventBus.subscribe('bookings:cancelled', (data) => {
      this.wsService.broadcastToAdmins('booking:cancelled', data);
    });

    // Session events
    this.eventBus.subscribe('sessions:rescheduled', (data) => {
      this.wsService.broadcastToAdmins('session:rescheduled', data);
    });

    // Payment events
    this.eventBus.subscribe('payments:received', (data) => {
      this.wsService.broadcastToAdmins('payment:received', data);
    });

    this.eventBus.subscribe('payments:refunded', (data) => {
      this.wsService.broadcastToAdmins('payment:refunded', data);
    });

    // Dashboard metrics update
    setInterval(async () => {
      const metrics = await this.dashboardService.getCurrentMetrics();
      this.wsService.broadcastToAdmins('metrics:update', metrics);
    }, 30000); // Every 30 seconds
  }
}
```

## 7. Data Consistency and Transactions

### Cross-Service Transactions
```typescript
export class AdminTransactionManager {
  async executeTransaction<T>(
    operation: () => Promise<T>,
    rollback: () => Promise<void>
  ): Promise<T> {
    const transactionId = generateId();
    
    try {
      // Start distributed transaction
      await this.startDistributedTransaction(transactionId);
      
      // Execute operation
      const result = await operation();
      
      // Commit transaction
      await this.commitDistributedTransaction(transactionId);
      
      return result;
    } catch (error) {
      // Rollback on error
      await this.rollbackDistributedTransaction(transactionId);
      await rollback();
      
      throw error;
    }
  }

  // Example: Complex booking modification
  async modifyBookingWithRefund(
    adminId: string,
    bookingId: string,
    modifications: BookingModification
  ) {
    return this.executeTransaction(
      async () => {
        // 1. Update booking
        const updatedBooking = await this.bookingService.updateBooking(
          bookingId,
          modifications
        );

        // 2. Process partial refund if needed
        if (modifications.refundAmount) {
          await this.paymentService.processPartialRefund({
            bookingId,
            amount: modifications.refundAmount,
            reason: modifications.refundReason,
          });
        }

        // 3. Update session capacity
        if (modifications.attendeeCountChange) {
          await this.courseService.adjustSessionCapacity(
            updatedBooking.sessionId,
            modifications.attendeeCountChange
          );
        }

        // 4. Send notifications
        await this.emailService.sendBookingModificationEmail(updatedBooking);

        // 5. Log action
        await this.auditService.logAdminAction({
          adminId,
          action: 'booking_modified',
          resource: 'booking',
          resourceId: bookingId,
          changes: modifications,
        });

        return updatedBooking;
      },
      async () => {
        // Rollback logic
        console.error(`Rolling back booking modification for ${bookingId}`);
      }
    );
  }
}
```

## 8. Performance Considerations

### Caching Strategy
```typescript
export class AdminCacheManager {
  private redis: Redis;
  private memoryCache: Map<string, CacheEntry> = new Map();

  // Multi-layer caching
  async get<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    // 1. Check memory cache
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expires > Date.now()) {
      return memCached.value as T;
    }

    // 2. Check Redis cache
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      const value = JSON.parse(redisCached);
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + (ttl || 60) * 1000,
      });
      return value;
    }

    // 3. Generate fresh data
    const freshData = await factory();

    // 4. Cache in both layers
    await this.redis.setex(key, ttl || 60, JSON.stringify(freshData));
    this.memoryCache.set(key, {
      value: freshData,
      expires: Date.now() + (ttl || 60) * 1000,
    });

    return freshData;
  }

  // Invalidation across services
  async invalidate(pattern: string) {
    // Clear local memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Notify other services
    await this.eventBus.publish('cache:invalidate', { pattern });
  }
}
```

## Integration Testing

### End-to-End Test Example
```typescript
describe('Admin Dashboard Integration', () => {
  let adminId: string;
  let sessionId: string;
  let bookingId: string;

  beforeEach(async () => {
    // Setup test admin
    adminId = await createTestAdmin({ role: 'admin' });
    
    // Create test session
    sessionId = await createTestSession({
      courseType: 'EFAW',
      date: addDays(new Date(), 7),
      maxCapacity: 12,
    });
    
    // Create test booking
    bookingId = await createTestBooking({
      sessionId,
      attendeeCount: 2,
      status: 'confirmed',
    });
  });

  it('should handle session rescheduling with all integrations', async () => {
    // 1. Admin reschedules session
    const newDate = addDays(new Date(), 14);
    const response = await adminApi.rescheduleSession(sessionId, {
      date: newDate,
      reason: 'Instructor unavailable',
    });

    expect(response.status).toBe(200);

    // 2. Verify booking was updated
    const updatedBooking = await bookingService.getBooking(bookingId);
    expect(updatedBooking.sessionDate).toEqual(newDate);

    // 3. Verify email was sent
    const emails = await emailService.getSentEmails();
    expect(emails).toContainEqual(
      expect.objectContaining({
        type: 'session_rescheduled',
        to: updatedBooking.userEmail,
      })
    );

    // 4. Verify audit log
    const auditLogs = await auditService.getRecentLogs();
    expect(auditLogs).toContainEqual(
      expect.objectContaining({
        adminId,
        action: 'session_rescheduled',
        resourceId: sessionId,
      })
    );

    // 5. Verify real-time update was broadcast
    const wsMessages = await wsTestClient.getMessages();
    expect(wsMessages).toContainEqual(
      expect.objectContaining({
        type: 'session:rescheduled',
        data: expect.objectContaining({
          sessionId,
          affectedBookings: [bookingId],
        }),
      })
    );
  });
});
```

## Deployment Considerations

### Service Dependencies
```yaml
# docker-compose.yml
version: '3.8'

services:
  admin-dashboard:
    build: ./admin-dashboard
    environment:
      - AUTH_SERVICE_URL=http://auth-service:3000
      - BOOKING_SERVICE_URL=http://booking-service:3001
      - COURSE_SERVICE_URL=http://course-service:3002
      - PAYMENT_SERVICE_URL=http://payment-service:3003
      - EMAIL_SERVICE_URL=http://email-service:3004
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@db:5432/reactfast
    depends_on:
      - auth-service
      - booking-service
      - course-service
      - payment-service
      - email-service
      - redis
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Health Checks
```typescript
export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAuthService(),
      this.checkBookingService(),
      this.checkCourseService(),
      this.checkPaymentService(),
      this.checkEmailService(),
    ]);

    const services = [
      'database',
      'redis',
      'auth',
      'booking',
      'course',
      'payment',
      'email',
    ];

    const status = checks.reduce((acc, check, index) => {
      acc[services[index]] = check.status === 'fulfilled' ? 'healthy' : 'unhealthy';
      return acc;
    }, {} as Record<string, string>);

    const allHealthy = checks.every(c => c.status === 'fulfilled');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services: status,
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Conclusion

This integration architecture ensures:
1. **Loose Coupling**: Services communicate through well-defined interfaces
2. **Data Consistency**: Distributed transactions and event sourcing
3. **Performance**: Multi-layer caching and optimized queries
4. **Reliability**: Health checks and circuit breakers
5. **Security**: Authentication and authorization at every integration point
6. **Observability**: Comprehensive logging and monitoring

The admin dashboard acts as an orchestrator, coordinating between services while maintaining clear boundaries and responsibilities.