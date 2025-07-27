import {bind, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  AttendanceRepository,
  CourseSessionRepository,
  BookingRepository,
} from '../../repositories';
import {Attendance, AttendanceStatus, SessionStatus} from '../../models';
import {HttpErrors} from '@loopback/rest';

export interface AttendanceRecord {
  bookingId: string;
  userId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceStats {
  courseType: string;
  totalSessions: number;
  totalAttendees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  partialCount: number;
  attendanceRate: number;
}

@bind({scope: BindingScope.SINGLETON})
export class AttendanceService {
  constructor(
    @repository(AttendanceRepository)
    private attendanceRepository: AttendanceRepository,
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {}

  /**
   * Mark attendance for a session
   */
  async markAttendance(
    sessionId: string,
    attendanceRecords: AttendanceRecord[],
    markedBy: string
  ): Promise<Attendance[]> {
    // Verify session exists and is completed or in progress
    const session = await this.courseSessionRepository.findById(sessionId);
    
    if (!session) {
      throw new HttpErrors.NotFound('Session not found');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new HttpErrors.BadRequest('Cannot mark attendance for cancelled session');
    }

    // Validate all bookings belong to this session
    const bookingIds = attendanceRecords.map(r => r.bookingId);
    const validBookings = await this.bookingRepository.find({
      where: {
        id: {inq: bookingIds},
        sessionId: sessionId,
      },
    });

    if (validBookings.length !== bookingIds.length) {
      throw new HttpErrors.BadRequest('Some booking IDs are invalid for this session');
    }

    // Check for existing attendance records
    const existingAttendance = await this.attendanceRepository.find({
      where: {
        sessionId: sessionId,
        bookingId: {inq: bookingIds},
      },
    });

    // Create or update attendance records
    const attendancePromises = attendanceRecords.map(async (record) => {
      const existing = existingAttendance.find(a => a.bookingId === record.bookingId);

      if (existing) {
        // Update existing record
        await this.attendanceRepository.updateById(existing.id, {
          status: record.status,
          notes: record.notes,
          markedBy,
          markedAt: new Date(),
        });
        return this.attendanceRepository.findById(existing.id);
      } else {
        // Create new record
        return this.attendanceRepository.create({
          bookingId: record.bookingId,
          sessionId,
          userId: record.userId,
          status: record.status,
          notes: record.notes,
          markedBy,
          markedAt: new Date(),
        });
      }
    });

    const attendanceResults = await Promise.all(attendancePromises);

    // Update session status to completed if not already
    if (session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.CONFIRMED) {
      await this.courseSessionRepository.updateById(sessionId, {
        status: SessionStatus.COMPLETED,
        updatedAt: new Date(),
      });
    }

    // Check certificate eligibility for attendees marked as present
    await this.checkCertificateEligibility(sessionId, attendanceRecords);

    return attendanceResults;
  }

  /**
   * Get attendance for a session
   */
  async getSessionAttendance(sessionId: string): Promise<any[]> {
    const attendance = await this.attendanceRepository.find({
      where: {sessionId},
      include: [
        {relation: 'booking', scope: {include: [{relation: 'user'}]}},
      ],
    });

    return attendance.map(record => ({
      attendanceId: record.id,
      bookingId: record.bookingId,
      userId: record.userId,
      userName: record.booking?.user?.name || 'Unknown',
      userEmail: record.booking?.user?.email || '',
      status: record.status,
      notes: record.notes,
      markedBy: record.markedBy,
      markedAt: record.markedAt,
    }));
  }

  /**
   * Generate attendance report
   */
  async generateAttendanceReport(filters: {
    startDate: Date;
    endDate: Date;
    courseType?: string;
    trainerId?: string;
  }): Promise<AttendanceStats[]> {
    // Get sessions within date range
    const sessionWhere: any = {
      startDate: {gte: filters.startDate},
      endDate: {lte: filters.endDate},
      status: SessionStatus.COMPLETED,
    };

    if (filters.trainerId) {
      sessionWhere.trainerId = filters.trainerId;
    }

    const sessions = await this.courseSessionRepository.find({
      where: sessionWhere,
      include: [{relation: 'course'}],
    });

    // Group by course type
    const statsByType: Map<string, AttendanceStats> = new Map();

    for (const session of sessions) {
      const courseType = session.course?.name || 'Unknown';
      
      if (filters.courseType && courseType !== filters.courseType) {
        continue;
      }

      // Get attendance for this session
      const attendance = await this.attendanceRepository.find({
        where: {sessionId: session.id},
      });

      // Initialize stats for this course type if not exists
      if (!statsByType.has(courseType)) {
        statsByType.set(courseType, {
          courseType,
          totalSessions: 0,
          totalAttendees: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          partialCount: 0,
          attendanceRate: 0,
        });
      }

      const stats = statsByType.get(courseType)!;
      stats.totalSessions++;
      stats.totalAttendees += attendance.length;

      // Count by status
      attendance.forEach(record => {
        switch (record.status) {
          case AttendanceStatus.PRESENT:
            stats.presentCount++;
            break;
          case AttendanceStatus.ABSENT:
            stats.absentCount++;
            break;
          case AttendanceStatus.LATE:
            stats.lateCount++;
            break;
          case AttendanceStatus.PARTIAL:
            stats.partialCount++;
            break;
        }
      });
    }

    // Calculate attendance rates
    const results = Array.from(statsByType.values());
    results.forEach(stats => {
      if (stats.totalAttendees > 0) {
        stats.attendanceRate = Math.round(
          ((stats.presentCount + stats.lateCount + stats.partialCount) / stats.totalAttendees) * 100
        );
      }
    });

    return results;
  }

  /**
   * Get attendance history for a user
   */
  async getUserAttendanceHistory(userId: string): Promise<any[]> {
    const attendance = await this.attendanceRepository.find({
      where: {userId},
      include: [
        {
          relation: 'session',
          scope: {
            include: [{relation: 'course'}],
          },
        },
      ],
      order: ['createdAt DESC'],
    });

    return attendance.map(record => ({
      sessionDate: record.session?.startDate,
      courseName: record.session?.course?.name,
      status: record.status,
      markedAt: record.markedAt,
      certificateEligible: record.status === AttendanceStatus.PRESENT,
    }));
  }

  /**
   * Check certificate eligibility
   */
  private async checkCertificateEligibility(
    sessionId: string,
    attendanceRecords: AttendanceRecord[]
  ): Promise<void> {
    // Get users marked as present
    const presentUsers = attendanceRecords
      .filter(r => r.status === AttendanceStatus.PRESENT)
      .map(r => r.userId);

    if (presentUsers.length === 0) return;

    // TODO: Implement certificate generation logic
    // This would typically:
    // 1. Check if all required sessions for a course are completed
    // 2. Generate certificate if eligible
    // 3. Send certificate via email
    console.log(`Checking certificate eligibility for ${presentUsers.length} attendees`);
  }

  /**
   * Export attendance data as CSV
   */
  async exportAttendanceCSV(sessionId: string): Promise<string> {
    const attendance = await this.getSessionAttendance(sessionId);
    const session = await this.courseSessionRepository.findById(sessionId, {
      include: [{relation: 'course'}],
    });

    // CSV header
    let csv = 'Session Date,Course Name,Attendee Name,Email,Status,Notes,Marked At\n';

    // Add rows
    attendance.forEach(record => {
      csv += `${session.startDate.toISOString().split('T')[0]},`;
      csv += `"${session.course?.name || ''}",`;
      csv += `"${record.userName}",`;
      csv += `"${record.userEmail}",`;
      csv += `${record.status},`;
      csv += `"${record.notes || ''}",`;
      csv += `${record.markedAt?.toISOString() || ''}\n`;
    });

    return csv;
  }
}