# Admin Dashboard Performance Optimization Guide

## Overview
This document outlines comprehensive performance optimization strategies for the React Fast Training admin dashboard, targeting sub-3-second load times and 60 FPS interactions even with large datasets.

## 1. Database Performance Optimization

### Query Optimization Strategies

#### Index Strategy
```sql
-- Primary indexes for admin queries
CREATE INDEX CONCURRENTLY idx_bookings_admin_list 
ON bookings(status, created_at DESC) 
INCLUDE (user_id, session_id, total_amount)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_sessions_calendar_view 
ON course_sessions(session_date, status, location) 
INCLUDE (course_type, max_capacity, instructor)
WHERE status IN ('scheduled', 'in_progress');

CREATE INDEX CONCURRENTLY idx_users_client_search 
ON users USING gin(
  to_tsvector('english', name || ' ' || email)
);

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY idx_bookings_pending_refunds 
ON bookings(created_at DESC) 
WHERE status = 'refund_pending';

CREATE INDEX CONCURRENTLY idx_sessions_upcoming 
ON course_sessions(session_date, start_time) 
WHERE session_date >= CURRENT_DATE 
AND status = 'scheduled';

-- Covering index for dashboard stats
CREATE INDEX CONCURRENTLY idx_bookings_dashboard_stats 
ON bookings(created_at, status) 
INCLUDE (total_amount, user_id)
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';
```

#### Materialized Views for Complex Aggregations
```sql
-- Dashboard statistics materialized view
CREATE MATERIALIZED VIEW mv_dashboard_daily_stats AS
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE,
    '1 day'::interval
  )::date AS date
),
daily_bookings AS (
  SELECT 
    DATE(created_at) as booking_date,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) as total_count,
    SUM(total_amount) FILTER (WHERE status = 'confirmed') as revenue,
    COUNT(DISTINCT user_id) as unique_customers
  FROM bookings
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE(created_at)
)
SELECT 
  d.date,
  COALESCE(b.confirmed_count, 0) as confirmed_bookings,
  COALESCE(b.cancelled_count, 0) as cancelled_bookings,
  COALESCE(b.total_count, 0) as total_bookings,
  COALESCE(b.revenue, 0) as daily_revenue,
  COALESCE(b.unique_customers, 0) as unique_customers,
  SUM(COALESCE(b.revenue, 0)) OVER (
    ORDER BY d.date 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as cumulative_revenue
FROM date_series d
LEFT JOIN daily_bookings b ON d.date = b.booking_date
ORDER BY d.date;

-- Create indexes on materialized view
CREATE INDEX idx_mv_dashboard_date ON mv_dashboard_daily_stats(date DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_daily_stats;
END;
$$;

-- Schedule refresh every hour
SELECT cron.schedule(
  'refresh-dashboard-stats',
  '0 * * * *',
  'SELECT refresh_dashboard_stats();'
);
```

#### Query Optimization Patterns
```typescript
// Optimized dashboard query using materialized view
export class OptimizedDashboardService {
  static async getDashboardStats(dateRange?: DateRange) {
    const pool = await getDbPool();
    
    // Use prepared statement for better performance
    const query = `
      WITH current_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE status = 'confirmed' AND created_at >= $1) as today_bookings,
          SUM(total_amount) FILTER (WHERE status = 'confirmed' AND created_at >= $1) as today_revenue,
          COUNT(*) FILTER (WHERE status = 'confirmed' AND created_at >= $2) as week_bookings,
          SUM(total_amount) FILTER (WHERE status = 'confirmed' AND created_at >= $2) as week_revenue
        FROM bookings
        WHERE created_at >= $2
      ),
      upcoming_sessions AS (
        SELECT 
          s.id,
          s.course_type,
          s.session_date,
          s.start_time,
          s.max_capacity,
          COUNT(DISTINCT ba.id) as booked_count,
          s.max_capacity - COUNT(DISTINCT ba.id) as available_spots
        FROM course_sessions s
        LEFT JOIN bookings b ON b.session_id = s.id AND b.status = 'confirmed'
        LEFT JOIN booking_attendees ba ON ba.booking_id = b.id
        WHERE s.session_date >= CURRENT_DATE
        AND s.status = 'scheduled'
        GROUP BY s.id
        ORDER BY s.session_date, s.start_time
        LIMIT 10
      ),
      historical_data AS (
        SELECT 
          date,
          confirmed_bookings,
          daily_revenue,
          cumulative_revenue
        FROM mv_dashboard_daily_stats
        WHERE date BETWEEN $3 AND $4
        ORDER BY date
      )
      SELECT 
        row_to_json(current_stats) as current,
        array_to_json(array_agg(DISTINCT upcoming_sessions)) as upcoming,
        array_to_json(array_agg(DISTINCT historical_data ORDER BY historical_data.date)) as historical
      FROM current_stats, upcoming_sessions, historical_data
      GROUP BY current_stats.*;
    `;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const result = await pool.query(query, [
      startOfDay,
      startOfWeek,
      dateRange?.start || subDays(new Date(), 30),
      dateRange?.end || new Date(),
    ]);
    
    return result.rows[0];
  }
  
  // Efficient batch loading with DataLoader pattern
  static createBookingLoader() {
    return new DataLoader<string, Booking>(
      async (bookingIds) => {
        const result = await db
          .select()
          .from(bookings)
          .where(inArray(bookings.id, bookingIds));
        
        const bookingMap = new Map(
          result.map(booking => [booking.id, booking])
        );
        
        return bookingIds.map(id => 
          bookingMap.get(id) || new Error(`Booking ${id} not found`)
        );
      },
      {
        cache: true,
        cacheKeyFn: (key) => key,
        maxBatchSize: 100,
      }
    );
  }
}
```

