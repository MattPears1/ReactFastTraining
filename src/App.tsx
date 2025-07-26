import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@components/layout/Layout'
import LoadingScreen from '@components/common/LoadingScreen'
import ErrorBoundary from '@components/common/ErrorBoundary'
import { ThemeProvider } from '@contexts/ThemeContext'
import { ToastProvider } from '@contexts/ToastContext'
import { NotificationProvider } from '@contexts/NotificationContext'
import { initPerformanceMonitoring, trackBundleSize } from '@utils/performance'
import { AnalyticsProvider } from '@components/providers/AnalyticsProvider'

// Lazy load pages for better performance
const HomePage = lazy(() => import('@pages/HomePage'))
const AboutPage = lazy(() => import('@pages/AboutPage'))
const ContactPage = lazy(() => import('@pages/ContactPage'))
const FAQPage = lazy(() => import('@pages/FAQPage'))
const ProductsPage = lazy(() => import('@pages/ProductsPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))
const Design2025Demo = lazy(() => import('@pages/Design2025Demo'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const RegisterPage = lazy(() => import('@pages/RegisterPage'))
const ServerErrorPage = lazy(() => import('@pages/ServerErrorPage'))
const ForbiddenPage = lazy(() => import('@pages/ForbiddenPage'))
const MaintenancePage = lazy(() => import('@pages/MaintenancePage'))
const OfflinePage = lazy(() => import('@pages/OfflinePage'))
const NotificationDemo = lazy(() => import('@pages/NotificationDemo'))
const SearchPage = lazy(() => import('@pages/SearchPage'))
const SocialMediaDemo = lazy(() => import('@pages/SocialMediaDemo'))
const ProfilePage = lazy(() => import('@pages/ProfilePage'))

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
            <AnalyticsProvider>
              <Layout>
            <AnimatePresence mode="wait">
              <Suspense fallback={<LoadingScreen />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/services" element={<ProductsPage />} />
                  <Route path="/design-2025" element={<Design2025Demo />} />
                  <Route path="/notifications" element={<NotificationDemo />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/social-media" element={<SocialMediaDemo />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/500" element={<ServerErrorPage />} />
                  <Route path="/403" element={<ForbiddenPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/offline" element={<OfflinePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </Layout>
            </AnalyticsProvider>
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App