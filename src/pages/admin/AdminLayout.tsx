import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Mail,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Activity,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import LoadingScreen from "@components/common/LoadingScreen";
import { cn } from "@utils/cn";
import { useAuditTrail } from "@hooks/useAuditTrail";
import { logAdminAction } from "@middleware/adminAuth";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [sessionWarning, setSessionWarning] = useState(false);
  const location = useLocation();
  const { logAction, logSecurityEvent } = useAuditTrail();

  // Session timeout warning
  useEffect(() => {
    const warningTime = 25 * 60 * 1000; // 25 minutes
    const warningTimer = setTimeout(() => {
      setSessionWarning(true);
    }, warningTime);

    return () => clearTimeout(warningTimer);
  }, []);

  // Log navigation
  useEffect(() => {
    logAction({
      action: "page_view",
      category: "auth",
      severity: "info",
      details: { path: location.pathname },
    });
  }, [location.pathname, logAction]);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/admin/calendar",
      children: [
        { label: "View Calendar", icon: Calendar, href: "/admin/calendar" },
        {
          label: "Create Session",
          icon: Calendar,
          href: "/admin/sessions/new",
        },
      ],
    },
    {
      label: "Bookings",
      icon: Users,
      href: "/admin/bookings",
      badge: 3,
      children: [
        { label: "All Bookings", icon: Users, href: "/admin/bookings" },
        {
          label: "Pending",
          icon: Users,
          href: "/admin/bookings?status=pending",
        },
        { label: "Refunds", icon: Users, href: "/admin/refunds" },
      ],
    },
    {
      label: "Clients",
      icon: Users,
      href: "/admin/clients",
    },
    {
      label: "Communications",
      icon: Mail,
      href: "/admin/communications",
      children: [
        {
          label: "Email Templates",
          icon: Mail,
          href: "/admin/emails/templates",
        },
        { label: "Send Email", icon: Mail, href: "/admin/emails/send" },
        { label: "Email History", icon: Mail, href: "/admin/emails/history" },
      ],
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/admin/reports",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
    },
    {
      label: "Audit Log",
      icon: Shield,
      href: "/admin/audit-log",
    },
  ];

  // Check authentication
  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItem) => {
    if (location.pathname === item.href) return true;
    return item.children?.some((child) => location.pathname === child.href);
  };

  const handleLogout = async () => {
    await logSecurityEvent("admin_logout", "info", {
      sessionDuration:
        Date.now() - parseInt(sessionStorage.getItem("sessionStart") || "0"),
    });
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                        isParentActive(item)
                          ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          expandedItems.includes(item.label) && "rotate-180",
                        )}
                      />
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive(child.href)
                                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700",
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Session Warning Modal */}
      {sessionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session Expiring Soon
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your session will expire in 5 minutes due to inactivity. Please
              save your work and stay active to avoid being logged out.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSessionWarning(false);
                  sessionStorage.setItem("sessionStart", Date.now().toString());
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continue Working
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
