import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  SkipForward,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ClientPortalProvider } from "@/contexts/ClientPortalContext";
import { ClientPortalErrorBoundary } from "./ClientPortalErrorBoundary";
import { FocusTrap } from "@/components/common/FocusTrap";

interface ClientPortalLayoutProps {
  children?: React.ReactNode;
}

export const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/client" } });
    }
  }, [user, navigate]);

  const navItems = [
    { path: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/client/bookings", label: "My Bookings", icon: Calendar },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <ClientPortalProvider>
      <ClientPortalErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Skip Navigation Link */}
          <a
            ref={skipLinkRef}
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip to main content
          </a>
          {/* Desktop Sidebar */}
          <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white dark:lg:bg-gray-800 lg:border-r lg:border-gray-200 dark:lg:border-gray-700">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-primary-600">
                  React Fast Training
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Client Portal
                </p>
              </div>

              {/* Navigation */}
              <nav
                className="flex-1 px-4 py-6 space-y-1"
                role="navigation"
                aria-label="Main navigation"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Logout from client portal"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-lg font-bold text-primary-600">
                Client Portal
              </h2>
              <button
                ref={menuButtonRef}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                aria-label={
                  isMobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </header>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <FocusTrap
                active={isMobileMenuOpen}
                onEscape={() => setIsMobileMenuOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ type: "tween" }}
                  className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu overlay"
                >
                  <motion.aside
                    id="mobile-navigation"
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    transition={{ type: "tween" }}
                    className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                    role="navigation"
                    aria-label="Mobile navigation"
                  >
                    <div className="flex h-full flex-col pt-16">
                      {/* Navigation */}
                      <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                  isActive
                                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`
                              }
                            >
                              <Icon className="w-5 h-5" aria-hidden="true" />
                              <span>{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </nav>

                      {/* Logout Button */}
                      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="Logout from client portal"
                        >
                          <LogOut className="w-5 h-5" aria-hidden="true" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </motion.aside>
                </motion.div>
              </FocusTrap>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main id="main-content" className="lg:pl-64" role="main">
            <div className="pt-16 lg:pt-0">
              <ClientPortalErrorBoundary>
                {children || <Outlet />}
              </ClientPortalErrorBoundary>
            </div>
          </main>

          {/* Live Region for Announcements */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            id="client-portal-announcements"
          />
        </div>
      </ClientPortalErrorBoundary>
    </ClientPortalProvider>
  );
};