### Connection Pooling
```typescript
import { Pool } from 'pg';

// Optimized connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool optimization
  max: 20, // Maximum connections
  min: 5, // Minimum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast on connection
  
  // Statement optimization
  statement_timeout: 30000, // 30s statement timeout
  query_timeout: 30000,
  
  // Performance options
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const dbPool = new Pool(poolConfig);

// Monitor pool health
dbPool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

dbPool.on('connect', (client) => {
  // Set session parameters for performance
  client.query('SET work_mem = "32MB"');
  client.query('SET effective_cache_size = "4GB"');
});
```

## 2. Frontend Performance Optimization

### Code Splitting and Lazy Loading
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load admin modules
const DashboardPage = lazy(() => 
  import(/* webpackChunkName: "admin-dashboard" */ './pages/DashboardPage')
);

const BookingsPage = lazy(() => 
  import(
    /* webpackChunkName: "admin-bookings" */
    /* webpackPrefetch: true */
    './pages/BookingsPage'
  )
);

const CalendarPage = lazy(() => 
  import(
    /* webpackChunkName: "admin-calendar" */
    /* webpackPrefetch: true */
    './pages/CalendarPage'
  )
);

const ClientsPage = lazy(() => 
  import(/* webpackChunkName: "admin-clients" */ './pages/ClientsPage')
);

// Loading component with skeleton
const PageLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="grid grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded"></div>
      ))}
    </div>
    <div className="h-96 bg-gray-200 rounded"></div>
  </div>
);

