import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "@components/layout/Layout";
import LoadingScreen from "@components/common/LoadingScreen";
import ErrorBoundary from "@components/common/ErrorBoundary";
import { ThemeProvider } from "@contexts/ThemeContext";
import { ToastProvider } from "@contexts/ToastContext";
import { NotificationProvider } from "@contexts/NotificationContext";
import { AuthProvider } from "@contexts/AuthContext";
import { initPerformanceMonitoring, trackBundleSize } from "@utils/performance";
import { AnalyticsProvider } from "@components/providers/AnalyticsProvider";
import VersionInfo from "@components/common/VersionInfo";
import { visitorTracker } from "@utils/visitor-tracking";

console.log('🚀 [APP] App.tsx starting initialization...', {
  timestamp: new Date().toISOString()
});

// Log lazy loading setup
console.log('📦 [LAZY] Setting up lazy-loaded pages...');

// Lazy load pages for better performance
const HomePage = lazy(() => {
  console.log('🏠 [LAZY] Loading HomePage component...');
  return import("@pages/HomePage").then(module => {
    console.log('✅ [LAZY] HomePage loaded successfully');
    return module;
  }).catch(error => {
    console.error('❌ [LAZY] Failed to load HomePage:', error);
    throw error;
  });
});
const AboutPage = lazy(() => import("@pages/AboutPage"));
const ContactPage = lazy(() => import("@pages/ContactPage"));
const CoursesPage = lazy(() => import("@pages/CoursesPage"));
const EFAWCoursePage = lazy(() => import("@pages/courses/EFAWCoursePage"));
const FAWCoursePage = lazy(() => import("@pages/courses/FAWCoursePage"));
const PaediatricCoursePage = lazy(
  () => import("@pages/courses/PaediatricCoursePage"),
);
const MentalHealthCoursePage = lazy(
  () => import("@pages/courses/MentalHealthCoursePage"),
);
const EmergencyPaediatricPage = lazy(
  () => import("@pages/courses/EmergencyPaediatricPage"),
);
const ActivityFirstAidPage = lazy(
  () => import("@pages/courses/ActivityFirstAidPage"),
);
const CPRAEDPage = lazy(() => import("@pages/courses/CPRAEDPage"));
const AnnualSkillsRefresherPage = lazy(
  () => import("@pages/courses/AnnualSkillsRefresherPage"),
);
const OxygenTherapyPage = lazy(
  () => import("@pages/courses/OxygenTherapyPage"),
);
const FAQPage = lazy(() => import("@pages/FAQPage"));
const ProductsPage = lazy(() => import("@pages/ProductsPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));
const LoginPage = lazy(() => import("@pages/LoginPage"));
const RegisterPage = lazy(() => import("@pages/RegisterPage"));
const EmailVerificationPage = lazy(
  () => import("@pages/EmailVerificationPage"),
);
const ResetPasswordPage = lazy(() => import("@pages/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("@pages/ForgotPasswordPage"));
const ServerErrorPage = lazy(() => import("@pages/ServerErrorPage"));
const ForbiddenPage = lazy(() => import("@pages/ForbiddenPage"));
const MaintenancePage = lazy(() => import("@pages/MaintenancePage"));
const SearchPage = lazy(() => import("@pages/SearchPage"));
const ProfilePage = lazy(() => import("@pages/ProfilePage"));
const BookingPage = lazy(() => import("@pages/BookingPageEnhanced"));
const BookingSuccessPage = lazy(() => import("@pages/BookingSuccessPage"));
const TestimonialsPage = lazy(() => import("@pages/TestimonialsPage"));
const TestimonialSubmitPage = lazy(
  () => import("@pages/TestimonialSubmitPage"),
);

// Client Portal Pages
const ClientDashboardPage = lazy(() => import("@pages/client/DashboardPage"));
const ClientBookingHistoryPage = lazy(
  () => import("@pages/client/BookingHistoryPage"),
);

// Legal Pages
const TermsPage = lazy(() => import("@pages/TermsPage"));

// Admin Pages
const AdminPage = lazy(() => import("@pages/AdminPage"));
const DirectAdminTest = lazy(() => import("@/admin/components/DirectAdminTest").then(module => ({ default: module.DirectAdminTest })));
const AdminRoutes = lazy(() => {
  console.log("Loading AdminRoutes module...");
  return import("@/routes/AdminRoutes").then((module) => {
    console.log("AdminRoutes module loaded:", module);
    return {
      default: module.AdminRoutes,
    };
  }).catch(error => {
    console.error("Failed to load AdminRoutes:", error);
    throw error;
  });
});

function App() {
  const location = useLocation();
  
  console.log('🎨 [APP] App component rendering...', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    timestamp: new Date().toISOString()
  });

  // Initialize performance monitoring
  useEffect(() => {
    console.log('🏁 [APP] App mounted - initializing...', {
      timestamp: new Date().toISOString(),
      performanceNow: performance.now()
    });
    
    try {
      console.log('📊 [PERF] Initializing performance monitoring...');
      initPerformanceMonitoring();
      console.log('✅ [PERF] Performance monitoring initialized');
    } catch (error) {
      console.error('❌ [PERF] Failed to initialize performance monitoring:', error);
    }
    
    try {
      console.log('📏 [BUNDLE] Tracking bundle size...');
      trackBundleSize();
      console.log('✅ [BUNDLE] Bundle size tracked');
    } catch (error) {
      console.error('❌ [BUNDLE] Failed to track bundle size:', error);
    }
    
    console.log('🎯 [APP] App initialization complete');
    
    // Log visitor tracking
    try {
      console.log('👤 [VISITOR] Visitor tracking status:', {
        visitorTracker: !!visitorTracker,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [VISITOR] Error checking visitor tracker:', error);
    }
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    console.log('📍 [NAVIGATION] Route changed:', {
      pathname: location.pathname,
      previousScroll: window.scrollY,
      timestamp: new Date().toISOString()
    });
    
    window.scrollTo(0, 0);
    
    console.log('✅ [NAVIGATION] Scrolled to top');
  }, [location.pathname]);

  // Log theme and context providers initialization
  console.log('🔧 [PROVIDERS] Initializing context providers...');

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <Layout>
                  <AnimatePresence mode="wait">
                    <Suspense 
                      fallback={
                        <div>
                          {console.log('⏳ [SUSPENSE] Loading route component...')}
                          <LoadingScreen />
                        </div>
                      }
                    >
                      <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/courses" element={<CoursesPage />} />
                        <Route
                          path="/courses/efaw"
                          element={<EFAWCoursePage />}
                        />
                        <Route
                          path="/courses/faw"
                          element={<FAWCoursePage />}
                        />
                        <Route
                          path="/courses/paediatric"
                          element={<PaediatricCoursePage />}
                        />
                        <Route
                          path="/courses/mental-health"
                          element={<MentalHealthCoursePage />}
                        />
                        <Route
                          path="/courses/emergency-paediatric"
                          element={<EmergencyPaediatricPage />}
                        />
                        <Route
                          path="/courses/activity-first-aid"
                          element={<ActivityFirstAidPage />}
                        />
                        <Route
                          path="/courses/cpr-aed"
                          element={<CPRAEDPage />}
                        />
                        <Route
                          path="/courses/annual-skills-refresher"
                          element={<AnnualSkillsRefresherPage />}
                        />
                        <Route
                          path="/courses/oxygen-therapy"
                          element={<OxygenTherapyPage />}
                        />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/services" element={<ProductsPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                          path="/verify-email"
                          element={<EmailVerificationPage />}
                        />
                        <Route
                          path="/reset-password"
                          element={<ResetPasswordPage />}
                        />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPasswordPage />}
                        />

                        {/* Testimonial Routes */}
                        <Route
                          path="/testimonials"
                          element={<TestimonialsPage />}
                        />
                        <Route
                          path="/testimonials/submit"
                          element={<TestimonialSubmitPage />}
                        />

                        {/* Legal Pages */}
                        <Route path="/terms" element={<TermsPage />} />

                        {/* Client Portal Routes */}
                        <Route
                          path="/client"
                          element={<ClientDashboardPage />}
                        />
                        <Route
                          path="/client/dashboard"
                          element={<ClientDashboardPage />}
                        />
                        <Route
                          path="/client/bookings"
                          element={<ClientBookingHistoryPage />}
                        />
                        <Route
                          path="/client/bookings/:id"
                          element={<ClientBookingHistoryPage />}
                        />

                        {/* Admin Routes */}
                        <Route path="/admin-test-direct" element={<DirectAdminTest />} />
                        <Route path="/admin/*" element={<AdminRoutes />} />
                        <Route path="/admin-legacy" element={<AdminPage />} />

                        <Route path="/500" element={<ServerErrorPage />} />
                        <Route path="/403" element={<ForbiddenPage />} />
                        <Route
                          path="/maintenance"
                          element={<MaintenancePage />}
                        />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </AnimatePresence>
                </Layout>
              </AnalyticsProvider>
            </AuthProvider>
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
      <VersionInfo />
    </ErrorBoundary>
  );
}

export default App;
