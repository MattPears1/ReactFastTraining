import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Bell, Search } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { useNotifications } from '@contexts/NotificationContext'
import { NotificationCenter } from '@components/ui/NotificationCenter'
import { NotificationBadge } from '@components/ui/NotificationBadge'
import { SearchModal } from '@components/ui/SearchModal'
import { CoursesModal } from '@components/ui/CoursesModal'
import { cn } from '@utils/cn'

interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  {
    label: 'Courses',
    href: '/courses',
    children: [
      { label: 'Emergency First Aid at Work', href: '/courses/efaw' },
      { label: 'First Aid at Work', href: '/courses/faw' },
      { label: 'Paediatric First Aid', href: '/courses/paediatric' },
      { label: 'Emergency Paediatric First Aid', href: '/courses/emergency-paediatric' },
      { label: 'FAW Requalification', href: '/courses/faw-requalification' },
      { label: 'EFAW Requalification', href: '/courses/efaw-requalification' },
      { label: 'Paediatric Requalification', href: '/courses/paediatric-requalification' },
      { label: 'Emergency Paediatric Requalification', href: '/courses/emergency-paediatric-requalification' },
      { label: 'Activity First Aid', href: '/courses/activity-first-aid' },
      { label: 'Activity First Aid Requalification', href: '/courses/activity-first-aid-requalification' },
      { label: 'CPR and AED', href: '/courses/cpr-aed' },
      { label: 'Annual Skills Refresher', href: '/courses/annual-skills-refresher' },
      { label: 'Oxygen Therapy', href: '/courses/oxygen-therapy' },
    ],
  },
  { label: 'Training Venue', href: '/venue' },
  { label: 'Contact', href: '/contact' },
]

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setOpenDropdown(null)
    setShowNotifications(false)
    setShowCoursesModal(false)
  }, [location])

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-center-container') && !target.closest('[aria-label="View notifications"]')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNotifications])

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-100 dark:border-gray-800'
            : 'bg-gradient-to-b from-white/10 to-transparent dark:from-gray-900/20'
        )}
        role="banner"
      >
        <nav id="main-navigation" className="container px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 lg:h-24">
            {/* Logo on the left */}
            <Link
              to="/"
              className="flex items-center flex-shrink-0"
            >
              <img 
                src="/images/logos/fulllogo_transparent.png" 
                alt="React Fast Training" 
                className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-auto"
              />
            </Link>
              
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 2xl:space-x-8">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.label === 'Courses' ? (
                    <button
                      onClick={() => setShowCoursesModal(true)}
                      className={cn(
                        'flex items-center space-x-1 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                      )}
                      aria-label="View courses"
                    >
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Phone Number - visible on mobile and desktop */}
              <a 
                href="tel:07447485644" 
                className="flex items-center space-x-1 sm:space-x-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-xs sm:text-sm lg:text-base min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-0 justify-center sm:justify-start"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden sm:inline">07447 485644</span>
              </a>

              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {/* CTA Button */}
              <Link
                to="/booking"
                className="hidden sm:inline-flex btn btn-primary btn-yorkshire shadow-blue text-sm lg:text-base px-3 py-2 lg:px-4 lg:py-2.5"
              >
                Book Course
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  {navItems.map((item) => (
                    <div key={item.label}>
                      {item.label === 'Courses' ? (
                        <button
                          onClick={() => {
                            setIsOpen(false)
                            setShowCoursesModal(true)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between py-3 px-4 -mx-4 text-base sm:text-lg font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[48px]',
                            isActive(item.href)
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <span>{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className={cn(
                            'block py-3 px-4 -mx-4 text-base sm:text-lg font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[48px] flex items-center',
                            isActive(item.href)
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/booking"
                    className="btn btn-primary w-full text-center mb-3 sm:mb-4 min-h-[48px] flex items-center justify-center"
                  >
                    Book Course
                  </Link>
                  <a
                    href="tel:07447485644"
                    className="btn btn-outline w-full text-center flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call 07447 485644
                  </a>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>


      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Courses Modal */}
      <CoursesModal isOpen={showCoursesModal} onClose={() => setShowCoursesModal(false)} />
    </>
  )
}

export default Header