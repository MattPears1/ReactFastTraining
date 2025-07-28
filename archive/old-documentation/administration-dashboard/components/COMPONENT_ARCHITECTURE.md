# UI Component Architecture

## Overview

React component architecture for the React Fast Training administration dashboard, built with TypeScript, Tailwind CSS, and modern React patterns.

## Component Structure

```
src/admin/
├── components/          # Reusable components
│   ├── common/         # Shared UI components
│   ├── charts/         # Data visualization
│   ├── forms/          # Form components
│   ├── tables/         # Data tables
│   └── layout/         # Layout components
├── features/           # Feature-specific components
│   ├── auth/          # Authentication
│   ├── dashboard/     # Analytics dashboard
│   ├── courses/       # Course management
│   └── bookings/      # Booking management
├── hooks/             # Custom React hooks
├── contexts/          # React contexts
├── utils/             # Utility functions
└── types/             # TypeScript types
```

## Core Layout Components

### AdminLayout
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Features:
  // - Responsive sidebar navigation
  // - Header with user menu
  // - Breadcrumb navigation
  // - Loading states
  // - Error boundaries
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
```

### Sidebar Navigation
```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    label: 'Courses',
    href: '/admin/courses',
    icon: GraduationCap,
    children: [
      { label: 'All Courses', href: '/admin/courses' },
      { label: 'Create Course', href: '/admin/courses/new' },
      { label: 'Discounts', href: '/admin/courses/discounts' }
    ]
  },
  {
    label: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    badge: 5, // Pending bookings
    children: [
      { label: 'Current', href: '/admin/bookings/current' },
      { label: 'Past', href: '/admin/bookings/past' },
      { label: 'Schedule', href: '/admin/bookings/schedule' }
    ]
  }
];
```

## Common UI Components

### MetricCard
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  trend?: number[]; // Sparkline data
  loading?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  loading,
  onClick
}) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow p-6",
        onClick && "cursor-pointer hover:shadow-lg transition-shadow"
      )}
      onClick={onClick}
    >
      {loading ? (
        <Skeleton className="h-20" />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{title}</p>
              <p className="text-2xl font-semibold mt-1">{value}</p>
              {change && (
                <p className={cn(
                  "text-sm mt-1",
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                )}>
                  {change.type === 'increase' ? '↑' : '↓'} {change.value}%
                </p>
              )}
            </div>
            {icon && (
              <div className="text-primary-500">{icon}</div>
            )}
          </div>
          {trend && <Sparkline data={trend} className="mt-4" />}
        </>
      )}
    </div>
  );
};
```

### DataTable
```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
  };
  selection?: {
    selected: string[];
    onSelect: (ids: string[]) => void;
  };
  actions?: {
    label: string;
    onClick: (items: T[]) => void;
    variant?: 'primary' | 'danger';
  }[];
  onRowClick?: (row: T) => void;
}

const DataTable = <T extends { id: string }>({
  columns,
  data,
  loading,
  pagination,
  sorting,
  selection,
  actions,
  onRowClick
}: DataTableProps<T>) => {
  // Implementation with:
  // - Sortable columns
  // - Row selection
  // - Bulk actions
  // - Responsive design
  // - Loading states
  // - Empty states
};
```

