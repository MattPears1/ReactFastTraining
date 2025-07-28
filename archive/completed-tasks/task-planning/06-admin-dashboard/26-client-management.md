# Client Management

**Completion Status: 88%** ✅

## Overview
Comprehensive client database with booking history, contact management, and communication tools for the admin. please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc

## Implementation Status
- ✅ Client list with search and filters - COMPLETE
- ✅ Client profile modals - COMPLETE
- ✅ Booking history view - COMPLETE
- ✅ Communication tracking - COMPLETE
- ✅ Notes system - COMPLETE
- ✅ Export functionality - COMPLETE
- ⏳ Merge duplicate accounts - PENDING
- ⏳ Backend API integration - PENDING
- ⏳ Email integration - PENDING 

## Features

### 1. Client List
- Searchable client database
- Filter by booking status, date joined
- Sort by name, bookings, total spent
- Quick contact options
- Export functionality

### 2. Client Profiles
- Contact information
- Booking history
- Total spending
- Special requirements
- Communication history
- Notes section

### 3. Actions
- Send individual emails
- View all bookings
- Add admin notes
- Export client data
- Merge duplicate accounts

## Database Queries

### Client List Service
```typescript
// backend-loopback4/src/services/client-management.service.ts
export class ClientManagementService {
  static async getClientList(
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
  ) {
    let query = db
      .select({
        user: users,
        stats: {
          bookingCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
          totalSpend: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
          lastBookingDate: sql<Date>`MAX(${bookings.createdAt})`,
          completedCourses: sql<number>`
            COUNT(DISTINCT CASE 
              WHEN ${courseSessions.status} = 'completed' 
              THEN ${bookings.id} 
            END)
          `,
          upcomingBookings: sql<number>`
            COUNT(DISTINCT CASE 
              WHEN ${courseSessions.sessionDate} >= CURRENT_DATE 
              AND ${bookings.status} = 'confirmed'
              THEN ${bookings.id} 
            END)
          `,
        },
      })
      .from(users)
      .leftJoin(bookings, eq(users.id, bookings.userId))
      .leftJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .groupBy(users.id);

    // Apply filters
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )
      );
    }

    if (filters?.dateFrom) {
      conditions.push(gte(users.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(users.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply having clause for aggregated filters
    if (filters?.hasBookings !== undefined) {
      query = query.having(
        filters.hasBookings
          ? sql`COUNT(DISTINCT ${bookings.id}) > 0`
          : sql`COUNT(DISTINCT ${bookings.id}) = 0`
      );
    }

    if (filters?.minSpend) {
      query = query.having(
        sql`COALESCE(SUM(${bookings.totalAmount}), 0) >= ${filters.minSpend}`
      );
    }

    // Apply sorting
    if (sort) {
      const sortMap = {
        name: users.name,
        created: users.createdAt,
        lastBooking: sql`MAX(${bookings.createdAt})`,
        totalSpend: sql`COALESCE(SUM(${bookings.totalAmount}), 0)`,
        bookingCount: sql`COUNT(DISTINCT ${bookings.id})`,
      };

      const sortColumn = sortMap[sort.field];
      query = query.orderBy(
        sort.direction === 'desc' ? desc(sortColumn) : asc(sortColumn)
      );
    }

    // Apply pagination
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    const results = await query;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${users.id})` })
      .from(users);

    return {
      clients: results,
      total: count,
    };
  }

  static async getClientDetails(userId: string) {
    // Basic info
    const [client] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!client) {
      throw new Error('Client not found');
    }

    // Stats
    const [stats] = await db
      .select({
        totalBookings: sql<number>`COUNT(DISTINCT ${bookings.id})`,
        totalSpent: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
        totalAttendees: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        completedCourses: sql<number>`
          COUNT(DISTINCT CASE 
            WHEN ${courseSessions.status} = 'completed' 
            THEN ${bookings.id} 
          END)
        `,
        cancelledBookings: sql<number>`
          COUNT(DISTINCT CASE 
            WHEN ${bookings.status} = 'cancelled' 
            THEN ${bookings.id} 
          END)
        `,
      })
      .from(bookings)
      .leftJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(eq(bookings.userId, userId));

    // Recent bookings
    const recentBookings = await db
      .select({
        booking: bookings,
        session: courseSessions,
        attendeeCount: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(eq(bookings.userId, userId))
      .groupBy(bookings.id, courseSessions.id)
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    // Special requirements
    const specialRequirements = await db
      .select()
      .from(specialRequirements)
      .innerJoin(bookings, eq(specialRequirements.bookingId, bookings.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(specialRequirements.createdAt));

    // Communication history
    const communications = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.recipientId, userId))
      .orderBy(desc(emailLogs.sentAt))
      .limit(20);

    // Admin notes
    const notes = await db
      .select()
      .from(adminNotes)
      .where(eq(adminNotes.userId, userId))
      .orderBy(desc(adminNotes.createdAt));

    return {
      client,
      stats,
      recentBookings,
      specialRequirements,
      communications,
      notes,
    };
  }

  static async addAdminNote(userId: string, note: string, adminId: string) {
    return await db.insert(adminNotes).values({
      userId,
      note,
      createdBy: adminId,
      createdAt: new Date(),
    });
  }

  static async exportClientData(userId: string) {
    const details = await this.getClientDetails(userId);
    
    // Format as CSV or PDF
    const csvData = this.formatClientDataAsCSV(details);
    
    return {
      filename: `client-${userId}-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      data: csvData,
      contentType: 'text/csv',
    };
  }
}
```

## Frontend Implementation

### Client Management Page
```typescript
// src/pages/admin/ClientManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Mail, User } from 'lucide-react';
import { ClientListTable } from '@/components/admin/ClientListTable';
import { ClientDetailModal } from '@/components/admin/ClientDetailModal';
import { BulkEmailModal } from '@/components/admin/BulkEmailModal';
import { useDebounce } from '@/hooks/useDebounce';

export const ClientManagementPage: React.FC = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    hasBookings: null,
    dateFrom: null,
    dateTo: null,
    minSpend: null,
  });
  const [sort, setSort] = useState({
    field: 'name' as const,
    direction: 'asc' as const,
  });
  const [pagination, setPagination] = useState({
    limit: 25,
    offset: 0,
    total: 0,
  });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadClients();
  }, [debouncedSearch, filters, sort, pagination.offset]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getClientList(
        {
          search: debouncedSearch,
          ...filters,
        },
        sort,
        {
          limit: pagination.limit,
          offset: pagination.offset,
        }
      );
      
      setClients(response.clients);
      setPagination(prev => ({ ...prev, total: response.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    const csv = await adminApi.exportAllClients(filters);
    downloadFile(csv);
  };

  const handleBulkEmail = () => {
    if (selectedClients.length === 0) {
      toast.error('Please select clients to email');
      return;
    }
    setShowBulkEmail(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Client Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your client database and communications
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedClients.length > 0 && (
                <button
                  onClick={handleBulkEmail}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email ({selectedClients.length})
                </button>
              )}
              
              <button
                onClick={handleExportAll}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.hasBookings === null ? '' : filters.hasBookings.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    hasBookings: e.target.value === '' ? null : e.target.value === 'true' 
                  })}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">All Clients</option>
                  <option value="true">With Bookings</option>
                  <option value="false">No Bookings</option>
                </select>
                
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    dateFrom: e.target.value || null 
                  })}
                  className="px-4 py-2 border rounded-lg"
                  placeholder="Joined from"
                />
                
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    dateTo: e.target.value || null 
                  })}
                  className="px-4 py-2 border rounded-lg"
                  placeholder="Joined to"
                />
                
                <input
                  type="number"
                  value={filters.minSpend || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    minSpend: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="px-4 py-2 border rounded-lg"
                  placeholder="Min spend £"
                />
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    hasBookings: null,
                    dateFrom: null,
                    dateTo: null,
                    minSpend: null,
                  })}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client List */}
        <ClientListTable
          clients={clients}
          loading={loading}
          sort={sort}
          onSort={setSort}
          selectedClients={selectedClients}
          onSelectClients={setSelectedClients}
          onSelectClient={setSelectedClient}
          pagination={pagination}
          onPageChange={(offset) => setPagination(prev => ({ ...prev, offset }))}
        />

        {/* Client Detail Modal */}
        {selectedClient && (
          <ClientDetailModal
            clientId={selectedClient}
            isOpen={!!selectedClient}
            onClose={() => setSelectedClient(null)}
            onUpdate={loadClients}
          />
        )}

        {/* Bulk Email Modal */}
        {showBulkEmail && (
          <BulkEmailModal
            clientIds={selectedClients}
            isOpen={showBulkEmail}
            onClose={() => {
              setShowBulkEmail(false);
              setSelectedClients([]);
            }}
          />
        )}
      </div>
    </div>
  );
};
```

### Client List Table Component
```typescript
// src/components/admin/ClientListTable.tsx
import React from 'react';
import { ChevronUp, ChevronDown, Mail, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ClientListTableProps {
  clients: ClientListItem[];
  loading: boolean;
  sort: { field: string; direction: 'asc' | 'desc' };
  onSort: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  selectedClients: string[];
  onSelectClients: (ids: string[]) => void;
  onSelectClient: (id: string) => void;
  pagination: { limit: number; offset: number; total: number };
  onPageChange: (offset: number) => void;
}

export const ClientListTable: React.FC<ClientListTableProps> = ({
  clients,
  loading,
  sort,
  onSort,
  selectedClients,
  onSelectClients,
  onSelectClient,
  pagination,
  onPageChange,
}) => {
  const handleSort = (field: string) => {
    if (sort.field === field) {
      onSort({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ field, direction: 'asc' });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectClients(clients.map(c => c.user.id));
    } else {
      onSelectClients([]);
    }
  };

  const handleSelectClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      onSelectClients(selectedClients.filter(id => id !== clientId));
    } else {
      onSelectClients([...selectedClients, clientId]);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (loading && clients.length === 0) {
    return <TableSkeleton />;
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Client
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('created')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Joined
                  <SortIcon field="created" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('bookingCount')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Bookings
                  <SortIcon field="bookingCount" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('totalSpend')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Total Spent
                  <SortIcon field="totalSpend" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('lastBooking')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Last Booking
                  <SortIcon field="lastBooking" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map((client) => (
              <tr key={client.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.user.id)}
                    onChange={() => handleSelectClient(client.user.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {client.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {client.user.email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(client.user.createdAt), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{client.stats.bookingCount}</span>
                    {client.stats.upcomingBookings > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {client.stats.upcomingBookings} upcoming
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">
                  £{client.stats.totalSpend.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.stats.lastBookingDate ? 
                    format(new Date(client.stats.lastBookingDate), 'dd MMM yyyy') : 
                    'Never'
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectClient(client.user.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sendIndividualEmail(client.user.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {pagination.offset + 1} to{' '}
          {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
          {pagination.total} clients
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.offset + pagination.limit)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Client Detail Modal
```typescript
// src/components/admin/ClientDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Mail, Download, Calendar, PoundSterling, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

export const ClientDetailModal: React.FC<{
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ clientId, isOpen, onClose, onUpdate }) => {
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'communications' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (isOpen && clientId) {
      loadClientDetails();
    }
  }, [clientId, isOpen]);

  const loadClientDetails = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getClientDetails(clientId);
      setClientData(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await adminApi.addClientNote(clientId, newNote);
    setNewNote('');
    loadClientDetails();
    toast.success('Note added');
  };

  const handleExportClient = async () => {
    const data = await adminApi.exportClientData(clientId);
    downloadFile(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {clientData?.client.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {clientData?.client.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => sendIndividualEmail(clientId)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Send email"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportClient}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Export data"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : clientData ? (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'overview'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'bookings'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings ({clientData.stats.totalBookings})
              </button>
              <button
                onClick={() => setActiveTab('communications')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'communications'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Communications
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'notes'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Notes ({clientData.notes.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Bookings"
                      value={clientData.stats.totalBookings}
                      icon={Calendar}
                    />
                    <StatCard
                      label="Total Spent"
                      value={`£${clientData.stats.totalSpent.toFixed(2)}`}
                      icon={PoundSterling}
                    />
                    <StatCard
                      label="Completed Courses"
                      value={clientData.stats.completedCourses}
                      icon={FileText}
                    />
                    <StatCard
                      label="Total Attendees"
                      value={clientData.stats.totalAttendees}
                      icon={Users}
                    />
                  </div>

                  {/* Account Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Account Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                        <span>{format(new Date(clientData.client.createdAt), 'dd MMMM yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Login:</span>
                        <span>{clientData.client.lastLogin ? 
                          format(new Date(clientData.client.lastLogin), 'dd MMM yyyy HH:mm') : 
                          'Never'
                        }</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          clientData.client.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {clientData.client.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  {clientData.specialRequirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        Special Requirements History
                      </h3>
                      <div className="space-y-3">
                        {clientData.specialRequirements.map((req, index) => (
                          <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                            <p className="font-medium">{req.requirementType}</p>
                            {req.details && <p className="text-sm mt-1">{req.details}</p>}
                            <p className="text-xs text-gray-500 mt-2">
                              For booking on {format(new Date(req.createdAt), 'dd MMM yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {clientData.recentBookings.map((booking) => (
                    <div
                      key={booking.booking.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => viewBookingDetails(booking.booking.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.session.courseType}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(booking.session.sessionDate), 'EEEE, d MMMM yyyy')}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''} • 
                            Ref: {booking.booking.bookingReference}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">£{booking.booking.totalAmount.toFixed(2)}</p>
                          <StatusBadge status={booking.booking.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'communications' && (
                <div className="space-y-4">
                  {clientData.communications.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No communications yet
                    </p>
                  ) : (
                    clientData.communications.map((comm) => (
                      <div key={comm.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{comm.subject}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {comm.type} • {format(new Date(comm.sentAt), 'dd MMM yyyy HH:mm')}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            comm.status === 'delivered' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {comm.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Add Note Form */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this client..."
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  {clientData.notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <p className="whitespace-pre-wrap">{note.note}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        By {note.createdByName} • {format(new Date(note.createdAt), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Failed to load client details</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Testing

1. Test client search functionality
2. Test filtering and sorting
3. Test bulk email selection
4. Test client detail loading
5. Test note creation
6. Test export functionality
7. Test pagination
8. Test responsive layout