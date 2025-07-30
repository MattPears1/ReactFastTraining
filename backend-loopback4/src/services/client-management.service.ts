import { injectable, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { 
  UserRepository,
  BookingRepository,
  CourseSessionRepository,
  SpecialRequirementRepository,
  AdminNoteRepository,
  EmailLogRepository
} from '../repositories';

interface ClientListItem {
  user: any;
  stats: {
    bookingCount: number;
    totalSpend: number;
    lastBookingDate: Date | null;
    completedCourses: number;
    upcomingBookings: number;
  };
}

interface ClientDetails {
  client: any;
  stats: {
    totalBookings: number;
    totalSpent: number;
    totalAttendees: number;
    completedCourses: number;
    cancelledBookings: number;
  };
  recentBookings: any[];
  specialRequirements: any[];
  communications: any[];
  notes: any[];
}

@injectable()
export class ClientManagementService {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(BookingRepository)
    protected bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    protected courseSessionRepository: CourseSessionRepository,
    @repository(SpecialRequirementRepository)
    protected specialRequirementRepository: SpecialRequirementRepository,
    @repository(AdminNoteRepository)
    protected adminNoteRepository: AdminNoteRepository,
    @repository(EmailLogRepository)
    protected emailLogRepository: EmailLogRepository,
  ) {}

  async getClientList(
    filters?: {
      search?: string;
      hasBookings?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      minSpend?: number;
    },
    sort?: {
      field: 'name' | 'created' | 'lastBooking' | 'totalSpend' | 'bookingCount';
      direction: 'asc' | 'desc';
    },
    pagination?: {
      limit: number;
      offset: number;
    }
  ): Promise<{ clients: ClientListItem[]; total: number }> {
    const { limit = 25, offset = 0 } = pagination || {};

    // Build user query
    let whereConditions: any = {};
    
    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) {
        whereConditions.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereConditions.createdAt.lte = filters.dateTo;
      }
    }

    // Get users with basic filters
    let users = await this.userRepository.find({
      where: whereConditions,
      limit: filters?.search ? undefined : limit, // Don't limit if searching
      skip: filters?.search ? undefined : offset,
      include: [
        {
          relation: 'bookings',
          scope: {
            include: ['session', 'attendees']
          }
        }
      ]
    });

    // Apply search filter if provided
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats for each user
    const clientsWithStats: ClientListItem[] = users.map(user => {
      const bookings = user.bookings || [];
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
      
      const totalSpend = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const lastBooking = confirmedBookings.length > 0
        ? confirmedBookings.reduce((latest, b) => 
            b.createdAt! > latest.createdAt! ? b : latest
          )
        : null;
      
      const completedCourses = confirmedBookings.filter(b => 
        b.session && new Date(b.session.sessionDate) < new Date()
      ).length;
      
      const upcomingBookings = confirmedBookings.filter(b => 
        b.session && new Date(b.session.sessionDate) >= new Date()
      ).length;

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        stats: {
          bookingCount: confirmedBookings.length,
          totalSpend,
          lastBookingDate: lastBooking?.createdAt || null,
          completedCourses,
          upcomingBookings
        }
      };
    });

    // Apply additional filters
    let filteredClients = clientsWithStats;
    
    if (filters?.hasBookings !== undefined) {
      filteredClients = filteredClients.filter(client => 
        filters.hasBookings ? client.stats.bookingCount > 0 : client.stats.bookingCount === 0
      );
    }
    
    if (filters?.minSpend) {
      filteredClients = filteredClients.filter(client => 
        client.stats.totalSpend >= filters.minSpend
      );
    }

    // Sort
    if (sort) {
      filteredClients.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sort.field) {
          case 'name':
            aVal = a.user.name || '';
            bVal = b.user.name || '';
            break;
          case 'created':
            aVal = a.user.createdAt;
            bVal = b.user.createdAt;
            break;
          case 'lastBooking':
            aVal = a.stats.lastBookingDate || new Date(0);
            bVal = b.stats.lastBookingDate || new Date(0);
            break;
          case 'totalSpend':
            aVal = a.stats.totalSpend;
            bVal = b.stats.totalSpend;
            break;
          case 'bookingCount':
            aVal = a.stats.bookingCount;
            bVal = b.stats.bookingCount;
            break;
        }
        
        if (sort.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply pagination after filtering
    const paginatedClients = filters?.search 
      ? filteredClients.slice(offset, offset + limit)
      : filteredClients;

    return {
      clients: paginatedClients,
      total: filteredClients.length
    };
  }

  async getClientDetails(userId: string): Promise<ClientDetails> {
    // Get user
    const client = await this.userRepository.findById(userId);

    // Get all bookings
    const bookings = await this.bookingRepository.find({
      where: { userId },
      include: ['session', 'attendees', 'payment']
    });

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    // Calculate stats
    const totalAttendees = confirmedBookings.reduce((sum, b) => 
      sum + (b.attendees?.length || 0), 0
    );
    
    const completedCourses = confirmedBookings.filter(b => 
      b.session && new Date(b.session.sessionDate) < new Date()
    ).length;

    const stats = {
      totalBookings: bookings.length,
      totalSpent: confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalAttendees,
      completedCourses,
      cancelledBookings: cancelledBookings.length
    };

    // Get recent bookings
    const recentBookings = bookings
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, 10)
      .map(booking => ({
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          status: booking.status,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt
        },
        session: booking.session,
        attendeeCount: booking.attendees?.length || 0
      }));

    // Get special requirements
    const bookingIds = bookings.map(b => b.id!);
    const specialRequirements = bookingIds.length > 0
      ? await this.specialRequirementRepository.find({
          where: { bookingId: { inq: bookingIds } },
          order: ['createdAt DESC']
        })
      : [];

    // Get communication history
    const communications = await this.emailLogRepository.find({
      where: { recipientId: userId },
      order: ['sentAt DESC'],
      limit: 20
    });

    // Get admin notes
    const notes = await this.adminNoteRepository.find({
      where: { userId },
      order: ['createdAt DESC'],
      include: ['createdByUser']
    });

    return {
      client,
      stats,
      recentBookings,
      specialRequirements,
      communications,
      notes: notes.map(note => ({
        id: note.id,
        note: note.note,
        createdAt: note.createdAt,
        createdByName: note.createdByUser?.name || 'Unknown'
      }))
    };
  }

  async addAdminNote(userId: string, note: string, adminId: string): Promise<any> {
    const newNote = await this.adminNoteRepository.create({
      userId,
      note,
      createdBy: adminId,
      createdAt: new Date()
    });

    return newNote;
  }

  async exportClientData(userId: string): Promise<{
    filename: string;
    data: string;
    contentType: string;
  }> {
    const details = await this.getClientDetails(userId);
    
    // Format as CSV
    const sections = [];

    // Client Information
    sections.push('CLIENT INFORMATION');
    sections.push(`Name,${details.client.name}`);
    sections.push(`Email,${details.client.email}`);
    sections.push(`Joined,${new Date(details.client.createdAt).toLocaleDateString()}`);
    sections.push('');

    // Statistics
    sections.push('STATISTICS');
    sections.push(`Total Bookings,${details.stats.totalBookings}`);
    sections.push(`Total Spent,£${details.stats.totalSpent.toFixed(2)}`);
    sections.push(`Total Attendees,${details.stats.totalAttendees}`);
    sections.push(`Completed Courses,${details.stats.completedCourses}`);
    sections.push(`Cancelled Bookings,${details.stats.cancelledBookings}`);
    sections.push('');

    // Booking History
    sections.push('BOOKING HISTORY');
    sections.push('Reference,Course,Date,Attendees,Amount,Status');
    details.recentBookings.forEach(({ booking, session, attendeeCount }) => {
      sections.push([
        booking.bookingReference,
        session?.courseType || 'Unknown',
        session ? new Date(session.sessionDate).toLocaleDateString() : '',
        attendeeCount,
        `£${booking.totalAmount.toFixed(2)}`,
        booking.status
      ].join(','));
    });
    sections.push('');

    // Special Requirements
    if (details.specialRequirements.length > 0) {
      sections.push('SPECIAL REQUIREMENTS');
      sections.push('Type,Details,Date');
      details.specialRequirements.forEach(req => {
        sections.push([
          req.requirementType,
          `"${req.details || ''}"`,
          new Date(req.createdAt).toLocaleDateString()
        ].join(','));
      });
      sections.push('');
    }

    // Admin Notes
    if (details.notes.length > 0) {
      sections.push('ADMIN NOTES');
      sections.push('Date,Note,Added By');
      details.notes.forEach(note => {
        sections.push([
          new Date(note.createdAt).toLocaleDateString(),
          `"${note.note}"`,
          note.createdByName
        ].join(','));
      });
    }

    const csvData = sections.join('\n');
    const filename = `client-${userId}-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      filename,
      data: csvData,
      contentType: 'text/csv'
    };
  }

  async exportAllClients(filters?: any): Promise<{
    filename: string;
    data: string;
    contentType: string;
  }> {
    const { clients } = await this.getClientList(filters, undefined, { limit: 10000, offset: 0 });
    
    const headers = [
      'Name',
      'Email',
      'Joined Date',
      'Total Bookings',
      'Total Spent',
      'Last Booking',
      'Completed Courses',
      'Upcoming Bookings'
    ];

    const rows = clients.map(({ user, stats }) => [
      user.name,
      user.email,
      new Date(user.createdAt).toLocaleDateString(),
      stats.bookingCount,
      `£${stats.totalSpend.toFixed(2)}`,
      stats.lastBookingDate ? new Date(stats.lastBookingDate).toLocaleDateString() : 'Never',
      stats.completedCourses,
      stats.upcomingBookings
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const filename = `all-clients-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      filename,
      data: csvContent,
      contentType: 'text/csv'
    };
  }

  async mergeClients(primaryUserId: string, secondaryUserId: string): Promise<void> {
    // Move all bookings from secondary to primary
    await this.bookingRepository.updateAll(
      { userId: primaryUserId },
      { userId: secondaryUserId }
    );

    // Move all admin notes
    await this.adminNoteRepository.updateAll(
      { userId: primaryUserId },
      { userId: secondaryUserId }
    );

    // Move all email logs
    await this.emailLogRepository.updateAll(
      { recipientId: primaryUserId },
      { recipientId: secondaryUserId }
    );

    // Deactivate secondary account
    await this.userRepository.updateById(secondaryUserId, {
      isActive: false,
      email: `merged_${Date.now()}_${await this.userRepository.findById(secondaryUserId).then(u => u.email)}`,
      updatedAt: new Date()
    });
  }
}