export const AdminRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/bookings/*" element={<BookingsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/clients/*" element={<ClientsPage />} />
    </Routes>
  </Suspense>
);
```

### Virtual Scrolling for Large Lists
```typescript
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualBookingListProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

export const VirtualBookingList: React.FC<VirtualBookingListProps> = ({
  bookings,
  onBookingClick,
}) => {
  // Dynamic row heights based on content
  const getItemSize = (index: number) => {
    const booking = bookings[index];
    // Base height + extra height for special requirements
    return 80 + (booking.hasSpecialRequirements ? 30 : 0);
  };
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const booking = bookings[index];
    
    return (
      <div 
        style={style} 
        className="border-b hover:bg-gray-50 cursor-pointer px-4"
        onClick={() => onBookingClick(booking)}
      >
        <div className="py-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{booking.clientName}</p>
              <p className="text-sm text-gray-600">
                {booking.courseType} • {format(booking.sessionDate, 'dd MMM yyyy')}
              </p>
              {booking.hasSpecialRequirements && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Special requirements
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">£{booking.amount}</p>
              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={bookings.length}
          itemSize={getItemSize}
          width={width}
          overscanCount={5}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};
```

### Debounced Search with Abort Controller
```typescript
export const useDebounedSearch = <T>(
  searchFn: (term: string, signal: AbortSignal) => Promise<T>,
  delay = 300
) => {
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const search = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Skip empty searches
        if (!searchTerm.trim()) {
          setResults(null);
          return;
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);
        
        try {
          const result = await searchFn(
            searchTerm,
            abortControllerRef.current.signal
          );
          setResults(result);
        } catch (err) {
          if (err.name !== 'AbortError') {
            setError(err as Error);
          }
        } finally {
          setLoading(false);
        }
      }, delay),
    [searchFn, delay]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return { search, results, loading, error };
};

// Usage
const ClientSearch = () => {
  const { search, results, loading } = useDebounedSearch(
    async (term, signal) => {
      const response = await fetch(`/api/admin/clients/search?q=${term}`, {
        signal,
      });
      return response.json();
    },
    300
  );
  
  return (
    <div>
      <input
        type="search"
        onChange={(e) => search(e.target.value)}
        placeholder="Search clients..."
      />
      {loading && <Spinner />}
      {results && <ClientResults clients={results} />}
    </div>
  );
};
```

### Image Optimization
```typescript
// Lazy loading images with intersection observer
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className, placeholder }) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    if (!imageRef) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observer.observe(imageRef);
    
    return () => {
      if (imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);
  
  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};

// Optimized avatar component
export const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({
  user,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  if (user.avatarUrl) {
    return (
      <LazyImage
        src={`${user.avatarUrl}?w=${size === 'sm' ? 64 : size === 'md' ? 80 : 128}`}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23E5E7EB'/%3E%3C/svg%3E"
      />
    );
  }
  
  // Fallback to initials
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary-500 text-white flex items-center justify-center font-medium`}
    >
      {initials}
    </div>
  );
};
```

## 3. State Management Performance

### Optimized Selectors
```typescript
// Memoized selectors with shallow comparison
import { shallow } from 'zustand/shallow';

// Bad: Creates new object every render
const useStats = () => {
  const stats = useAdminStore(state => ({
    total: state.bookings.length,
    confirmed: state.bookings.filter(b => b.status === 'confirmed').length,
    revenue: state.bookings.reduce((sum, b) => sum + b.amount, 0),
  }));
  return stats;
};

// Good: Memoized selector
const selectStats = createSelector(
  [(state: AdminStore) => state.bookings],
  (bookings) => ({
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue: bookings.reduce((sum, b) => sum + b.amount, 0),
  })
);

const useStats = () => useAdminStore(selectStats);

// Even better: Granular subscriptions
const useTotalBookings = () => 
  useAdminStore(state => state.bookings.length);

const useConfirmedBookings = () =>
  useAdminStore(state => 
    state.bookings.filter(b => b.status === 'confirmed').length
  );

const useRevenue = () =>
  useAdminStore(state =>
    state.bookings.reduce((sum, b) => sum + b.amount, 0)
  );
```

### React Query Performance Config
```typescript
// Optimized query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Longer cache for stable data
      cacheTime: 30 * 60 * 1000, // 30 minutes
      
      // Stale time based on data type
      staleTime: (context) => {
        const key = context.queryKey[0];
        const staleTimeMap: Record<string, number> = {
          'dashboard-stats': 30 * 1000, // 30 seconds
          'bookings': 60 * 1000, // 1 minute
          'clients': 5 * 60 * 1000, // 5 minutes
          'sessions': 2 * 60 * 1000, // 2 minutes
        };
        return staleTimeMap[key as string] || 60 * 1000;
      },
      
      // Smart refetch
      refetchOnWindowFocus: (query) => {
        // Only refetch if data is stale
        return query.state.dataUpdateCount === 0;
      },
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      
      // Suspense mode for better UX
      suspense: false,
      useErrorBoundary: false,
    },
  },
});

// Prefetch on hover
export const usePrefetchOnHover = () => {
  const queryClient = useQueryClient();
  
  const prefetchBooking = useCallback(
    (bookingId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => api.getBooking(bookingId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
  
  return { prefetchBooking };
};
```

## 4. Network Optimization

### Request Batching
```typescript
class BatchedApiClient {
  private batchQueue: Map<string, {
    resolver: (value: any) => void;
    rejecter: (error: any) => void;
  }[]> = new Map();
  
  private batchTimer: NodeJS.Timeout | null = null;
  private batchDelay = 10; // 10ms delay for batching
  
  async getBooking(id: string): Promise<Booking> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has('bookings')) {
        this.batchQueue.set('bookings', []);
      }
      
      this.batchQueue.get('bookings')!.push({
        resolver: (bookings: Booking[]) => {
          const booking = bookings.find(b => b.id === id);
          if (booking) {
            resolve(booking);
          } else {
            reject(new Error(`Booking ${id} not found`));
          }
        },
        rejecter: reject,
      });
      
      this.scheduleBatch();
    });
  }
  
  private scheduleBatch() {
    if (this.batchTimer) return;
    
    this.batchTimer = setTimeout(() => {
      this.executeBatch();
      this.batchTimer = null;
    }, this.batchDelay);
  }
  
  private async executeBatch() {
    const bookingResolvers = this.batchQueue.get('bookings') || [];
    if (bookingResolvers.length === 0) return;
    
    this.batchQueue.delete('bookings');
    
    try {
      const bookingIds = bookingResolvers.map((_, index) => 
        // Extract ID from resolver context
        `booking-${index}`
      );
      
      const response = await fetch('/api/admin/bookings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bookingIds }),
      });
      
      const bookings = await response.json();
      
      bookingResolvers.forEach(({ resolver }) => {
        resolver(bookings);
      });
    } catch (error) {
      bookingResolvers.forEach(({ rejecter }) => {
        rejecter(error);
      });
    }
  }
}
```

### Compression and Caching Headers
```typescript
// Server-side compression and caching
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

// Enable compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression
}));

// Smart caching middleware
const cacheMiddleware = (duration: number, varyBy?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for mutations
    if (req.method !== 'GET') {
      return next();
    }
    
    // Set cache headers
    res.setHeader('Cache-Control', `private, max-age=${duration}`);
    
    // Add ETag support
    res.setHeader('ETag', `"${generateETag(req)}"`)
    
    // Vary header for proper caching
    if (varyBy) {
      res.setHeader('Vary', varyBy.join(', '));
    }
    
    // Check If-None-Match
    const etag = req.headers['if-none-match'];
    if (etag && etag === res.getHeader('ETag')) {
      return res.status(304).end();
    }
    
    next();
  };
};

// Apply to routes
app.get('/api/admin/dashboard/stats', 
  cacheMiddleware(30, ['Authorization']), 
  dashboardController.getStats
);
```

## 5. Memory Management

### Component Memory Leaks Prevention
```typescript
// Custom hook for safe async operations
export const useSafeAsync = <T>() => {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController>();
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const execute = useCallback(
    async (asyncFunction: (signal: AbortSignal) => Promise<T>) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new controller
      abortControllerRef.current = new AbortController();
      
      try {
        const result = await asyncFunction(abortControllerRef.current.signal);
        
        if (isMountedRef.current) {
          return result;
        }
        throw new Error('Component unmounted');
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        throw error;
      }
    },
    []
  );
  
  return { execute, isMounted: () => isMountedRef.current };
};

// Usage
const BookingDetails = ({ bookingId }: { bookingId: string }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const { execute } = useSafeAsync<Booking>();
  
  useEffect(() => {
    execute(async (signal) => {
      const response = await fetch(`/api/bookings/${bookingId}`, { signal });
      return response.json();
    })
      .then(setBooking)
      .catch((error) => {
        if (error.message !== 'Component unmounted') {
          console.error('Failed to load booking:', error);
        }
      });
  }, [bookingId, execute]);
  
  return booking ? <BookingInfo booking={booking} /> : <Loading />;
};
```

### Large List Memory Optimization
```typescript
// Windowing with cleanup
export const OptimizedBookingList = ({ bookings }: { bookings: Booking[] }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = throttle(() => {
      const { scrollTop, clientHeight } = container;
      const itemHeight = 80; // Approximate height
      
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(clientHeight / itemHeight);
      const end = start + visibleCount + 10; // Buffer
      
      setVisibleRange({ start: Math.max(0, start - 10), end });
    }, 100);
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, []);
  
  const visibleBookings = bookings.slice(visibleRange.start, visibleRange.end);
  const spacerHeight = visibleRange.start * 80;
  
  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div style={{ height: spacerHeight }} />
      {visibleBookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} />
      ))}
      <div style={{ height: (bookings.length - visibleRange.end) * 80 }} />
    </div>
  );
};
```

## 6. Bundle Size Optimization

### Webpack Configuration
```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info'],
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // Separate heavy libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: 'charts',
          priority: 15,
        },
      },
    },
  },
  
  plugins: [
    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Brotli compression
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
      filename: '[path][base].br',
    }),
    
    // Bundle analysis
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
};
```

### Tree Shaking and Dynamic Imports
```typescript
// Import only what you need
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
// Instead of: import * as dateFns from 'date-fns';

// Dynamic import for heavy components
const HeavyChartComponent = lazy(() =>
  import(
    /* webpackChunkName: "charts" */
    /* webpackPreload: true */
    './components/HeavyChartComponent'
  ).then(module => ({
    default: module.HeavyChartComponent
  }))
);

