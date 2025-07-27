import { useCallback, useEffect, useState, useRef } from 'react';
import { bookingHistoryService } from '@/services/client';
import type { BookingHistoryItem, BookingFilters, PaginationInfo } from '@/types/client/booking.types';
import { isBookingHistoryItem, ClientPortalError, NetworkError, type UsePaginatedReturn } from '@/types/client/enhanced.types';

interface UseBookingHistoryParams {
  initialFilters?: BookingFilters;
  pageSize?: number;
}

interface UseBookingHistoryReturn extends Omit<UsePaginatedReturn<BookingHistoryItem>, 'loadMore' | 'hasMore' | 'refetch'> {
  bookings: BookingHistoryItem[];
  filters: BookingFilters;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: BookingFilters) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  exportToCSV: () => Promise<void>;
}

export const useBookingHistory = ({
  initialFilters = {},
  pageSize = 10,
}: UseBookingHistoryParams = {}): UseBookingHistoryReturn => {
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<BookingFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    offset: 0,
    total: 0,
  });
  
  // Abort controller for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBookings = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingHistoryService.getBookingHistory({
        ...filters,
        searchTerm,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new ClientPortalError('Invalid response format');
      }
      
      if (!Array.isArray(response.bookings)) {
        throw new ClientPortalError('Bookings must be an array');
      }
      
      // Validate each booking item
      if (!response.bookings.every(isBookingHistoryItem)) {
        throw new ClientPortalError('Invalid booking data format');
      }
      
      // Validate pagination
      if (!response.pagination || typeof response.pagination.total !== 'number') {
        throw new ClientPortalError('Invalid pagination data');
      }
      
      setBookings(response.bookings);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (err instanceof Error) {
        setError(err);
      } else if (typeof err === 'object' && err !== null && 'status' in err) {
        setError(new NetworkError('Failed to load booking history', (err as any).status));
      } else {
        setError(new ClientPortalError('An unexpected error occurred'));
      }
      console.error('Booking history fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, pagination.limit, pagination.offset]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  const exportToCSV = useCallback(async () => {
    try {
      const csv = await bookingHistoryService.exportBookingHistory(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booking-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
      fetchBookings();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, pagination.limit]); // Don't include fetchBookings to avoid infinite loop

  // Fetch when pagination changes
  useEffect(() => {
    fetchBookings();
  }, [pagination.offset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: bookings,
    bookings,
    loading,
    error,
    pagination: {
      ...pagination,
      hasMore: pagination.offset + pagination.limit < pagination.total
    },
    filters,
    searchTerm,
    setSearchTerm,
    setFilters,
    setPage,
    refresh,
    refetch: refresh,
    exportToCSV,
  };
};