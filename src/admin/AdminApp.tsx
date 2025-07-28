import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Contexts
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Layout
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Pages
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CoursesPage } from "./features/courses/CoursesPage";
import { CourseEditPage } from "./features/courses/CourseEditPage";
import { BookingsPage } from "./features/bookings/BookingsPage";
import { BookingDetailsPage } from "./features/bookings/BookingDetailsPage";
import { SchedulePage } from "./features/schedule/SchedulePage";
import { ScheduleDetailsPage } from "./features/schedule/ScheduleDetailsPage";
import { UsersPage } from "./features/users/UsersPage";
import { UserDetailsPage } from "./features/users/UserDetailsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { ActivityLogPage } from "./features/activity/ActivityLogPage";
import { AlertsPage } from "./features/alerts/AlertsPage";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage";
import { TestimonialsPage } from "./features/testimonials/TestimonialsPage";

// Create a separate QueryClient for admin
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export const AdminApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<DashboardPage />} />

                      {/* Course Management */}
                      <Route path="courses">
                        <Route index element={<CoursesPage />} />
                        <Route path="new" element={<CourseEditPage />} />
                        <Route path=":id/edit" element={<CourseEditPage />} />
                      </Route>

                      {/* Booking Management */}
                      <Route path="bookings">
                        <Route index element={<BookingsPage />} />
                        <Route path=":id" element={<BookingDetailsPage />} />
                      </Route>

                      {/* Schedule Management */}
                      <Route path="schedule">
                        <Route index element={<SchedulePage />} />
                        <Route path=":id" element={<ScheduleDetailsPage />} />
                      </Route>

                      {/* User Management */}
                      <Route path="users">
                        <Route index element={<UsersPage />} />
                        <Route path=":id" element={<UserDetailsPage />} />
                      </Route>

                      {/* Settings */}
                      <Route path="settings" element={<SettingsPage />} />

                      {/* Activity Log */}
                      <Route path="activity" element={<ActivityLogPage />} />

                      {/* Admin Alerts */}
                      <Route path="alerts" element={<AlertsPage />} />

                      {/* Analytics */}
                      <Route path="analytics" element={<AnalyticsPage />} />

                      {/* Testimonials */}
                      <Route
                        path="testimonials"
                        element={<TestimonialsPage />}
                      />

                      {/* Catch all */}
                      <Route
                        path="*"
                        element={<Navigate to="dashboard" replace />}
                      />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminAuthProvider>
      </NotificationProvider>
      {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
};