// Conditional loading
const loadPdfLibrary = async () => {
  const { PDFDocument } = await import(
    /* webpackChunkName: "pdf-lib" */
    'pdf-lib'
  );
  return PDFDocument;
};
```

## 7. Performance Monitoring

### Custom Performance Monitoring
```typescript
// Performance monitoring service
class PerformanceMonitor {
  private metrics: Map<string, PerformanceEntry[]> = new Map();
  
  measureComponent(componentName: string) {
    return {
      start: () => performance.mark(`${componentName}-start`),
      end: () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          componentName,
          `${componentName}-start`,
          `${componentName}-end`
        );
        
        const measure = performance.getEntriesByName(componentName)[0];
        this.recordMetric(componentName, measure);
      },
    };
  }
  
  measureApiCall(endpoint: string) {
    const startTime = performance.now();
    
    return {
      end: (success: boolean) => {
        const duration = performance.now() - startTime;
        this.recordMetric(`api-${endpoint}`, {
          name: endpoint,
          duration,
          success,
          timestamp: Date.now(),
        } as any);
      },
    };
  }
  
  private recordMetric(category: string, entry: PerformanceEntry) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    const entries = this.metrics.get(category)!;
    entries.push(entry);
    
    // Keep only last 100 entries
    if (entries.length > 100) {
      entries.shift();
    }
    
    // Send to analytics if threshold exceeded
    if (entry.duration > 1000) {
      this.reportSlowOperation(category, entry);
    }
  }
  
  getReport() {
    const report: any = {};
    
    this.metrics.forEach((entries, category) => {
      const durations = entries.map(e => e.duration);
      report[category] = {
        count: entries.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        p95: this.percentile(durations, 0.95),
      };
    });
    
    return report;
  }
  
  private percentile(values: number[], p: number) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

