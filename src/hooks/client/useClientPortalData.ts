import { useCallback, useEffect, useState } from 'react';
import { clientPortalService } from '@/services/client';
import type { UserStats, NextCourse, UpcomingCourse } from '@/types/client/portal.types';
import { isUserStats, isUpcomingCourse, isNextCourse, ClientPortalError, NetworkError } from '@/types/client/enhanced.types';

interface ClientPortalData {
  stats: UserStats | null;
  nextCourse: NextCourse | null;
  upcomingCourses: UpcomingCourse[];
}

interface UseClientPortalDataReturn extends ClientPortalData {
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateData: (data: Partial<ClientPortalData>) => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useClientPortalData = (): UseClientPortalDataReturn => {
  const [data, setData] = useState<ClientPortalData>({
    stats: null,
    nextCourse: null,
    upcomingCourses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    const cacheKey = 'client-portal-dashboard';
    const cached = cache.get(cacheKey);
    
    // Check cache first
    if (!bypassCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const dashboardData = await clientPortalService.getDashboard();
      
      // Validate response data
      if (!dashboardData || typeof dashboardData !== 'object') {
        throw new ClientPortalError('Invalid dashboard data received');
      }
      
      // Validate stats
      if (dashboardData.stats && !isUserStats(dashboardData.stats)) {
        throw new ClientPortalError('Invalid user stats data format');
      }
      
      // Validate upcoming courses
      if (dashboardData.upcomingCourses) {
        if (!Array.isArray(dashboardData.upcomingCourses)) {
          throw new ClientPortalError('Upcoming courses must be an array');
        }
        if (!dashboardData.upcomingCourses.every(isUpcomingCourse)) {
          throw new ClientPortalError('Invalid upcoming course data format');
        }
      }
      
      // Validate next course
      if (dashboardData.nextCourse && !isNextCourse(dashboardData.nextCourse)) {
        throw new ClientPortalError('Invalid next course data format');
      }
      
      const newData = {
        stats: dashboardData.stats || null,
        nextCourse: dashboardData.nextCourse || null,
        upcomingCourses: dashboardData.upcomingCourses || [],
      };
      
      // Update cache
      cache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
      });
      
      setData(newData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else if (typeof err === 'object' && err !== null && 'status' in err) {
        setError(new NetworkError('Failed to load dashboard data', (err as any).status));
      } else {
        setError(new ClientPortalError('An unexpected error occurred'));
      }
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const updateData = useCallback((updates: Partial<ClientPortalData>) => {
    setData(prev => ({ ...prev, ...updates }));
    
    // Update cache if exists
    const cacheKey = 'client-portal-dashboard';
    const cached = cache.get(cacheKey);
    if (cached) {
      cache.set(cacheKey, {
        data: { ...cached.data, ...updates },
        timestamp: cached.timestamp,
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchData(true);
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...data,
    loading,
    error,
    refetch,
    updateData,
  };
};