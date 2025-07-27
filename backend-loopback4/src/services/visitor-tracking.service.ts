import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CourseRepository} from '../repositories';
import {v4 as uuidv4} from 'uuid';

export interface VisitorSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  pagesViewed: string[];
  journeyStages: {
    visitedHomepage: boolean;
    visitedCoursesPage: boolean;
    visitedBookingPage: boolean;
    startedBooking: boolean;
    completedBooking: boolean;
    cancelledBooking: boolean;
  };
}

@injectable({scope: BindingScope.REQUEST})
export class VisitorTrackingService {
  private sessionId: string;
  private session: VisitorSession;

  constructor(
    @repository(CourseRepository)
    private courseRepository: CourseRepository,
  ) {
    // Initialize session
    this.sessionId = this.generateSessionId();
    this.session = this.createNewSession();
  }

  private generateSessionId(): string {
    return uuidv4();
  }

  private createNewSession(): VisitorSession {
    return {
      sessionId: this.sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      pagesViewed: [],
      journeyStages: {
        visitedHomepage: false,
        visitedCoursesPage: false,
        visitedBookingPage: false,
        startedBooking: false,
        completedBooking: false,
        cancelledBooking: false,
      }
    };
  }

  async trackPageView(page: string, userAgent?: string): Promise<void> {
    // Check if tracking is allowed (GDPR compliance)
    if (!this.isTrackingAllowed(userAgent)) {
      return;
    }

    // Update session
    this.session.lastActivity = new Date();
    this.session.pagesViewed.push(page);

    // Update journey stages
    switch (page) {
      case '/':
      case '/home':
        this.session.journeyStages.visitedHomepage = true;
        break;
      case '/courses':
      case '/products':
        this.session.journeyStages.visitedCoursesPage = true;
        break;
      case '/booking':
        this.session.journeyStages.visitedBookingPage = true;
        break;
    }

    // Save to database (anonymized)
    await this.saveVisitorData();
  }

  async trackBookingEvent(event: 'started' | 'completed' | 'cancelled'): Promise<void> {
    switch (event) {
      case 'started':
        this.session.journeyStages.startedBooking = true;
        break;
      case 'completed':
        this.session.journeyStages.completedBooking = true;
        break;
      case 'cancelled':
        this.session.journeyStages.cancelledBooking = true;
        break;
    }

    await this.saveVisitorData();
  }

  private isTrackingAllowed(userAgent?: string): boolean {
    // Check for Do Not Track header
    if (userAgent && userAgent.includes('DNT=1')) {
      return false;
    }

    // Check if user has opted out (would check cookie/localStorage in real implementation)
    // For now, assume tracking is allowed
    return true;
  }

  private async saveVisitorData(): Promise<void> {
    const now = new Date();
    const deviceType = this.detectDeviceType();
    
    const query = `
      INSERT INTO visitor_analytics (
        session_id, date, hour,
        visited_homepage, visited_courses_page, visited_booking_page,
        started_booking, completed_booking, cancelled_booking,
        pages_viewed, time_on_site_seconds, device_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (session_id, date, hour) 
      DO UPDATE SET
        visited_homepage = EXCLUDED.visited_homepage,
        visited_courses_page = EXCLUDED.visited_courses_page,
        visited_booking_page = EXCLUDED.visited_booking_page,
        started_booking = EXCLUDED.started_booking,
        completed_booking = EXCLUDED.completed_booking,
        cancelled_booking = EXCLUDED.cancelled_booking,
        pages_viewed = EXCLUDED.pages_viewed,
        time_on_site_seconds = EXCLUDED.time_on_site_seconds
    `;

    const timeOnSite = Math.floor((now.getTime() - this.session.startTime.getTime()) / 1000);

    const params = [
      this.sessionId,
      now.toISOString().split('T')[0], // date only
      now.getHours(),
      this.session.journeyStages.visitedHomepage,
      this.session.journeyStages.visitedCoursesPage,
      this.session.journeyStages.visitedBookingPage,
      this.session.journeyStages.startedBooking,
      this.session.journeyStages.completedBooking,
      this.session.journeyStages.cancelledBooking,
      this.session.pagesViewed.length,
      timeOnSite,
      deviceType
    ];

    try {
      await this.courseRepository.dataSource.execute(query, params);
    } catch (error) {
      // Log error but don't throw - tracking should not break the application
      console.error('Visitor tracking error:', error);
    }
  }

  private detectDeviceType(): string {
    // In a real implementation, this would parse the user agent
    // For now, return a default
    return 'desktop';
  }

  async getSessionId(): Promise<string> {
    return this.sessionId;
  }

  static async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    // GDPR compliance - remove old visitor data
    const query = `
      DELETE FROM visitor_analytics 
      WHERE date < CURRENT_DATE - INTERVAL '${daysToKeep} days'
    `;
    
    // This would be called by a scheduled job
    // await this.courseRepository.dataSource.execute(query);
  }
}