export const perfMonitor = new PerformanceMonitor();

// Usage in components
const DashboardPage = () => {
  useEffect(() => {
    const measure = perfMonitor.measureComponent('DashboardPage');
    measure.start();
    
    return () => {
      measure.end();
    };
  }, []);
  
  return <Dashboard />;
};
```

## 8. Critical Rendering Path Optimization

### Server-Side Rendering for Initial Load
```typescript
// Critical CSS extraction
import { renderToString } from 'react-dom/server';
import { extractCritical } from '@emotion/server';

export const renderAdminApp = (req: Request) => {
  const app = (
    <StaticRouter location={req.url}>
      <AdminApp />
    </StaticRouter>
  );
  
  const { html, css, ids } = extractCritical(renderToString(app));
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>${css}</style>
        <link rel="preconnect" href="https://api.reactfasttraining.co.uk" />
        <link rel="dns-prefetch" href="https://api.reactfasttraining.co.uk" />
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__EMOTION_IDS__ = ${JSON.stringify(ids)};
        </script>
        <script src="/admin.bundle.js" defer></script>
      </body>
    </html>
  `;
};
```

### Resource Hints
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/api/admin/dashboard/stats" as="fetch" crossorigin="use-credentials">

<!-- Prefetch next likely navigation -->
<link rel="prefetch" href="/admin/bookings">
<link rel="prefetch" href="/admin/calendar">

<!-- Preconnect to external services -->
<link rel="preconnect" href="https://api.reactfasttraining.co.uk">
<link rel="preconnect" href="wss://admin.reactfasttraining.co.uk">
```

## Performance Checklist

### Database
- [ ] Indexes on all foreign keys and commonly queried fields
- [ ] Materialized views for complex aggregations
- [ ] Connection pooling configured optimally
- [ ] Query execution plans analyzed
- [ ] N+1 queries eliminated

### Frontend
- [ ] Code splitting implemented
- [ ] Virtual scrolling for large lists
- [ ] Images lazy loaded
- [ ] Debounced search inputs
- [ ] Memory leaks prevented

### Network
- [ ] API responses compressed
- [ ] Appropriate cache headers set
- [ ] Request batching implemented
- [ ] CDN configured for static assets
- [ ] HTTP/2 enabled

### Bundle
- [ ] Tree shaking configured
- [ ] Dynamic imports used
- [ ] Bundle size < 200KB initial
- [ ] Compression enabled
- [ ] Source maps generated

### Monitoring
- [ ] Performance metrics tracked
- [ ] Error boundaries implemented
- [ ] Slow operations logged
- [ ] User timing API used
- [ ] Real user monitoring setup

## Conclusion

These optimizations should result in:
- Initial page load < 3 seconds
- Time to interactive < 5 seconds
- Smooth 60 FPS scrolling
- API response times < 200ms
- Dashboard refresh < 1 second

Regular performance audits and monitoring will ensure these targets are maintained as the application grows.