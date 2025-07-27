import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Mail,
  Users,
  Calendar,
  PoundSterling,
  Phone,
  MapPin,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { adminDashboardApi } from '@services/api/admin-dashboard.service';
import { cn } from '@utils/cn';
import { TableRowSkeleton } from '@components/admin/shared/components/DashboardSkeleton';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  stats: {
    bookingCount: number;
    totalSpend: number;
    lastBookingDate?: string;
    completedCourses: number;
    upcomingBookings: number;
  };
  specialRequirements?: string[];
}

interface FilterState {
  search: string;
  hasBookings: string;
  dateFrom: string;
  dateTo: string;
  minSpend: string;
}

interface SortState {
  field: 'name' | 'created' | 'lastBooking' | 'totalSpend' | 'bookingCount';
  direction: 'asc' | 'desc';
}

export const AdminClientsPage: React.FC = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const itemsPerPage = 20;
  
  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    hasBookings: 'all',
    dateFrom: '',
    dateTo: '',
    minSpend: ''
  });
  
  const [sort, setSort] = useState<SortState>({
    field: 'name',
    direction: 'asc'
  });

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '07700123456',
          address: 'Leeds, West Yorkshire',
          createdAt: '2024-01-15T10:00:00Z',
          stats: {
            bookingCount: 5,
            totalSpend: 375,
            lastBookingDate: '2025-01-20T10:00:00Z',
            completedCourses: 3,
            upcomingBookings: 2
          },
          specialRequirements: ['Wheelchair access']
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '07700234567',
          address: 'Sheffield, South Yorkshire',
          createdAt: '2024-02-20T14:30:00Z',
          stats: {
            bookingCount: 2,
            totalSpend: 150,
            lastBookingDate: '2024-12-15T09:00:00Z',
            completedCourses: 2,
            upcomingBookings: 0
          }
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@company.com',
          phone: '07700345678',
          address: 'Bradford, West Yorkshire',
          createdAt: '2024-03-10T11:00:00Z',
          stats: {
            bookingCount: 8,
            totalSpend: 600,
            lastBookingDate: '2025-01-25T14:00:00Z',
            completedCourses: 6,
            upcomingBookings: 2
          },
          specialRequirements: ['Dietary requirements - Vegan']
        }
      ];
      
      // Apply filters
      let filteredClients = mockClients;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredClients = filteredClients.filter(client => 
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.phone?.includes(searchLower)
        );
      }
      
      if (filters.hasBookings !== 'all') {
        filteredClients = filteredClients.filter(client => 
          filters.hasBookings === 'yes' 
            ? client.stats.bookingCount > 0 
            : client.stats.bookingCount === 0
        );
      }
      
      // Apply sorting
      filteredClients.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort.field) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'created':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'lastBooking':
            aValue = a.stats.lastBookingDate ? new Date(a.stats.lastBookingDate).getTime() : 0;
            bValue = b.stats.lastBookingDate ? new Date(b.stats.lastBookingDate).getTime() : 0;
            break;
          case 'totalSpend':
            aValue = a.stats.totalSpend;
            bValue = b.stats.totalSpend;
            break;
          case 'bookingCount':
            aValue = a.stats.bookingCount;
            bValue = b.stats.bookingCount;
            break;
        }
        
        if (sort.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setClients(filteredClients);
      setTotalClients(filteredClients.length);
      setTotalPages(Math.ceil(filteredClients.length / itemsPerPage));
      
      // If client ID is provided, show that client's profile
      if (clientId) {
        const client = filteredClients.find(c => c.id === clientId);
        if (client) {
          setSelectedClient(client);
          setShowProfileModal(true);
        }
      }
    } catch (error) {
      showToast('Failed to load clients', 'error');
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentPage, filters, sort]);

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedClients.length === 0) {
      showToast('Please select clients first', 'warning');
      return;
    }

    try {
      switch (action) {
        case 'email':
          // Open bulk email modal
          showToast('Opening email composer...', 'info');
          break;
        case 'export':
          await handleExport(selectedClients);
          break;
      }
      
      setSelectedClients([]);
    } catch (error) {
      showToast('Action failed', 'error');
    }
  };

  // Export clients
  const handleExport = async (clientIds?: string[]) => {
    try {
      showToast('Export completed', 'success');
    } catch (error) {
      showToast('Export failed', 'error');
    }
  };

  // Get paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return clients.slice(startIndex, endIndex);
  }, [clients, currentPage]);

  // Sort header component
  const SortHeader: React.FC<{ field: SortState['field']; children: React.ReactNode }> = ({ field, children }) => {
    const isActive = sort.field === field;
    
    return (
      <button
        onClick={() => setSort({
          field,
          direction: isActive && sort.direction === 'asc' ? 'desc' : 'asc'
        })}
        className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-white"
      >
        {children}
        {isActive && (
          <span className="text-xs">
            {sort.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Client Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your client database and communications
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
              <p className="text-2xl font-bold text-green-600">
                {clients.filter(c => c.stats.upcomingBookings > 0).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {clients.filter(c => {
                  const clientDate = new Date(c.createdAt);
                  const now = new Date();
                  return clientDate.getMonth() === now.getMonth() && 
                         clientDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                £{clients.reduce((sum, c) => sum + c.stats.totalSpend, 0).toFixed(2)}
              </p>
            </div>
            <PoundSterling className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors",
                  showFilters
                    ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button
                onClick={() => handleExport()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedClients.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('email')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Email Selected
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Export Selected
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Has Bookings
                </label>
                <select
                  value={filters.hasBookings}
                  onChange={(e) => setFilters({ ...filters, hasBookings: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Clients</option>
                  <option value="yes">With Bookings</option>
                  <option value="no">No Bookings</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Joined From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Joined To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min. Spend (£)
                </label>
                <input
                  type="number"
                  value={filters.minSpend}
                  onChange={(e) => setFilters({ ...filters, minSpend: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    hasBookings: 'all',
                    dateFrom: '',
                    dateTo: '',
                    minSpend: ''
                  });
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === paginatedClients.length && paginatedClients.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients(paginatedClients.map(c => c.id));
                      } else {
                        setSelectedClients([]);
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <SortHeader field="name">Client</SortHeader>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <SortHeader field="bookingCount">Bookings</SortHeader>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <SortHeader field="totalSpend">Total Spend</SortHeader>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <SortHeader field="lastBooking">Last Booking</SortHeader>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
              ) : paginatedClients.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No clients found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Client rows
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowProfileModal(true);
                        }}
                        className="text-left hover:text-primary-600"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">{client.email}</p>
                        {client.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.stats.bookingCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {client.stats.completedCourses} completed
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        £{client.stats.totalSpend.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {client.stats.lastBookingDate ? (
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(client.stats.lastBookingDate).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Never</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowProfileModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View Profile"
                        >
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalClients)} of{' '}
                {totalClients} clients
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm",
                          currentPage === page
                            ? "bg-primary-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Profile Modal */}
      {showProfileModal && selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          onClose={() => {
            setShowProfileModal(false);
            if (clientId) {
              navigate('/admin/clients');
            }
          }}
          onUpdate={fetchClients}
        />
      )}
    </div>
  );
};

// Client Profile Modal Component
const ClientProfileModal: React.FC<{
  client: Client;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ client, onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'bookings' | 'communications' | 'notes'>('details');
  const [notes, setNotes] = useState('');
  
  const handleSaveNotes = async () => {
    try {
      // API call to save notes
      showToast('Notes saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save notes', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">{client.name[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {client.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Client since {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === 'details'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Contact Details
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === 'bookings'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Booking History ({client.stats.bookingCount})
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === 'communications'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Communications
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === 'notes'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Admin Notes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{client.email}</p>
                    </div>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{client.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {client.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="font-medium text-gray-900 dark:text-white">{client.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Client Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {client.stats.bookingCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      £{client.stats.totalSpend.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {client.stats.completedCourses}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {client.stats.upcomingBookings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              {client.specialRequirements && client.specialRequirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Special Requirements
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <ul className="space-y-1">
                        {client.specialRequirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-900 dark:text-white">
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Booking history would be displayed here
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Communication history would be displayed here
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this client..."
                  className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export Data
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminClientsPage;