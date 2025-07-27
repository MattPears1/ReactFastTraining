# Admin Dashboard Comprehensive Enhancement Plan

## Executive Summary

This enhancement plan identifies critical improvements across 10 key areas of the admin dashboard implementation. The analysis reveals opportunities for significant improvements in security, performance, code quality, and user experience.

## 1. Code Quality and Architecture Improvements

### Current Issues
- **Type Safety**: Multiple `any` types in interfaces (e.g., `upcomingSessions: any[]` in DashboardData)
- **Component Coupling**: StatCard is defined within AdminDashboardPage instead of being a separate component
- **Magic Numbers**: Hardcoded values (30-second refresh, date calculations)
- **Error Handling**: Basic error handling without retry mechanisms or detailed error states

### Recommendations

#### 1.1 Enhance Type Safety
```typescript
// Replace all 'any' types with proper interfaces
interface UpcomingSession {
  id: string;
  courseType: CourseType;
  sessionDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  instructor: string;
  bookings: number;
  capacity: number;
  status: SessionStatus;
}

interface ActivityLogEntry {
  id: string;
  type: 'new_booking' | 'cancellation' | 'update' | 'refund' | 'session_change';
  booking?: Booking;
  session?: CourseSession;
  user: User;
  adminUser?: AdminUser;
  timestamp: Date;
  details: Record<string, unknown>;
}
```

#### 1.2 Extract Reusable Components
- Move StatCard to `src/components/admin/shared/components/StatCard/`
- Create dedicated components for dashboard sections
- Implement a proper component library structure

#### 1.3 Configuration Management
```typescript
// src/config/admin.config.ts
export const ADMIN_CONFIG = {
  REFRESH_INTERVALS: {
    DASHBOARD: 30_000, // 30 seconds
    BOOKINGS: 60_000,  // 1 minute
    CLIENTS: 300_000,  // 5 minutes
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    MAX_PAGE_SIZE: 100,
    SIZES: [10, 25, 50, 100],
  },
  DATE_RANGES: {
    DEFAULT_DAYS: 30,
    OPTIONS: [7, 30, 90, 180, 365],
  },
} as const;
```

## 2. Performance Optimizations

### Current Issues
- No memoization of expensive calculations
- Unnecessary re-renders on data updates
- Missing lazy loading for heavy components
- No virtualization for long lists

### Recommendations

#### 2.1 Implement React.memo and useMemo
```typescript
// Memoize expensive calculations
const weeklyRevenueChange = useMemo(() => {
  if (!stats?.week.revenue || !stats?.month.revenue) return 0;
  return ((stats.week.revenue / (stats.month.revenue / 4)) - 1) * 100;
}, [stats?.week.revenue, stats?.month.revenue]);

// Memoize component renders
const MemoizedStatCard = React.memo(StatCard, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.change === nextProps.change;
});
```

#### 2.2 Implement Virtual Scrolling
```typescript
// For large lists (bookings, clients)
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const VirtualizedBookingList: React.FC<{ bookings: Booking[] }> = ({ bookings }) => (
  <AutoSizer>
    {({ height, width }) => (
      <VariableSizeList
        height={height}
        itemCount={bookings.length}
        itemSize={() => 80} // Can be dynamic based on content
        width={width}
        overscanCount={5}
      >
        {({ index, style }) => (
          <BookingRow booking={bookings[index]} style={style} />
        )}
      </VariableSizeList>
    )}
  </AutoSizer>
);
```

#### 2.3 Optimize Bundle Size
```typescript
// Lazy load heavy components
const RevenueChart = lazy(() => 
  import(/* webpackChunkName: "admin-charts" */ '@components/admin/features/dashboard/components/RevenueChart')
);

// Lazy load chart libraries
const loadChartLibrary = () => import('recharts');
```

## 3. Security Enhancements

### Current Issues
- Basic authentication check without token validation
- No CSRF protection visible
- Missing rate limiting
- No input sanitization
- Session management could be improved

### Recommendations

#### 3.1 Enhanced Authentication Middleware
```typescript
// src/middleware/adminAuth.ts
export const adminAuthMiddleware = {
  validateToken: async (token: string): Promise<AdminUser | null> => {
    try {
      const decoded = await verifyJWT(token);
      
      // Check token expiration
      if (decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }
      
      // Validate against database
      const admin = await adminService.findById(decoded.id);
      if (!admin || !admin.isActive) {
        throw new Error('Invalid admin');
      }
      
      // Check IP whitelist if configured
      if (admin.ipWhitelist?.length) {
        const currentIP = getClientIP();
        if (!admin.ipWhitelist.includes(currentIP)) {
          await auditLog.logSecurityEvent('ip_mismatch', admin.id, currentIP);
          throw new Error('IP not authorized');
        }
      }
      
      return admin;
    } catch (error) {
      return null;
    }
  },
  
  refreshToken: async (refreshToken: string): Promise<TokenPair | null> => {
    // Implement refresh token rotation
  },
};
```

#### 3.2 CSRF Protection
```typescript
// Add CSRF token to all admin requests
const useCSRFToken = () => {
  const [csrfToken, setCSRFToken] = useState<string>('');
  
  useEffect(() => {
    const fetchCSRFToken = async () => {
      const response = await fetch('/api/admin/csrf-token', {
        credentials: 'include',
      });
      const { token } = await response.json();
      setCSRFToken(token);
    };
    
    fetchCSRFToken();
  }, []);
  
  return csrfToken;
};

// Include in API client
apiClient.interceptors.request.use((config) => {
  config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});
```

#### 3.3 Rate Limiting
```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>();
  private limits = {
    'dashboard:stats': { max: 120, window: 60000 }, // 120 per minute
    'bookings:list': { max: 60, window: 60000 },
    'default': { max: 300, window: 60000 },
  };
  
  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const limit = this.limits[endpoint] || this.limits.default;
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < limit.window);
    
    if (validRequests.length >= limit.max) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }
}
```

## 4. UX/UI Refinements

### Current Issues
- No keyboard navigation support
- Missing loading states for individual components
- No empty states
- Limited mobile responsiveness
- No dark mode consistency

### Recommendations

#### 4.1 Keyboard Navigation
```typescript
// Add keyboard navigation to admin layout
const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
      
      // Cmd/Ctrl + B for bookings
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        navigate('/admin/bookings');
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        closeActiveModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
};
```

#### 4.2 Enhanced Loading States
```typescript
// Component-level loading states
const DashboardMetric: React.FC<{ metric: string }> = ({ metric }) => {
  const { data, isLoading, error } = useMetric(metric);
  
  if (isLoading) {
    return <MetricSkeleton />;
  }
  
  if (error) {
    return <MetricError error={error} onRetry={refetch} />;
  }
  
  return <MetricDisplay data={data} />;
};

// Skeleton components
const MetricSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-32"></div>
  </div>
);
```

#### 4.3 Empty States
```typescript
const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12">
    <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        {action.label}
      </button>
    )}
  </div>
);
```

## 5. Missing Features or Edge Cases

### Current Issues
- No bulk operations UI
- Missing export functionality
- No advanced filtering
- No saved views/filters
- Missing notification system

### Recommendations

#### 5.1 Bulk Operations
```typescript
interface BulkOperationsProps<T> {
  selectedItems: T[];
  onAction: (action: string, items: T[]) => Promise<void>;
  actions: BulkAction[];
}

const BulkOperationsBar: React.FC<BulkOperationsProps<Booking>> = ({
  selectedItems,
  onAction,
  actions,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} ${selectedItems.length} items?`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onAction(action, selectedItems);
      toast.success(`Successfully ${action}ed ${selectedItems.length} items`);
    } catch (error) {
      toast.error(`Failed to ${action} items`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="bg-primary-50 border-b border-primary-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedItems.length} items selected
        </span>
        <div className="flex gap-2">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isProcessing || !action.enabled(selectedItems)}
              className="px-3 py-1 text-sm bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### 5.2 Advanced Filtering System
```typescript
interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  operators?: string[];
}

const AdvancedFilters: React.FC<{
  filters: FilterConfig[];
  onChange: (filters: AppliedFilter[]) => void;
}> = ({ filters, onChange }) => {
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  
  const addFilter = (filter: AppliedFilter) => {
    const updated = [...appliedFilters, filter];
    setAppliedFilters(updated);
    onChange(updated);
  };
  
  const removeFilter = (index: number) => {
    const updated = appliedFilters.filter((_, i) => i !== index);
    setAppliedFilters(updated);
    onChange(updated);
  };
  
  return (
    <div className="space-y-2">
      {appliedFilters.map((filter, index) => (
        <FilterRow
          key={index}
          filter={filter}
          onRemove={() => removeFilter(index)}
        />
      ))}
      <AddFilterButton filters={filters} onAdd={addFilter} />
    </div>
  );
};
```

## 6. Error Handling Improvements

### Current Issues
- Generic error messages
- No error boundaries
- Missing retry logic
- No offline handling

### Recommendations

#### 6.1 Error Boundaries
```typescript
class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    errorTracker.logError(error, {
      component: 'AdminDashboard',
      errorInfo,
      user: getCurrentAdmin(),
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

#### 6.2 Intelligent Retry Logic
```typescript
const useRetryableQuery = <T>(
  queryFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: (attempt: number) => number;
    shouldRetry?: (error: Error) => boolean;
  }
) => {
  const {
    maxRetries = 3,
    retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    shouldRetry = (error) => error.message.includes('network'),
  } = options || {};
  
  return useQuery({
    queryFn,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false;
      return shouldRetry(error as Error);
    },
    retryDelay,
  });
};
```

## 7. Accessibility Enhancements

### Current Issues
- Missing ARIA labels
- No focus management
- Color contrast issues
- No screen reader announcements

### Recommendations

#### 7.1 ARIA Implementation
```typescript
// Enhanced StatCard with accessibility
const AccessibleStatCard: React.FC<StatCardProps> = (props) => {
  const trendDescription = props.trend === 'up' 
    ? 'increasing' 
    : props.trend === 'down' 
    ? 'decreasing' 
    : 'stable';
    
  return (
    <div
      role="article"
      aria-label={`${props.title}: ${props.value}`}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow p-6 focus:outline-none focus:ring-2 focus:ring-primary-500",
        props.alert && "ring-2 ring-red-500"
      )}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {props.title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {props.value}
          </p>
          {props.change && (
            <p 
              className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1"
              aria-label={`Change: ${props.change}, ${trendDescription}`}
            >
              {/* Trend icon */}
              <span className="sr-only">{trendDescription}</span>
              {props.change}
            </p>
          )}
        </div>
        <div 
          className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorClasses[props.color])}
          aria-hidden="true"
        >
          <props.icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
```

#### 7.2 Focus Management
```typescript
const useFocusManagement = () => {
  const previousFocus = useRef<HTMLElement | null>(null);
  
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstFocusable?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  };
  
  const saveFocus = () => {
    previousFocus.current = document.activeElement as HTMLElement;
  };
  
  const restoreFocus = () => {
    previousFocus.current?.focus();
  };
  
  return { trapFocus, saveFocus, restoreFocus };
};
```

## 8. State Management Optimization

### Current Issues
- No global state management
- Prop drilling in nested components
- Inefficient data fetching patterns
- Missing optimistic updates

### Recommendations

#### 8.1 Implement Zustand for Admin State
```typescript
// src/stores/adminStore.ts
interface AdminStore {
  // Auth
  admin: AdminUser | null;
  permissions: Permission[];
  sessionExpiry: Date | null;
  
