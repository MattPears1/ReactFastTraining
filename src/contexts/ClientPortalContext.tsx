import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clientPortalService } from '@/services/client';
import type { UserStats, NextCourse, UpcomingCourse } from '@/types/client/portal.types';
import { isUserStats, isNextCourse, isUpcomingCourse, ClientPortalError } from '@/types/client/enhanced.types';

interface ClientPortalContextValue {
  // Data
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  stats: UserStats | null;
  nextCourse: NextCourse | null;
  upcomingCourses: UpcomingCourse[];
  
  // State
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshData: () => Promise<void>;
  updateStats: (stats: Partial<UserStats>) => void;
  removeUpcomingCourse: (bookingId: string) => void;
  clearCache: () => void;
}

const ClientPortalContext = createContext<ClientPortalContextValue | undefined>(undefined);

// Cache management
const CACHE_KEY = 'client-portal-data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  stats: UserStats | null;
  nextCourse: NextCourse | null;
  upcomingCourses: UpcomingCourse[];
  timestamp: number;
}

export const ClientPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [nextCourse, setNextCourse] = useState<NextCourse | null>(null);
  const [upcomingCourses, setUpcomingCourses] = useState<UpcomingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const data: CachedData = JSON.parse(cached);
          if (Date.now() - data.timestamp < CACHE_DURATION) {
            setStats(data.stats);
            setNextCourse(data.nextCourse);
            setUpcomingCourses(data.upcomingCourses);
            setLastUpdated(new Date(data.timestamp));
            setLoading(false);
            return true;
          }
        }
      } catch (err) {
        console.error('Failed to load from cache:', err);
      }
      return false;
    };

    if (user) {
      const hasCache = loadFromCache();
      if (!hasCache) {
        refreshData();
      }
    }
  }, [user]);

  const saveToCache = useCallback((data: Omit<CachedData, 'timestamp'>) => {
    try {
      const cacheData: CachedData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Failed to save to cache:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dashboardData = await clientPortalService.getDashboard();
      
      // Validate received data
      if (!dashboardData || typeof dashboardData !== 'object') {
        throw new ClientPortalError('Invalid dashboard data format');
      }
      
      // Validate stats
      if (dashboardData.stats && !isUserStats(dashboardData.stats)) {
        throw new ClientPortalError('Invalid user stats format');
      }
      
      // Validate upcoming courses
      if (dashboardData.upcomingCourses) {
        if (!Array.isArray(dashboardData.upcomingCourses)) {
          throw new ClientPortalError('Upcoming courses must be an array');
        }
        if (!dashboardData.upcomingCourses.every(isUpcomingCourse)) {
          throw new ClientPortalError('Invalid upcoming course format');
        }
      }
      
      // Validate next course
      if (dashboardData.nextCourse && !isNextCourse(dashboardData.nextCourse)) {
        throw new ClientPortalError('Invalid next course format');
      }
      
      setStats(dashboardData.stats || null);
      setNextCourse(dashboardData.nextCourse || null);
      setUpcomingCourses(dashboardData.upcomingCourses || []);
      setLastUpdated(new Date());
      
      // Save to cache
      saveToCache({
        stats: dashboardData.stats || null,
        nextCourse: dashboardData.nextCourse || null,
        upcomingCourses: dashboardData.upcomingCourses || [],
      });
    } catch (err) {
      const error = err instanceof Error ? err : new ClientPortalError('Failed to load portal data');
      setError(error);
      console.error('Client portal data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, saveToCache]);

  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setStats(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const removeUpcomingCourse = useCallback((bookingId: string) => {
    setUpcomingCourses(prev => prev.filter(course => course.booking.id !== bookingId));
    
    // Check if removed course was the next course
    if (nextCourse?.booking.id === bookingId) {
      // Find the new next course
      const newNext = upcomingCourses
        .filter(c => c.booking.id !== bookingId)
        .sort((a, b) => new Date(a.session.sessionDate).getTime() - new Date(b.session.sessionDate).getTime())[0];
      
      if (newNext) {
        // Convert to NextCourse format
        const now = new Date();
        const courseDate = new Date(newNext.session.sessionDate);
        const daysUntil = Math.ceil((courseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        setNextCourse({
          ...newNext,
          daysUntil,
          isToday: daysUntil === 0,
          isTomorrow: daysUntil === 1,
          isThisWeek: daysUntil <= 7,
          preMaterials: false, // Would need to fetch this
        });
      } else {
        setNextCourse(null);
      }
    }
  }, [nextCourse, upcomingCourses]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setLastUpdated(null);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, refreshData]);

  const value: ClientPortalContextValue = {
    user,
    stats,
    nextCourse,
    upcomingCourses,
    loading,
    error,
    lastUpdated,
    refreshData,
    updateStats,
    removeUpcomingCourse,
    clearCache,
  };

  return (
    <ClientPortalContext.Provider value={value}>
      {children}
    </ClientPortalContext.Provider>
  );
};

export const useClientPortal = () => {
  const context = useContext(ClientPortalContext);
  if (!context) {
    throw new Error('useClientPortal must be used within ClientPortalProvider');
  }
  return context;
};