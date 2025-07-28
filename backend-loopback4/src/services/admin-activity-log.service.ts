export interface ActivityLogData {
  userId?: number;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminActivityLogService {
  async log(data: ActivityLogData): Promise<void> {
    // For now, log to console - in production, save to database
    console.log('[Activity]', {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    // Return mock data for now - replace with database query
    return [
      {
        id: 1,
        action: 'New booking',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        details: 'Booked Emergency First Aid at Work'
      },
      {
        id: 2,
        action: 'Payment received',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        details: '£75 payment for EFAW course'
      },
      {
        id: 3,
        action: 'User login',
        user: 'lex@reactfasttraining.co.uk',
        timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        details: 'Admin portal login'
      },
      {
        id: 4,
        action: 'Session updated',
        user: 'Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        details: 'Updated Leeds session capacity'
      },
      {
        id: 5,
        action: 'New booking',
        user: 'Emma Wilson',
        timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        details: 'Booked Paediatric First Aid'
      }
    ].slice(0, limit);
  }

  private formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      'booking.created': 'New booking',
      'booking.cancelled': 'Booking cancelled',
      'booking.updated': 'Booking updated',
      'user.login': 'User login',
      'user.created': 'New user registered',
      'session.created': 'Session created',
      'session.updated': 'Session updated',
      'payment.completed': 'Payment received',
      'refund.processed': 'Refund processed',
    };
    return actionMap[action] || action;
  }

  private formatDetails(activity: any): string {
    switch (activity.action) {
      case 'booking.created':
        return `Booked ${activity.details?.courseName || 'course'}`;
      case 'payment.completed':
        return `£${activity.details?.amount || 0} payment`;
      case 'session.created':
        return `Created ${activity.details?.courseName || 'session'}`;
      default:
        return activity.resourceType || '';
    }
  }
}

export const adminActivityLogService = new AdminActivityLogService();