  // UI State
  sidebarCollapsed: boolean;
  activeFilters: Record<string, any>;
  selectedItems: Record<string, string[]>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  setAdmin: (admin: AdminUser | null) => void;
  toggleSidebar: () => void;
  setFilters: (module: string, filters: any) => void;
  selectItems: (module: string, ids: string[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  
  // Computed
  hasPermission: (permission: string) => boolean;
  getSelectedItems: (module: string) => string[];
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  admin: null,
  permissions: [],
  sessionExpiry: null,
  sidebarCollapsed: false,
  activeFilters: {},
  selectedItems: {},
  notifications: [],
  unreadCount: 0,
  
  // Actions
  setAdmin: (admin) => set({ 
    admin, 
    permissions: admin?.permissions || [],
    sessionExpiry: admin ? new Date(Date.now() + 30 * 60 * 1000) : null,
  }),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  setFilters: (module, filters) => set((state) => ({
    activeFilters: { ...state.activeFilters, [module]: filters }
  })),
  
  selectItems: (module, ids) => set((state) => ({
    selectedItems: { ...state.selectedItems, [module]: ids }
  })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  // Computed
  hasPermission: (permission) => {
    const { admin, permissions } = get();
    if (!admin) return false;
    if (admin.role === 'superadmin') return true;
    return permissions.some(p => p === permission || p === '*');
  },
  
  getSelectedItems: (module) => get().selectedItems[module] || [],
}));
```

#### 8.2 Optimistic Updates with React Query
```typescript
const useOptimisticBookingUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminDashboardApi.updateBookingStatus,
    
    onMutate: async ({ bookingId, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['admin', 'bookings']);
      
      // Snapshot previous value
      const previousBookings = queryClient.getQueryData(['admin', 'bookings']);
      
      // Optimistically update
      queryClient.setQueryData(['admin', 'bookings'], (old: any) => {
        return {
          ...old,
          bookings: old.bookings.map((b: Booking) =>
            b.id === bookingId ? { ...b, status } : b
          ),
        };
      });
      
      // Update individual booking
      queryClient.setQueryData(['admin', 'booking', bookingId], (old: any) => ({
        ...old,
        status,
      }));
      
      return { previousBookings };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBookings) {
        queryClient.setQueryData(['admin', 'bookings'], context.previousBookings);
      }
    },
    
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['admin', 'bookings']);
      queryClient.invalidateQueries(['admin', 'dashboard', 'stats']);
    },
  });
};
```

## 9. Component Reusability

### Current Issues
- Components tightly coupled to admin context
- Missing component documentation
- No Storybook setup
- Inconsistent prop interfaces

### Recommendations

#### 9.1 Create Admin Component Library
```typescript
// src/components/admin/shared/index.ts
export { DataTable } from './components/DataTable';
export { StatCard } from './components/StatCard';
export { ActionMenu } from './components/ActionMenu';
export { BulkActions } from './components/BulkActions';
export { ExportButton } from './components/ExportButton';
export { DateRangePicker } from './components/DateRangePicker';
export { SearchInput } from './components/SearchInput';
export { EmptyState } from './components/EmptyState';
export { ErrorState } from './components/ErrorState';
export { LoadingState } from './components/LoadingState';

