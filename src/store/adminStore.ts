import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super-admin";
  permissions: string[];
  lastLogin: string;
}

interface DashboardStats {
  todayBookings: number;
  weeklyRevenue: number;
  pendingRefunds: number;
  upcomingSessions: number;
  lastUpdated: string;
}

interface AdminFilters {
  dateRange: { start: Date | null; end: Date | null };
  searchTerm: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface AdminNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AdminState {
  // User & Auth
  currentUser: AdminUser | null;
  sessionToken: string | null;
  refreshToken: string | null;
  sessionExpiresAt: string | null;

  // Dashboard
  dashboardStats: DashboardStats | null;
  recentActivity: any[];

  // Global UI State
  sidebarCollapsed: boolean;
  notifications: AdminNotification[];
  unreadNotifications: number;

  // Filters & Preferences
  globalFilters: AdminFilters;
  viewPreferences: {
    density: "compact" | "normal" | "comfortable";
    showGridLines: boolean;
    defaultView: string;
  };

  // Cache
  dataCache: Map<string, { data: any; timestamp: number }>;

  // Actions
  setUser: (user: AdminUser) => void;
  clearUser: () => void;
  updateSession: (
    token: string,
    refreshToken: string,
    expiresAt: string,
  ) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  toggleSidebar: () => void;
  addNotification: (
    notification: Omit<AdminNotification, "id" | "timestamp" | "read">,
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateFilters: (filters: Partial<AdminFilters>) => void;
  resetFilters: () => void;
  updateViewPreferences: (
    prefs: Partial<AdminState["viewPreferences"]>,
  ) => void;
  cacheData: (key: string, data: any) => void;
  getCachedData: (key: string, maxAge?: number) => any | null;
  clearCache: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

export const useAdminStore = create<AdminState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        currentUser: null,
        sessionToken: null,
        refreshToken: null,
        sessionExpiresAt: null,
        dashboardStats: null,
        recentActivity: [],
        sidebarCollapsed: false,
        notifications: [],
        unreadNotifications: 0,
        globalFilters: {
          dateRange: { start: null, end: null },
          searchTerm: "",
          status: "all",
          category: "all",
          sortBy: "created",
          sortOrder: "desc",
        },
        viewPreferences: {
          density: "normal",
          showGridLines: true,
          defaultView: "table",
        },
        dataCache: new Map(),

        // Actions
        setUser: (user) =>
          set((state) => {
            state.currentUser = user;
          }),

        clearUser: () =>
          set((state) => {
            state.currentUser = null;
            state.sessionToken = null;
            state.refreshToken = null;
            state.sessionExpiresAt = null;
            state.dataCache.clear();
          }),

        updateSession: (token, refreshToken, expiresAt) =>
          set((state) => {
            state.sessionToken = token;
            state.refreshToken = refreshToken;
            state.sessionExpiresAt = expiresAt;
          }),

        setDashboardStats: (stats) =>
          set((state) => {
            state.dashboardStats = stats;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        addNotification: (notification) =>
          set((state) => {
            const newNotification: AdminNotification = {
              ...notification,
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
              read: false,
            };
            state.notifications.unshift(newNotification);
            state.unreadNotifications += 1;

            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
              state.notifications = state.notifications.slice(0, 50);
            }
          }),

        markNotificationRead: (id) =>
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              state.unreadNotifications = Math.max(
                0,
                state.unreadNotifications - 1,
              );
            }
          }),

        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
            state.unreadNotifications = 0;
          }),

        updateFilters: (filters) =>
          set((state) => {
            state.globalFilters = { ...state.globalFilters, ...filters };
          }),

        resetFilters: () =>
          set((state) => {
            state.globalFilters = {
              dateRange: { start: null, end: null },
              searchTerm: "",
              status: "all",
              category: "all",
              sortBy: "created",
              sortOrder: "desc",
            };
          }),

        updateViewPreferences: (prefs) =>
          set((state) => {
            state.viewPreferences = { ...state.viewPreferences, ...prefs };
          }),

        cacheData: (key, data) =>
          set((state) => {
            state.dataCache.set(key, {
              data,
              timestamp: Date.now(),
            });
          }),

        getCachedData: (key, maxAge = CACHE_TTL) => {
          const cached = get().dataCache.get(key);
          if (!cached) return null;

          const age = Date.now() - cached.timestamp;
          if (age > maxAge) {
            get().dataCache.delete(key);
            return null;
          }

          return cached.data;
        },

        clearCache: () =>
          set((state) => {
            state.dataCache.clear();
          }),
      })),
      {
        name: "admin-store",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          viewPreferences: state.viewPreferences,
          globalFilters: state.globalFilters,
        }),
      },
    ),
  ),
);

// Selectors
export const selectIsAuthenticated = (state: AdminState) =>
  !!state.currentUser &&
  !!state.sessionToken &&
  (state.sessionExpiresAt
    ? new Date(state.sessionExpiresAt) > new Date()
    : false);

export const selectHasPermission = (state: AdminState, permission: string) =>
  state.currentUser?.permissions.includes(permission) ||
  state.currentUser?.role === "super-admin";

export const selectUnreadNotifications = (state: AdminState) =>
  state.notifications.filter((n) => !n.read);
