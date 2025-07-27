import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Download,
  MoreVertical,
  User
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminTable } from '../../components/ui/AdminTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { AdminEmptyState } from '../../components/ui/AdminEmptyState';
import '../../styles/admin-design-system.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'instructor' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  totalBookings: number;
  lastActive: string;
  createdAt: string;
  avatar?: string;
}

const mockUsers: UserData[] = [
  {
    id: '1',
    name: 'Lex Richardson',
    email: 'lex@reactfasttraining.co.uk',
    phone: '07123456789',
    role: 'admin',
    status: 'active',
    totalBookings: 0,
    lastActive: '2025-01-27T10:30:00Z',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '07987654321',
    role: 'customer',
    status: 'active',
    totalBookings: 3,
    lastActive: '2025-01-25T14:20:00Z',
    createdAt: '2025-01-15T09:00:00Z'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.co.uk',
    phone: '07555123456',
    role: 'customer',
    status: 'active',
    totalBookings: 5,
    lastActive: '2025-01-26T16:45:00Z',
    createdAt: '2025-01-10T11:30:00Z'
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '07444987654',
    role: 'instructor',
    status: 'active',
    totalBookings: 0,
    lastActive: '2025-01-27T08:00:00Z',
    createdAt: '2025-01-05T10:00:00Z'
  },
  {
    id: '5',
    name: 'Emma Wilson',
    email: 'emma.wilson@nursery.com',
    phone: '07333567890',
    role: 'customer',
    status: 'inactive',
    totalBookings: 1,
    lastActive: '2025-01-10T12:00:00Z',
    createdAt: '2025-01-08T14:00:00Z'
  }
];

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = mockUsers;
      
      if (searchTerm) {
        filtered = filtered.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role === roleFilter);
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === statusFilter);
      }
      
      return filtered;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updating user status:', userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const getRoleVariant = (role: string): 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'admin':
        return 'info';
      case 'instructor':
        return 'success';
      case 'customer':
      default:
        return 'neutral';
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="admin-icon-sm" />;
      case 'instructor':
        return <UserCheck className="admin-icon-sm" />;
      default:
        return <User className="admin-icon-sm" />;
    }
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return lastActive.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load users</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">Please try refreshing the page</p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-subtitle">
              Manage users, roles, and permissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button className="admin-btn admin-btn-secondary">
              <Download className="admin-icon-sm" />
              Export
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus className="admin-icon-sm" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-text-small admin-text-muted">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 admin-mt-1">
                {mockUsers.length}
              </p>
            </div>
            <div className="text-primary-500">
              <User className="admin-icon-lg" />
            </div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-text-small admin-text-muted">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 admin-mt-1">
                {mockUsers.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="text-green-500">
              <UserCheck className="admin-icon-lg" />
            </div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-text-small admin-text-muted">Instructors</p>
              <p className="text-2xl font-bold text-gray-900 admin-mt-1">
                {mockUsers.filter(u => u.role === 'instructor').length}
              </p>
            </div>
            <div className="text-secondary-500">
              <Shield className="admin-icon-lg" />
            </div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-text-small admin-text-muted">Customers</p>
              <p className="text-2xl font-bold text-gray-900 admin-mt-1">
                {mockUsers.filter(u => u.role === 'customer').length}
              </p>
            </div>
            <div className="text-accent-500">
              <User className="admin-icon-lg" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn admin-btn-secondary">
              <Filter className="admin-icon-sm" />
              More Filters
            </button>
          </div>
        </div>
      </AdminCard>

      {/* Users Table */}
      <AdminTable
        columns={[
          {
            key: 'user',
            header: 'User',
            render: (user: UserData) => (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="admin-text-small admin-text-muted">{user.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (user: UserData) => (
              <div>
                <div className="flex items-center admin-text-small">
                  <Mail className="admin-icon-sm mr-1.5 text-gray-400" />
                  {user.email}
                </div>
                <div className="flex items-center admin-text-small admin-text-muted admin-mt-1">
                  <Phone className="admin-icon-sm mr-1.5 text-gray-400" />
                  {user.phone}
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (user: UserData) => (
              <AdminBadge variant={getRoleVariant(user.role)} icon={() => getRoleIcon(user.role)}>
                {user.role}
              </AdminBadge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (user: UserData) => (
              <AdminBadge variant={getStatusVariant(user.status)}>
                {user.status}
              </AdminBadge>
            ),
          },
          {
            key: 'activity',
            header: 'Activity',
            render: (user: UserData) => (
              <div className="admin-text-small">
                <div className="text-gray-900">
                  {user.totalBookings} bookings
                </div>
                <div className="admin-text-muted">
                  Active {formatLastActive(user.lastActive)}
                </div>
              </div>
            ),
          },
          {
            key: 'joined',
            header: 'Joined',
            render: (user: UserData) => (
              <div className="admin-text-small text-gray-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (user: UserData) => (
              <div className="flex justify-end gap-1">
                <button className="admin-btn admin-btn-secondary p-2" title="Edit">
                  <Edit3 className="admin-icon-sm" />
                </button>
                <button className="admin-btn admin-btn-secondary p-2" title="More options">
                  <MoreVertical className="admin-icon-sm" />
                </button>
              </div>
            ),
          },
        ]}
        data={users || []}
        keyExtractor={(user) => user.id}
        loading={false}
        emptyMessage="No users found"
        emptyIcon={<User className="w-12 h-12" />}
      />
    </div>
  );
};