# Admin Dashboard State Management Architecture

## Overview
This document outlines a hybrid state management approach for the React Fast Training admin dashboard, combining Zustand for global state, React Query for server state, and local React state for component-specific needs.

## 1. State Architecture Overview

### State Categories
```typescript
// Global Application State (Zustand)
interface GlobalAdminState {
  // Authentication & User
  admin: AdminUser | null;
  permissions: Permission[];
  preferences: UserPreferences;
  
  // UI State
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeModule: ModuleType;
  globalNotifications: Notification[];
  
  // Real-time Connection
  wsStatus: 'connected' | 'disconnected' | 'reconnecting';
  pendingUpdates: Update[];
}

// Server State (React Query)
interface ServerState {
  // Dashboard Data
  dashboardMetrics: DashboardMetrics;
  revenueCharts: ChartData[];
  
  // Resource Lists
  bookings: PaginatedData<Booking>;
  sessions: CalendarSession[];
  clients: PaginatedData<Client>;
  
  // Detail Views
  selectedBooking: BookingDetail;
  selectedSession: SessionDetail;
  selectedClient: ClientDetail;
}

// Local Component State (useState/useReducer)
interface LocalState {
  // Forms
  formData: Record<string, any>;
  validationErrors: ValidationError[];
  
  // UI Controls
  modalOpen: boolean;
  selectedRows: string[];
  filters: FilterState;
  sortConfig: SortConfig;
}
```

## 2. Zustand Store Implementation

### Main Admin Store
```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AdminStore {
  // State
  admin: AdminUser | null;
  permissions: Set<string>;
  preferences: UserPreferences;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: AdminNotification[];
  wsConnection: WebSocket | null;
  wsStatus: ConnectionStatus;
  
  // Actions
  setAdmin: (admin: AdminUser | null) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  toggleSidebar: () => void;
  addNotification: (notification: AdminNotification) => void;
  removeNotification: (id: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  clearSession: () => void;
}

export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial State
          admin: null,
          permissions: new Set(),
          preferences: {
            dateFormat: 'dd/MM/yyyy',
            timeFormat: '24h',
            defaultView: 'dashboard',
            emailNotifications: true,
          },
          theme: 'light',
          sidebarCollapsed: false,
          notifications: [],
          wsConnection: null,
          wsStatus: 'disconnected',
          
          // Actions
          setAdmin: (admin) =>
            set((state) => {
              state.admin = admin;
              state.permissions = new Set(admin?.permissions || []);
            }),
            
          updatePreferences: (prefs) =>
            set((state) => {
              Object.assign(state.preferences, prefs);
            }),
            
          toggleSidebar: () =>
            set((state) => {
              state.sidebarCollapsed = !state.sidebarCollapsed;
            }),
            
          addNotification: (notification) =>
            set((state) => {
              state.notifications.push({
                ...notification,
                id: notification.id || generateId(),
                timestamp: new Date(),
              });
              
              // Auto-remove after duration
              if (notification.duration) {
                setTimeout(() => {
                  get().removeNotification(notification.id);
                }, notification.duration);
              }
            }),
            
          removeNotification: (id) =>
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
            }),
            
          connectWebSocket: () => {
            const ws = new WebSocket(process.env.REACT_APP_WS_URL!);
            
            ws.onopen = () => {
              set({ wsStatus: 'connected', wsConnection: ws });
              get().addNotification({
                type: 'success',
                message: 'Real-time updates connected',
                duration: 3000,
              });
            };
            
            ws.onclose = () => {
              set({ wsStatus: 'disconnected', wsConnection: null });
              // Attempt reconnection
              setTimeout(() => {
                if (get().admin) {
                  get().connectWebSocket();
                }
              }, 5000);
            };
            
            ws.onerror = () => {
              set({ wsStatus: 'disconnected' });
              get().addNotification({
                type: 'error',
                message: 'Real-time connection failed',
              });
            };
            
            set({ wsConnection: ws });
          },
          
          disconnectWebSocket: () => {
            const ws = get().wsConnection;
            if (ws) {
              ws.close();
              set({ wsConnection: null, wsStatus: 'disconnected' });
            }
          },
          
          clearSession: () =>
            set((state) => {
              state.admin = null;
              state.permissions.clear();
              state.notifications = [];
              if (state.wsConnection) {
                state.wsConnection.close();
              }
              state.wsConnection = null;
              state.wsStatus = 'disconnected';
            }),
        }))
      ),
      {
        name: 'admin-store',
        partialize: (state) => ({
          preferences: state.preferences,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
);

// Selectors
export const useAdmin = () => useAdminStore((state) => state.admin);
export const usePermissions = () => useAdminStore((state) => state.permissions);
export const useHasPermission = (permission: string) => 
  useAdminStore((state) => state.permissions.has(permission));
export const useNotifications = () => useAdminStore((state) => state.notifications);
```

