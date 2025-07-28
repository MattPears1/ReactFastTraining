import React from 'react';
import {
  MoreVertical,
  CheckCircle,
  Clock,
  X,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import { cn } from '@utils/cn';
import { Client, SortState } from '../types';

interface ClientsTableProps {
  clients: Client[];
  selectedClients: string[];
  onSelectClient: (clientId: string) => void;
  onSelectAll: () => void;
  onClientClick: (client: Client) => void;
  sort: SortState;
  onSort: (field: SortState['field']) => void;
  loading?: boolean;
}

const SortHeader: React.FC<{ 
  field: SortState['field']; 
  children: React.ReactNode;
  sort: SortState;
  onSort: (field: SortState['field']) => void;
}> = ({ field, children, sort, onSort }) => {
  const isActive = sort.field === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors group"
    >
      {children}
      <span className={cn(
        "text-gray-400 transition-opacity",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )}>
        {sort.direction === 'asc' ? '↑' : '↓'}
      </span>
    </button>
  );
};

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  selectedClients,
  onSelectClient,
  onSelectAll,
  onClientClick,
  sort,
  onSort,
  loading = false
}) => {
  const allSelected = clients.length > 0 && selectedClients.length === clients.length;
  const someSelected = selectedClients.length > 0 && selectedClients.length < clients.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="name" sort={sort} onSort={onSort}>
                Client
              </SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="bookingCount" sort={sort} onSort={onSort}>
                Bookings
              </SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="totalSpend" sort={sort} onSort={onSort}>
                Total Spend
              </SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="lastBooking" sort={sort} onSort={onSort}>
                Last Booking
              </SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr 
              key={client.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onClientClick(client)}
            >
              <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={() => onSelectClient(client.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {client.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {client.id}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  <a href={`mailto:${client.email}`} className="text-sm text-primary-600 hover:text-primary-900 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </a>
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {client.stats.bookingCount} total
                </div>
                <div className="text-sm text-gray-500">
                  {client.stats.upcomingBookings} upcoming
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  £{client.stats.totalSpend.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {client.stats.lastBookingDate ? 
                    new Date(client.stats.lastBookingDate).toLocaleDateString('en-GB') : 
                    'Never'
                  }
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  client.stats.upcomingBookings > 0 
                    ? "bg-green-100 text-green-800"
                    : client.stats.bookingCount > 0
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                )}>
                  {client.stats.upcomingBookings > 0 ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : client.stats.bookingCount > 0 ? (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Past Client
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      No Bookings
                    </>
                  )}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                <button className="text-gray-400 hover:text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};