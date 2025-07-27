import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@components/layout/Layout'
import LoadingScreen from '@components/common/LoadingScreen'
import ErrorBoundary from '@components/common/ErrorBoundary'
import { ThemeProvider } from '@contexts/ThemeContext'
import { ToastProvider } from '@contexts/ToastContext'
import { NotificationProvider } from '@contexts/NotificationContext'
import { AuthProvider } from '@contexts/AuthContext'
import { initPerformanceMonitoring, trackBundleSize } from '@utils/performance'
import { AnalyticsProvider } from '@components/providers/AnalyticsProvider'
import VersionInfo from '@components/common/VersionInfo'

// Lazy load pages for better performance
const HomePage = lazy(() => import('@pages/HomePage'))
const AboutPage = lazy(() => import('@pages/AboutPage'))
const ContactPage = lazy(() => import('@pages/ContactPage'))
const CoursesPage = lazy(() => import('@pages/CoursesPage'))
const EFAWCoursePage = lazy(() => import('@pages/courses/EFAWCoursePage'))
const FAWCoursePage = lazy(() => import('@pages/courses/FAWCoursePage'))
const PaediatricCoursePage = lazy(() => import('@pages/courses/PaediatricCoursePage'))
const PaediatricRequalificationPage = lazy(() => import('@pages/courses/PaediatricRequalificationPage'))
const MentalHealthCoursePage = lazy(() => import('@pages/courses/MentalHealthCoursePage'))
const FAWRequalificationPage = lazy(() => import('@pages/courses/FAWRequalificationPage'))
const EFAWRequalificationPage = lazy(() => import('@pages/courses/EFAWRequalificationPage'))
const EmergencyPaediatricPage = lazy(() => import('@pages/courses/EmergencyPaediatricPage'))
const EmergencyPaediatricRequalificationPage = lazy(() => import('@pages/courses/EmergencyPaediatricRequalificationPage'))
const ActivityFirstAidPage = lazy(() => import('@pages/courses/ActivityFirstAidPage'))
const ActivityFirstAidRequalificationPage = lazy(() => import('@pages/courses/ActivityFirstAidRequalificationPage'))
const CPRAEDPage = lazy(() => import('@pages/courses/CPRAEDPage'))
const AnnualSkillsRefresherPage = lazy(() => import('@pages/courses/AnnualSkillsRefresherPage'))
const OxygenTherapyPage = lazy(() => import('@pages/courses/OxygenTherapyPage'))
const FAQPage = lazy(() => import('@pages/FAQPage'))
const ProductsPage = lazy(() => import('@pages/ProductsPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const RegisterPage = lazy(() => import('@pages/RegisterPage'))
const EmailVerificationPage = lazy(() => import('@pages/EmailVerificationPage'))
const ResetPasswordPage = lazy(() => import('@pages/ResetPasswordPage'))
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'))
const ServerErrorPage = lazy(() => import('@pages/ServerErrorPage'))
const ForbiddenPage = lazy(() => import('@pages/ForbiddenPage'))
const MaintenancePage = lazy(() => import('@pages/MaintenancePage'))
const SearchPage = lazy(() => import('@pages/SearchPage'))
const ProfilePage = lazy(() => import('@pages/ProfilePage'))
const TrainingVenuePage = lazy(() => import('@pages/TrainingVenuePage'))
const BookingPage = lazy(() => import('@pages/BookingPageEnhanced'))
const BookingSuccessPage = lazy(() => import('@pages/BookingSuccessPage'))

// Client Portal Pages
const ClientDashboardPage = lazy(() => import('@pages/client/DashboardPage'))
const ClientBookingHistoryPage = lazy(() => import('@pages/client/BookingHistoryPage'))

// Legal Pages
const TermsPage = lazy(() => import('@pages/TermsPage'))

// Admin Pages
const AdminPage = lazy(() => import('@pages/AdminPage'))
const AdminRoutes = lazy(() => import('@/routes/AdminRoutes').then(module => ({ default: module.AdminRoutes })))

function App() {
  const location = useLocation()

  // Initialize performance monitoring
  useEffect(() => {
    initPerformanceMonitoring()
    trackBundleSize()
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <Layout>
            <AnimatePresence mode="wait">
              <Suspense fallback={<LoadingScreen />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/efaw" element={<EFAWCoursePage />} />
                  <Route path="/courses/faw" element={<FAWCoursePage />} />
                  <Route path="/courses/paediatric" element={<PaediatricCoursePage />} />
                  <Route path="/courses/paediatric-requalification" element={<PaediatricRequalificationPage />} />
                  <Route path="/courses/mental-health" element={<MentalHealthCoursePage />} />
                  <Route path="/courses/faw-requalification" element={<FAWRequalificationPage />} />
                  <Route path="/courses/efaw-requalification" element={<EFAWRequalificationPage />} />
                  <Route path="/courses/emergency-paediatric" element={<EmergencyPaediatricPage />} />
                  <Route path="/courses/emergency-paediatric-requalification" element={<EmergencyPaediatricRequalificationPage />} />
                  <Route path="/courses/activity-first-aid" element={<ActivityFirstAidPage />} />
                  <Route path="/courses/activity-first-aid-requalification" element={<ActivityFirstAidRequalificationPage />} />
                  <Route path="/courses/cpr-aed" element={<CPRAEDPage />} />
                  <Route path="/courses/annual-skills-refresher" element={<AnnualSkillsRefresherPage />} />
                  <Route path="/courses/oxygen-therapy" element={<OxygenTherapyPage />} />
                  <Route path="/venue" element={<TrainingVenuePage />} />
                  <Route path="/booking" element={<BookingPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/services" element={<ProductsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  
                  {/* Legal Pages */}
                  <Route path="/terms" element={<TermsPage />} />
                  
                  {/* Client Portal Routes */}
                  <Route path="/client" element={<ClientDashboardPage />} />
                  <Route path="/client/dashboard" element={<ClientDashboardPage />} />
                  <Route path="/client/bookings" element={<ClientBookingHistoryPage />} />
                  <Route path="/client/bookings/:id" element={<ClientBookingHistoryPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/*" element={<AdminRoutes />} />
                  <Route path="/admin-legacy" element={<AdminPage />} />
                  
                  <Route path="/500" element={<ServerErrorPage />} />
                  <Route path="/403" element={<ForbiddenPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
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
  )
}

export default App