### Modular Store Slices
```typescript
// Booking Management Slice
interface BookingManagementStore {
  selectedBookings: Set<string>;
  bulkActionMode: boolean;
  filters: BookingFilters;
  viewMode: 'table' | 'calendar' | 'kanban';
  
  selectBooking: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<BookingFilters>) => void;
  setViewMode: (mode: 'table' | 'calendar' | 'kanban') => void;
}

export const useBookingStore = create<BookingManagementStore>((set) => ({
  selectedBookings: new Set(),
  bulkActionMode: false,
  filters: {
    status: 'all',
    dateRange: 'week',
    search: '',
  },
  viewMode: 'table',
  
  selectBooking: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedBookings);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        selectedBookings: newSet,
        bulkActionMode: newSet.size > 0,
      };
    }),
    
  selectAll: (ids) =>
    set({
      selectedBookings: new Set(ids),
      bulkActionMode: ids.length > 0,
    }),
    
  clearSelection: () =>
    set({
      selectedBookings: new Set(),
      bulkActionMode: false,
    }),
    
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
    
  setViewMode: (viewMode) => set({ viewMode }),
}));
```

## 3. React Query Configuration

### Query Client Setup
```typescript
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time for different data types
      staleTime: (query) => {
        const key = query.queryKey[0];
        switch (key) {
          case 'dashboard': return 30 * 1000; // 30 seconds
          case 'bookings': return 60 * 1000; // 1 minute
          case 'sessions': return 5 * 60 * 1000; // 5 minutes
          case 'clients': return 10 * 60 * 1000; // 10 minutes
          default: return 60 * 1000;
        }
      },
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        if (error?.status === 401) {
          useAdminStore.getState().clearSession();
          window.location.href = '/admin/login';
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handling
      console.error('Query error:', error);
      useAdminStore.getState().addNotification({
        type: 'error',
        message: `Failed to load ${query.queryKey[0]}`,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error('Mutation error:', error);
      useAdminStore.getState().addNotification({
        type: 'error',
        message: 'Operation failed. Please try again.',
      });
    },
    onSuccess: (data, variables, context, mutation) => {
      // Global success handling
      if (mutation.meta?.successMessage) {
        useAdminStore.getState().addNotification({
          type: 'success',
          message: mutation.meta.successMessage as string,
          duration: 3000,
        });
      }
    },
  }),
});
```

