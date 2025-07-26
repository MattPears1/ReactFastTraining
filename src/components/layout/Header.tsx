import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, ChevronDown, Bell, Search } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { useNotifications } from '@contexts/NotificationContext'
import { NotificationCenter } from '@components/ui/NotificationCenter'
import { NotificationBadge } from '@components/ui/NotificationBadge'
import { SearchModal } from '@components/ui/SearchModal'
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
      { label: 'Mental Health First Aid', href: '/courses/mental-health' },
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
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        )}
        role="banner"
      >
        <nav id="main-navigation" className="container" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center"
            >
              <img 
                src="/images/logos/fulllogo_transparent.png" 
                alt="React Fast Training" 
                className="h-10 md:h-12 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <div
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={cn(
                          'flex items-center space-x-1 text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                        )}
                        aria-expanded={openDropdown === item.label}
                        aria-haspopup="true"
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setOpenDropdown(openDropdown === item.label ? null : item.label)
                          }
                        }}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", openDropdown === item.label && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {openDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
              {/* Phone Number */}
              <a 
                href="tel:07845123456" 
                className="hidden md:flex items-center space-x-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>07845 123456</span>
              </a>

              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2.5 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative notification-center-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                  }}
                  className="relative p-2.5 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  <NotificationBadge count={unreadCount} />
                </button>
                {showNotifications && (
                  <div 
                    className="absolute right-0 mt-2 z-50 w-screen max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
                    style={{ right: 'max(-1rem, calc(-100vw + 100% + 2rem))' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <NotificationCenter
                      notifications={notifications}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDelete={removeNotification}
                      onClearAll={clearAll}
                      onClose={() => setShowNotifications(false)}
                    />
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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
                to="/contact"
                className="hidden md:inline-flex btn btn-primary"
              >
                Book Course
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2.5 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ml-1 sm:ml-0"
                aria-label="Toggle menu"
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
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-white dark:bg-gray-900 z-40 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  {navItems.map((item) => (
                    <div key={item.label}>
                      {item.children ? (
                        <div>
                          <button
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === item.label ? null : item.label
                              )
                            }
                            className={cn(
                              'flex items-center justify-between w-full text-left py-3 px-4 -mx-4 text-lg font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800',
                              isActive(item.href)
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronDown
                              className={cn(
                                'w-5 h-5 transition-transform',
                                openDropdown === item.label && 'rotate-180'
                              )}
                            />
                          </button>
                          <AnimatePresence>
                            {openDropdown === item.label && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 space-y-1 py-2">
                                  {item.children.map((child) => (
                                    <Link
                                      key={child.href}
                                      to={child.href}
                                      className="block py-3 px-4 -mx-4 text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                      {child.label}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          to={item.href}
                          className={cn(
                            'block py-3 px-4 -mx-4 text-lg font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800',
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

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/contact"
                    className="btn btn-primary w-full text-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  )
}

export default Header