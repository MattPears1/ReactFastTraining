import { db } from '../config/database.config';
import { specialRequirements, requirementTemplates, bookings, bookingAttendees } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { BookingService } from './booking/booking.service';
import { EmailService } from './email.service';

interface RequirementTemplate {
  id: string;
  category: string;
  requirementType: string;
  displayName: string;
  description?: string;
  requiresDetails: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface RequirementWithBooking {
  requirement: {
    id: string;
    category: string;
    requirementType: string;
    details: string;
    priority: string;
    instructorNotified: boolean;
  };
  booking: {
    id: string;
    bookingReference: string;
  };
  attendee: {
    name: string;
    email: string;
  };
}

export class SpecialRequirementsService {
  static async getTemplates() {
    const templates = await db
      .select()
      .from(requirementTemplates)
      .where(eq(requirementTemplates.isActive, true))
      .orderBy(requirementTemplates.category, requirementTemplates.sortOrder);

    // Group by category
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, RequirementTemplate[]>);
  }

  static async saveRequirements(
    bookingId: string,
    requirements: Array<{
      category: string;
      requirementType: string;
      details: string;
    }>
  ) {
    if (requirements.length === 0) return;

    // Determine priority based on type
    const priorityMap: Record<string, string> = {
      'wheelchair': 'high',
      'medication': 'critical',
      'allergy': 'high',
      'hearing': 'high',
      'visual': 'high',
      'mobility': 'high',
      'pregnancy': 'high',
      'condition': 'critical',
    };

    const requirementsWithPriority = requirements.map(req => ({
      ...req,
      bookingId,
      priority: priorityMap[req.requirementType] || 'standard',
    }));

    await db.insert(specialRequirements).values(requirementsWithPriority);

    // Check if any critical requirements need immediate notification
    const criticalRequirements = requirementsWithPriority.filter(
      r => r.priority === 'critical' || r.priority === 'high'
    );

    if (criticalRequirements.length > 0) {
      await this.notifyInstructor(bookingId, criticalRequirements);
    }
  }

  static async getBookingRequirements(bookingId: string) {
    return await db
      .select()
      .from(specialRequirements)
      .where(eq(specialRequirements.bookingId, bookingId))
      .orderBy(desc(specialRequirements.priority));
  }

  static async getSessionRequirements(sessionId: string) {
    // Get all bookings for the session with their requirements
    const results = await db
      .select({
        requirement: specialRequirements,
        booking: bookings,
        attendee: bookingAttendees,
      })
      .from(specialRequirements)
      .innerJoin(bookings, eq(specialRequirements.bookingId, bookings.id))
      .innerJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          eq(bookings.sessionId, sessionId),
          eq(bookingAttendees.isPrimary, true)
        )
      )
      .orderBy(desc(specialRequirements.priority));

    // Group by priority
    return {
      critical: results.filter(r => r.requirement.priority === 'critical'),
      high: results.filter(r => r.requirement.priority === 'high'),
      standard: results.filter(r => r.requirement.priority === 'standard'),
    };
  }

  private static async notifyInstructor(
    bookingId: string,
    criticalRequirements: any[]
  ) {
    // Get booking details
    const booking = await BookingService.getBookingWithDetails(bookingId);
    
    // Send immediate email notification
    await this.sendCriticalRequirementsNotification(booking, criticalRequirements);

    // Mark as notified
    await db
      .update(specialRequirements)
      .set({ instructorNotified: true })
      .where(
        and(
          eq(specialRequirements.bookingId, bookingId),
          inArray(specialRequirements.priority, ['critical', 'high'])
        )
      );
  }

  private static async sendCriticalRequirementsNotification(
    booking: any,
    criticalRequirements: any[]
  ) {
    const requirementsList = criticalRequirements.map(req => {
      const priorityEmoji = req.priority === 'critical' ? '🚨' : '⚠️';
      return `
        <li style="margin-bottom: 10px;">
          <strong>${priorityEmoji} ${req.category.toUpperCase()} - ${req.requirementType}:</strong><br>
          ${req.details}
        </li>
      `;
    }).join('');

    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/admin/sessions/${booking.sessionId}/requirements`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .alert-box { border: 3px solid #DC2626; padding: 20px; margin-bottom: 20px; }
        .alert-box h2 { color: #DC2626; margin-top: 0; }
        .details-box { background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert-box">
            <h2>URGENT: Critical Requirements for Upcoming Session</h2>
            <p>A booking has been made with critical special requirements that need your immediate attention.</p>
            
            <div class="details-box">
                <h3>Session Details:</h3>
                <ul>
                    <li>Course: ${booking.courseDetails.courseType}</li>
                    <li>Date: ${booking.courseDetails.sessionDate}</li>
                    <li>Time: ${booking.courseDetails.startTime} - ${booking.courseDetails.endTime}</li>
                    <li>Location: ${booking.courseDetails.location}</li>
                    <li>Booking Reference: ${booking.bookingReference}</li>
                </ul>
            </div>
            
            <h3>Critical Requirements:</h3>
            <ul style="list-style: none; padding: 0;">
                ${requirementsList}
            </ul>
            
            <p style="margin-top: 20px;">
                <a href="${dashboardUrl}" class="button">
                    View Full Details in Dashboard
                </a>
            </p>
            
            <p style="margin-top: 20px; font-weight: bold;">
                Please ensure all necessary accommodations are in place before the session.
            </p>
        </div>
    </div>
</body>
</html>`;

    await EmailService.prototype.sendEmail({
      to: process.env.INSTRUCTOR_EMAIL || 'instructor@reactfasttraining.co.uk',
      subject: 'URGENT: Critical Requirements for Upcoming Session',
      html,
    });
  }

  static async updateRequirement(
    requirementId: string,
    updates: {
      details?: string;
      priority?: string;
      instructorNotified?: boolean;
    }
  ) {
    await db
      .update(specialRequirements)
      .set(updates)
      .where(eq(specialRequirements.id, requirementId));
  }

  static async deleteRequirement(requirementId: string) {
    await db
      .delete(specialRequirements)
      .where(eq(specialRequirements.id, requirementId));
  }

  // Generate a summary report for a session
  static async generateSessionRequirementsReport(sessionId: string) {
    const requirements = await this.getSessionRequirements(sessionId);
    
    const summary = {
      totalRequirements: requirements.critical.length + requirements.high.length + requirements.standard.length,
      criticalCount: requirements.critical.length,
      highCount: requirements.high.length,
      standardCount: requirements.standard.length,
      accessibilityNeeds: this.countByCategory(requirements, 'accessibility'),
      dietaryNeeds: this.countByCategory(requirements, 'dietary'),
      medicalNeeds: this.countByCategory(requirements, 'medical'),
      otherNeeds: this.countByCategory(requirements, 'other'),
    };

    return {
      summary,
      details: requirements,
    };
  }

  private static countByCategory(
    requirements: { critical: any[], high: any[], standard: any[] },
    category: string
  ): number {
    const allRequirements = [
      ...requirements.critical,
      ...requirements.high,
      ...requirements.standard,
    ];
    
    return allRequirements.filter(r => r.requirement.category === category).length;
  }
}