### Query Hooks with Optimistic Updates
```typescript
// Dashboard metrics hook
export const useDashboardMetrics = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['dashboard', 'metrics', dateRange],
    queryFn: () => adminApi.getDashboardMetrics(dateRange),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};

// Bookings with complex filtering
export const useBookings = (options: {
  filters?: BookingFilters;
  sort?: SortConfig;
  pagination?: PaginationConfig;
}) => {
  const { filters, sort, pagination } = options;
  
  return useQuery({
    queryKey: ['bookings', { filters, sort, pagination }],
    queryFn: () => adminApi.getBookings({ filters, sort, pagination }),
    keepPreviousData: true, // Smooth pagination
    staleTime: 60 * 1000,
  });
};

// Mutation with optimistic updates
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      adminApi.updateBooking(id, data),
      
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['bookings']);
      await queryClient.cancelQueries(['booking', id]);
      
      // Snapshot previous values
      const previousBookings = queryClient.getQueryData(['bookings']);
      const previousBooking = queryClient.getQueryData(['booking', id]);
      
      // Optimistically update
      queryClient.setQueriesData(
        ['bookings'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((booking: Booking) =>
              booking.id === id ? { ...booking, ...data } : booking
            ),
          };
        }
      );
      
      queryClient.setQueryData(['booking', id], (old: any) => ({
        ...old,
        ...data,
      }));
      
      return { previousBookings, previousBooking };
    },
    
    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['bookings'], context.previousBookings);
      }
      if (context?.previousBooking) {
        queryClient.setQueryData(['booking', id], context.previousBooking);
      }
    },
    
    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['booking', id]);
    },
    
    meta: {
      successMessage: 'Booking updated successfully',
    },
  });
};

// Bulk operations with progress tracking
export const useBulkCancelBookings = () => {
  const queryClient = useQueryClient();
  const addNotification = useAdminStore((state) => state.addNotification);
  
  return useMutation({
    mutationFn: async (bookingIds: string[]) => {
      const total = bookingIds.length;
      let completed = 0;
      
      // Show progress notification
      const progressId = generateId();
      addNotification({
        id: progressId,
        type: 'info',
        message: `Cancelling ${total} bookings...`,
        progress: 0,
      });
      
      // Process in batches
      const batchSize = 10;
      const results = [];
      
      for (let i = 0; i < bookingIds.length; i += batchSize) {
        const batch = bookingIds.slice(i, i + batchSize);
        const batchResults = await adminApi.bulkCancelBookings(batch);
        results.push(...batchResults);
        
        completed += batch.length;
        const progress = (completed / total) * 100;
        
        // Update progress
        useAdminStore.setState((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === progressId
              ? { ...n, progress, message: `Cancelled ${completed}/${total} bookings` }
              : n
          ),
        }));
      }
      
      // Remove progress notification
      useAdminStore.getState().removeNotification(progressId);
      
      return results;
    },
    
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      addNotification({
        type: successful === results.length ? 'success' : 'warning',
        message: `Cancelled ${successful} bookings${failed > 0 ? `, ${failed} failed` : ''}`,
        duration: 5000,
      });
      
      // Invalidate affected queries
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['dashboard']);
    },
  });
};
```

## 4. Real-time State Synchronization

### WebSocket Integration with React Query
```typescript
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const wsConnection = useAdminStore((state) => state.wsConnection);
  
  useEffect(() => {
    if (!wsConnection) return;
    
    const handlers = {
      'booking:created': (booking: Booking) => {
        // Add to list cache
        queryClient.setQueriesData(
          ['bookings'],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: [booking, ...old.items],
              total: old.total + 1,
            };
          }
        );
        
        // Invalidate dashboard
        queryClient.invalidateQueries(['dashboard']);
      },
      
      'booking:updated': (booking: Booking) => {
        // Update in list cache
        queryClient.setQueriesData(
          ['bookings'],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((b: Booking) =>
                b.id === booking.id ? booking : b
              ),
            };
          }
        );
        
        // Update detail cache
        queryClient.setQueryData(['booking', booking.id], booking);
      },
      
      'session:rescheduled': ({ sessionId, newDate, affectedBookings }) => {
        // Invalidate calendar
        queryClient.invalidateQueries(['calendar']);
        
        // Update affected bookings
        queryClient.setQueriesData(
          ['bookings'],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((b: Booking) =>
                affectedBookings.includes(b.id)
                  ? { ...b, sessionDate: newDate, needsNotification: true }
                  : b
              ),
            };
          }
        );
      },
      
      'metrics:update': (metrics: DashboardMetrics) => {
        // Direct cache update for real-time metrics
        queryClient.setQueryData(['dashboard', 'metrics'], metrics);
      },
    };
    
    // Register handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      wsConnection.addEventListener('message', (e) => {
        const message = JSON.parse(e.data);
        if (message.type === event) {
          handler(message.data);
        }
      });
    });
    
    return () => {
      // Cleanup handled by WebSocket close
    };
  }, [wsConnection, queryClient]);
};
```

## 5. Form State Management

