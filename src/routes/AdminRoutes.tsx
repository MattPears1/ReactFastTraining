import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@pages/admin/AdminLayout';
import { AdminRoute } from '@/middleware/adminAuth';

// Lazy load admin pages
const AdminDashboardPage = lazy(() => import('@pages/admin/DashboardPage'));
const AdminCalendarPage = lazy(() => import('@pages/admin/CalendarPageSimple'));
const AdminBookingsPage = lazy(() => import('@pages/admin/BookingsPage'));
const AdminClientsPage = lazy(() => import('@pages/admin/ClientsPage'));
const AdminEmailsPage = lazy(() => import('@pages/admin/EmailsPage'));
const AdminReportsPage = lazy(() => import('@pages/admin/ReportsPage'));
const AdminSettingsPage = lazy(() => import('@pages/admin/SettingsPage'));
const AdminSessionDetailsPage = lazy(() => import('@pages/admin/SessionDetailsPage'));
const AdminCreateSessionPage = lazy(() => import('@pages/admin/CreateSessionPage'));
const AdminRefundsPage = lazy(() => import('@pages/admin/RefundsPage'));
const AdminAuditLogPage = lazy(() => import('@pages/admin/AuditLogPage'));

// Legacy admin page for backward compatibility
const LegacyAdminPage = lazy(() => import('@pages/AdminPage'));

export const AdminRoutes: React.FC = () => {
  return (
    <AdminRoute>
      <Routes>
        <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="bookings/:id" element={<AdminSessionDetailsPage />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:id" element={<AdminClientsPage />} />
        <Route path="sessions/new" element={<AdminCreateSessionPage />} />
        <Route path="sessions/:id" element={<AdminSessionDetailsPage />} />
        <Route path="refunds" element={<AdminRefundsPage />} />
        <Route path="emails/*" element={<AdminEmailsPage />} />
        <Route path="communications" element={<AdminEmailsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-log" element={<AdminAuditLogPage />} />
        <Route path="export" element={<AdminReportsPage />} />
      </Route>
      
      {/* Legacy route for backward compatibility */}
      <Route path="legacy" element={<LegacyAdminPage />} />
    </Routes>
    </AdminRoute>
  );
};