### FormField
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  register?: UseFormRegister<any>;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  error,
  helpText,
  register,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          id={name}
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300",
            "focus:border-primary-500 focus:ring-primary-500",
            error && "border-red-300"
          )}
          {...register?.(name)}
          {...props}
        >
          {props.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300",
            "focus:border-primary-500 focus:ring-primary-500",
            error && "border-red-300"
          )}
          {...register?.(name)}
          {...props}
        />
      )}
      
      {helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

## Chart Components

### RevenueChart
```typescript
interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
    bookings: number;
  }[];
  period: 'day' | 'week' | 'month';
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  period, 
  height = 300 
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => formatDate(date, period)}
        />
        <YAxis yAxisId="revenue" orientation="left" />
        <YAxis yAxisId="bookings" orientation="right" />
        <Tooltip formatter={(value, name) => formatValue(value, name)} />
        <Legend />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#0EA5E9"
          name="Revenue (£)"
        />
        <Line
          yAxisId="bookings"
          type="monotone"
          dataKey="bookings"
          stroke="#10B981"
          name="Bookings"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### OccupancyChart
```typescript
interface OccupancyChartProps {
  data: {
    course: string;
    occupancy: number;
    capacity: number;
  }[];
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis dataKey="course" type="category" width={150} />
        <Tooltip />
        <Bar dataKey="occupancy" fill="#0EA5E9">
          <LabelList 
            dataKey="occupancy" 
            position="right" 
            formatter={(value) => `${value}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
```

## Feature Components

### Course Management

#### CourseForm
```typescript
interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ 
  course, 
  onSubmit, 
  onCancel 
}) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CourseFormData>({
    defaultValues: course || defaultCourseValues,
    resolver: zodResolver(courseSchema)
  });

  // Multi-step form with sections:
  // 1. Basic Information
  // 2. Pricing & Capacity
  // 3. Content & Materials
  // 4. Schedule & Availability
  // 5. Review & Submit
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField
            label="Course Name"
            name="name"
            register={register}
            error={errors.name?.message}
            required
          />
          {/* More fields... */}
        </CardBody>
      </Card>
      {/* More sections... */}
    </form>
  );
};
```

### Booking Management

#### BookingCalendar
```typescript
interface BookingCalendarProps {
  schedules: CourseSchedule[];
  view: 'month' | 'week' | 'day';
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
  onScheduleClick: (schedule: CourseSchedule) => void;
  onCreateSchedule: (date: Date) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  schedules,
  view,
  onScheduleClick,
  onCreateSchedule
}) => {
  // Features:
  // - Drag & drop rescheduling
  // - Color coding by course type
  // - Capacity indicators
  // - Quick preview on hover
  // - Conflict highlighting
  
  return (
    <Calendar
      events={schedules.map(scheduleToEvent)}
      view={view}
      onSelectSlot={({ start }) => onCreateSchedule(start)}
      onSelectEvent={onScheduleClick}
      components={{
        event: CustomEventComponent,
        toolbar: CustomToolbar
      }}
    />
  );
};
```

#### AttendeeList
```typescript
interface AttendeeListProps {
  scheduleId: number;
  onAttendeeClick: (attendee: Attendee) => void;
  onBulkAction: (action: string, attendeeIds: number[]) => void;
}

const AttendeeList: React.FC<AttendeeListProps> = ({
  scheduleId,
  onAttendeeClick,
  onBulkAction
}) => {
  const { data: attendees, loading } = useAttendees(scheduleId);
  const [selected, setSelected] = useState<number[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Attendees ({attendees?.length || 0})</h3>
        
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onBulkAction('email', selected)}
            >
              Send Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('export', selected)}
            >
              Export
            </Button>
          </div>
        )}
      </div>
      
      <DataTable
        columns={attendeeColumns}
        data={attendees || []}
        loading={loading}
        onRowClick={onAttendeeClick}
        selection={{
          selected,
          onSelect: setSelected
        }}
      />
    </div>
  );
};
```

## Custom Hooks

### useAuth
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false
    });
  };
  
  const logout = async () => {
    await authApi.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };
  
  return { ...state, login, logout };
};
```

### useDashboardData
```typescript
const useDashboardData = (period: string) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.getOverview({ period }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 60 * 1000 // 1 minute
  });
  
  return {
    data,
    error,
    isLoading,
    metrics: {
      revenue: data?.revenue || 0,
      bookings: data?.bookings || 0,
      users: data?.users || 0,
      courses: data?.courses || 0
    }
  };
};
```

### useDebounce
```typescript
const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

## Context Providers

### NotificationContext
```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationProvider: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };
  
  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification 
    }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};
```

## Utility Components

### LoadingSpinner
```typescript
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-primary-500",
        sizeClasses[size]
      )} />
    </div>
  );
};
```

### EmptyState
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load feature modules
const DashboardModule = lazy(() => import('./features/dashboard'));
const CoursesModule = lazy(() => import('./features/courses'));
const BookingsModule = lazy(() => import('./features/bookings'));

// Route-based code splitting
const AdminRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardModule />} />
        <Route path="/courses/*" element={<CoursesModule />} />
        <Route path="/bookings/*" element={<BookingsModule />} />
      </Routes>
    </Suspense>
  );
};
```

### Memoization
```typescript
// Memoize expensive calculations
const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => 
    processData(data), 
    [data]
  );
  
  return <DataVisualization data={processedData} />;
});

// Memoize callbacks
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);
  
  return <SearchInput value={query} onChange={handleSearch} />;
};
```

## Testing Strategy

### Component Testing
```typescript
// Example test for MetricCard
describe('MetricCard', () => {
  it('renders metric data correctly', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="£15,750"
        change={{ value: 10.5, type: 'increase' }}
      />
    );
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('£15,750')).toBeInTheDocument();
    expect(screen.getByText('↑ 10.5%')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(<MetricCard title="Revenue" value={0} loading />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
```

## Accessibility

### ARIA Labels
```typescript
<button
  aria-label="Delete course"
  aria-describedby="delete-warning"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>

<div role="alert" aria-live="polite">
  {error && <p>{error.message}</p>}
</div>
```

### Keyboard Navigation
```typescript
const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```