### Complex Form with Validation
```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema definition
const sessionFormSchema = z.object({
  courseType: z.enum(['EFAW', 'FAW', 'Paediatric']),
  sessionDate: z.date().min(new Date(), 'Session must be in the future'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  location: z.string().min(3).max(100),
  maxCapacity: z.number().min(1).max(30),
  price: z.number().min(0).max(1000),
  instructor: z.string().uuid(),
  notes: z.string().max(500).optional(),
  requirements: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).optional(),
}).refine(data => {
  const start = parseTime(data.startTime);
  const end = parseTime(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const useSessionForm = (
  initialData?: Partial<CourseSession>,
  onSuccess?: (data: CourseSession) => void
) => {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: initialData || {
      courseType: 'EFAW',
      sessionDate: addDays(new Date(), 7),
      startTime: '09:00',
      endTime: '17:00',
      location: '',
      maxCapacity: 12,
      price: 75,
      instructor: '',
      notes: '',
      requirements: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'requirements',
  });
  
  const createSession = useMutation({
    mutationFn: (data: z.infer<typeof sessionFormSchema>) =>
      adminApi.createSession(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries(['calendar']);
      queryClient.invalidateQueries(['sessions']);
      form.reset();
      onSuccess?.(session);
    },
  });
  
  const handleSubmit = form.handleSubmit(async (data) => {
    // Check for conflicts before submission
    const conflicts = await adminApi.checkSessionConflicts({
      date: data.sessionDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
    });
    
    if (conflicts.length > 0) {
      form.setError('root', {
        message: `Conflict detected with ${conflicts[0].courseType} at ${conflicts[0].startTime}`,
      });
      return;
    }
    
    createSession.mutate(data);
  });
  
  return {
    form,
    fields,
    append,
    remove,
    handleSubmit,
    isSubmitting: createSession.isLoading,
    error: createSession.error,
  };
};
```

## 6. Performance Optimization Strategies

### Selective Re-renders
```typescript
// Use selectors to prevent unnecessary re-renders
const BookingRow: React.FC<{ bookingId: string }> = memo(({ bookingId }) => {
  // Only re-render if this specific booking changes
  const booking = useBookingStore(
    useCallback(
      (state) => state.bookings.find(b => b.id === bookingId),
      [bookingId]
    )
  );
  
  const isSelected = useBookingStore(
    useCallback(
      (state) => state.selectedBookings.has(bookingId),
      [bookingId]
    )
  );
  
  return (
    <tr className={isSelected ? 'bg-blue-50' : ''}>
      {/* Row content */}
    </tr>
  );
});

// Memoized selectors
const selectDashboardStats = (state: DashboardState) => ({
  todayBookings: state.metrics.todayBookings,
  weekRevenue: state.metrics.weekRevenue,
  pendingRefunds: state.metrics.pendingRefunds,
});

export const DashboardStats = () => {
  const stats = useDashboardStore(selectDashboardStats, shallow);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Stats cards */}
    </div>
  );
};
```

### Query Prefetching
```typescript
export const useBookingPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchBooking = useCallback(
    (bookingId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => adminApi.getBookingDetails(bookingId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
  
  const prefetchNextPage = useCallback(
    (currentPage: number, filters: BookingFilters) => {
      queryClient.prefetchQuery({
        queryKey: ['bookings', { filters, pagination: { page: currentPage + 1 } }],
        queryFn: () => adminApi.getBookings({
          filters,
          pagination: { page: currentPage + 1 },
        }),
      });
    },
    [queryClient]
  );
  
  return { prefetchBooking, prefetchNextPage };
};

// Usage in component
const BookingTable = () => {
  const { prefetchBooking } = useBookingPrefetch();
  
  return (
    <table>
      {bookings.map(booking => (
        <tr
          key={booking.id}
          onMouseEnter={() => prefetchBooking(booking.id)}
        >
          {/* Row content */}
        </tr>
      ))}
    </table>
  );
};
```

## 7. State Persistence and Hydration

### Persistent Filter State
```typescript
// Custom hook for URL-synchronized filters
export const useUrlFilters = <T extends Record<string, any>>(
  defaultFilters: T
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters = useMemo(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      if (key in defaultFilters) {
        params[key] = value;
      }
    });
    return { ...defaultFilters, ...params };
  }, [searchParams, defaultFilters]);
  
  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
      const params = new URLSearchParams(searchParams);
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === defaultFilters[key] || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      
      setSearchParams(params);
    },
    [searchParams, setSearchParams, defaultFilters]
  );
  
  return [filters, setFilters] as const;
};

// Usage
const BookingPage = () => {
  const [filters, setFilters] = useUrlFilters({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  
  const { data: bookings } = useBookings({ filters });
  
  return (
    <BookingFilters
      filters={filters}
      onChange={setFilters}
    />
  );
};
```

