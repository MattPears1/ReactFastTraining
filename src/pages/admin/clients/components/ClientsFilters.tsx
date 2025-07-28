import React from 'react';
import { Search, X } from 'lucide-react';
import { FilterState } from '../types';

interface ClientsFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClose: () => void;
  totalClients: number;
  activeClientsCount: number;
  inactiveClientsCount: number;
}

export const ClientsFilters: React.FC<ClientsFiltersProps> = ({
  filters,
  onFilterChange,
  onClose,
  totalClients,
  activeClientsCount,
  inactiveClientsCount
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFilterChange({
      search: '',
      hasBookings: 'all',
      dateFrom: '',
      dateTo: '',
      minSpend: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search clients
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name, email, or phone..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Booking Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking status
          </label>
          <select
            value={filters.hasBookings}
            onChange={(e) => handleFilterChange('hasBookings', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All clients ({totalClients})</option>
            <option value="active">Active clients ({activeClientsCount})</option>
            <option value="inactive">Inactive clients ({inactiveClientsCount})</option>
            <option value="none">No bookings</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Joined from
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Joined to
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Minimum Spend */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum spend (£)
          </label>
          <input
            type="number"
            value={filters.minSpend}
            onChange={(e) => handleFilterChange('minSpend', e.target.value)}
            placeholder="0"
            min="0"
            step="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <span className="text-sm text-gray-600">
          {activeFiltersCount > 0 && `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
        </span>
        <button
          onClick={resetFilters}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
};