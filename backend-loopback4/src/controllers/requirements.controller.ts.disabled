import { get, post, del, patch, requestBody, param, HttpErrors } from '@loopback/rest';
import { authenticate, authorize } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { SecurityBindings, UserProfile } from '@loopback/security';
import { SpecialRequirementsService } from '../services/special-requirements.service';
import { BookingService } from '../services/booking/booking.service';

interface SaveRequirementsRequest {
  items: Array<{
    category: string;
    requirementType: string;
    details: string;
  }>;
}

interface UpdateRequirementRequest {
  details?: string;
  priority?: string;
  instructorNotified?: boolean;
}

export class RequirementsController {
  constructor() {}

  @get('/api/requirements/templates')
  async getTemplates() {
    return await SpecialRequirementsService.getTemplates();
  }

  @post('/api/bookings/{bookingId}/requirements')
  @authenticate('jwt')
  async saveRequirements(
    @param.path.string('bookingId') bookingId: string,
    @requestBody() requirements: SaveRequirementsRequest,
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    // Verify user owns this booking
    const booking = await BookingService.getBookingWithDetails(bookingId);
    if (booking.userId !== user.id) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    await SpecialRequirementsService.saveRequirements(
      bookingId,
      requirements.items
    );

    return { success: true };
  }

  @get('/api/bookings/{bookingId}/requirements')
  @authenticate('jwt')
  async getBookingRequirements(
    @param.path.string('bookingId') bookingId: string,
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    // Verify user owns this booking or is admin
    const booking = await BookingService.getBookingWithDetails(bookingId);
    if (booking.userId !== user.id && !user.roles?.includes('admin')) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    return await SpecialRequirementsService.getBookingRequirements(bookingId);
  }

  @get('/api/admin/sessions/{sessionId}/requirements')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin', 'instructor'],
  })
  async getSessionRequirements(
    @param.path.string('sessionId') sessionId: string
  ) {
    return await SpecialRequirementsService.getSessionRequirements(sessionId);
  }

  @get('/api/admin/sessions/{sessionId}/requirements-report')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin', 'instructor'],
  })
  async getSessionRequirementsReport(
    @param.path.string('sessionId') sessionId: string
  ) {
    return await SpecialRequirementsService.generateSessionRequirementsReport(sessionId);
  }

  @patch('/api/admin/requirements/{requirementId}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
  })
  async updateRequirement(
    @param.path.string('requirementId') requirementId: string,
    @requestBody() updates: UpdateRequirementRequest
  ) {
    await SpecialRequirementsService.updateRequirement(requirementId, updates);
    return { success: true };
  }

  @del('/api/admin/requirements/{requirementId}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
  })
  async deleteRequirement(
    @param.path.string('requirementId') requirementId: string
  ) {
    await SpecialRequirementsService.deleteRequirement(requirementId);
    return { success: true };
  }

  @post('/api/admin/sessions/{sessionId}/notify-requirements')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
  })
  async notifyInstructorAboutRequirements(
    @param.path.string('sessionId') sessionId: string
  ) {
    // Get all critical/high requirements for the session
    const requirements = await SpecialRequirementsService.getSessionRequirements(sessionId);
    const criticalAndHigh = [...requirements.critical, ...requirements.high];

    if (criticalAndHigh.length === 0) {
      throw new HttpErrors.BadRequest('No critical or high priority requirements to notify');
    }

    // Send notification emails
    for (const req of criticalAndHigh) {
      await SpecialRequirementsService['notifyInstructor'](
        req.booking.id,
        [req.requirement]
      );
    }

    return {
      success: true,
      notifiedCount: criticalAndHigh.length,
    };
  }
}