// Hooks
export { useAdminAuth } from './hooks/useAdminAuth';
export { useAuditLog } from './hooks/useAuditLog';
export { useBulkOperation } from './hooks/useBulkOperation';
export { useExport } from './hooks/useExport';
export { useRealtime } from './hooks/useRealtime';
```

#### 9.2 Generic DataTable Component
```typescript
interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDefinition<T>[];
  keyExtractor: (item: T) => string;
  
  // Features
  selectable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  
  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  
  // Actions
  actions?: {
    bulk?: BulkAction<T>[];
    row?: RowAction<T>[];
  };
  
  // Events
  onSelect?: (selected: T[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Filter[]) => void;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;
  
  // Customization
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  className?: string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  sortable = true,
  // ... other props
}: DataTableProps<T>) => {
  // Implementation with all features
};
```

## 10. Testing Readiness

### Current Issues
- No test files for admin components
- Missing test utilities
- No E2E tests for admin flows
- No performance benchmarks

### Recommendations

#### 10.1 Unit Test Setup
```typescript
// src/components/admin/__tests__/AdminDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboardPage } from '../pages/DashboardPage';
import { mockAdminUser, mockDashboardStats } from '../__mocks__/adminData';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should display loading state initially', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });
  
  it('should load and display dashboard stats', async () => {
    mockAdminDashboardApi.getDashboardStats.mockResolvedValue(mockDashboardStats);
    
    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Today's Bookings")).toBeInTheDocument();
      expect(screen.getByText(mockDashboardStats.today.count.toString())).toBeInTheDocument();
    });
  });
  
  it('should handle errors gracefully', async () => {
    mockAdminDashboardApi.getDashboardStats.mockRejectedValue(new Error('Network error'));
    
    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    // Test retry
    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);
    
    expect(mockAdminDashboardApi.getDashboardStats).toHaveBeenCalledTimes(2);
  });
});
```

#### 10.2 E2E Test Scenarios
```typescript
// e2e/admin-dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
  });
  
  test('should display real-time updates', async ({ page }) => {
    // Initial state
    const bookingCount = await page.textContent('[data-testid="today-bookings"]');
    
    // Simulate new booking via API
    await createTestBooking();
    
    // Wait for real-time update
    await expect(page.locator('[data-testid="today-bookings"]')).not.toHaveText(bookingCount);
  });
  
  test('should handle session rescheduling', async ({ page }) => {
    await page.goto('/admin/calendar');
    
    // Find a session
    const session = page.locator('[data-testid="session-card"]').first();
    
    // Drag and drop to new time
    await session.dragTo(page.locator('[data-testid="calendar-slot-14:00"]'));
    
    // Confirm dialog
    await page.click('text=Confirm Reschedule');
    
    // Verify success
    await expect(page.locator('[data-testid="toast"]')).toContainText('Session rescheduled successfully');
  });
});
```

## Implementation Priority

### Phase 1 - Critical (Week 1)
1. **Security Enhancements** - Token validation, CSRF, rate limiting
2. **Type Safety** - Replace all `any` types
3. **Error Boundaries** - Prevent crashes
4. **Performance** - Memoization and lazy loading

### Phase 2 - High Priority (Week 2)
1. **State Management** - Implement Zustand
2. **Component Library** - Extract reusable components
3. **Accessibility** - ARIA labels and keyboard navigation
4. **Error Handling** - Retry logic and better messages

### Phase 3 - Important (Week 3)
1. **Advanced Features** - Bulk operations, filtering
2. **Real-time Updates** - WebSocket optimization
3. **Testing** - Unit and integration tests
4. **Mobile Optimization** - Responsive improvements

### Phase 4 - Enhancement (Week 4)
1. **UI Polish** - Animations, transitions
2. **Export Features** - Multiple formats
3. **Saved Views** - User preferences
4. **Performance Monitoring** - Metrics and alerts

## Success Metrics

1. **Performance**
   - Initial load time < 2s
   - Time to interactive < 3s
   - 60fps scrolling performance
   - API response time < 200ms

2. **Security**
   - Zero authentication bypasses
   - All actions audited
   - CSRF protection on all mutations
   - Rate limiting prevents abuse

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigable
   - Screen reader compatible
   - Focus indicators visible

4. **Code Quality**
   - 100% TypeScript coverage
   - 80%+ test coverage
   - No ESLint errors
   - Bundle size < 300KB

5. **User Experience**
   - Task completion rate > 95%
   - Error rate < 1%
   - User satisfaction > 4.5/5
   - Support tickets < 5/month

## Conclusion

This enhancement plan addresses critical gaps in the current admin dashboard implementation. By following this roadmap, React Fast Training will have a secure, performant, and user-friendly admin system that scales with business growth. The phased approach ensures that critical issues are addressed first while building towards a comprehensive solution.