### Offline State Queue
```typescript
interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retries: number;
}

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const isOnline = useOnlineStatus();
  
  const addToQueue = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => {
    const queuedAction: OfflineAction = {
      ...action,
      id: generateId(),
      timestamp: new Date(),
      retries: 0,
    };
    
    setQueue(prev => [...prev, queuedAction]);
    
    // Persist to localStorage
    const stored = localStorage.getItem('offline-queue') || '[]';
    const existing = JSON.parse(stored);
    localStorage.setItem('offline-queue', JSON.stringify([...existing, queuedAction]));
  }, []);
  
  // Process queue when coming online
  useEffect(() => {
    if (!isOnline || queue.length === 0) return;
    
    const processQueue = async () => {
      for (const action of queue) {
        try {
          await processOfflineAction(action);
          
          // Remove from queue
          setQueue(prev => prev.filter(a => a.id !== action.id));
          
          // Update localStorage
          const stored = localStorage.getItem('offline-queue') || '[]';
          const existing = JSON.parse(stored);
          localStorage.setItem(
            'offline-queue',
            JSON.stringify(existing.filter((a: any) => a.id !== action.id))
          );
        } catch (error) {
          console.error('Failed to process offline action:', error);
          
          // Increment retry count
          setQueue(prev => prev.map(a =>
            a.id === action.id
              ? { ...a, retries: a.retries + 1 }
              : a
          ));
        }
      }
    };
    
    processQueue();
  }, [isOnline, queue]);
  
  return { queue, addToQueue, isOnline };
};
```

## 8. Testing State Management

### State Testing Utilities
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test wrapper with providers
export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Test Zustand store
describe('AdminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      admin: null,
      permissions: new Set(),
      notifications: [],
    });
  });
  
  it('should handle login flow', () => {
    const { result } = renderHook(() => useAdminStore());
    
    act(() => {
      result.current.setAdmin({
        id: '123',
        email: 'admin@test.com',
        permissions: ['bookings:view', 'bookings:edit'],
      });
    });
    
    expect(result.current.admin?.id).toBe('123');
    expect(result.current.permissions.has('bookings:view')).toBe(true);
  });
  
  it('should handle notifications', () => {
    const { result } = renderHook(() => useAdminStore());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Test notification',
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test notification');
  });
});

// Test React Query hooks
describe('Booking Queries', () => {
  it('should fetch bookings with filters', async () => {
    const wrapper = createWrapper();
    
    const { result, waitFor } = renderHook(
      () => useBookings({ filters: { status: 'confirmed' } }),
      { wrapper }
    );
    
    await waitFor(() => result.current.isSuccess);
    
    expect(result.current.data).toBeDefined();
    expect(result.current.data.items).toBeInstanceOf(Array);
  });
  
  it('should handle optimistic updates', async () => {
    const wrapper = createWrapper();
    
    const { result } = renderHook(() => useUpdateBooking(), { wrapper });
    
    act(() => {
      result.current.mutate({
        id: '123',
        data: { status: 'cancelled' },
      });
    });
    
    // Check optimistic update applied
    expect(queryClient.getQueryData(['booking', '123'])).toMatchObject({
      status: 'cancelled',
    });
  });
});
```

## Conclusion

This state management architecture provides:

1. **Clear Separation**: Global UI state (Zustand), server state (React Query), and local state (React)
2. **Type Safety**: Full TypeScript support with proper typing
3. **Performance**: Optimized re-renders, prefetching, and caching
4. **Real-time**: WebSocket integration with automatic cache updates
5. **Persistence**: URL state sync and offline support
6. **Developer Experience**: Clear patterns and testing utilities

The hybrid approach ensures each type of state is managed by the most appropriate tool, resulting in a maintainable and performant admin dashboard.