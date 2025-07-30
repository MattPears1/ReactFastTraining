import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";
import { SearchModal } from "@components/ui/SearchModal";
import { CoursesModal } from "@components/ui/CoursesModal";
import { cn } from "@utils/cn";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Courses",
    href: "/courses",
    children: [
      { label: "Emergency First Aid at Work", href: "/courses/efaw" },
      { label: "First Aid at Work", href: "/courses/faw" },
      { label: "Paediatric First Aid", href: "/courses/paediatric" },
      {
        label: "Emergency Paediatric First Aid",
        href: "/courses/emergency-paediatric",
      },
      { label: "Activity First Aid", href: "/courses/activity-first-aid" },
      { label: "Annual Skills Refresher", href: "/courses/annual-skills-refresher" },
      { label: "CPR and AED", href: "/courses/cpr-aed" },
      { label: "Oxygen Therapy", href: "/courses/oxygen-therapy" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Bookings and contact", href: "/contact" },
];

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
    setShowCoursesModal(false);
  }, [location]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-gray-200/30 dark:border-gray-700/30",
          scrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b-gray-100 dark:border-b-gray-800"
            : "bg-gradient-to-b from-white/10 to-transparent dark:from-gray-900/20",
        )}
        role="banner"
        style={{
          borderTop: "3px solid",
          borderImage: "linear-gradient(to right, #0EA5E9, #F97316, #10B981) 1"
        }}
      >
        <nav
          id="main-navigation"
          className="container px-4 sm:px-6 lg:px-8"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo on the left */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="/images/logos/fulllogo_transparent.png"
                alt="React Fast Training"
                className="h-48 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.label === "Courses" ? (
                    <button
                      onClick={() => setShowCoursesModal(true)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                        "backdrop-blur-sm bg-white/10 dark:bg-gray-800/20",
                        "border border-gray-200/30 dark:border-gray-700/30",
                        isActive(item.href)
                          ? "bg-gradient-to-r from-secondary-500/20 to-accent-500/20 border-secondary-500/50 dark:border-accent-500/50 text-gray-900 dark:text-white shadow-lg"
                          : "hover:bg-white/20 dark:hover:bg-gray-800/30 hover:border-gray-300/50 dark:hover:border-gray-600/50 text-gray-700 dark:text-gray-300",
                      )}
                      aria-label="View courses"
                    >
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                        item.label === "Bookings and contact"
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg border border-primary-600"
                          : "backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 border border-gray-200/30 dark:border-gray-700/30",
                        item.label !== "Bookings and contact" &&
                          (isActive(item.href)
                            ? "bg-gradient-to-r from-secondary-500/20 to-accent-500/20 border-secondary-500/50 dark:border-accent-500/50 text-gray-900 dark:text-white shadow-lg"
                            : "hover:bg-white/20 dark:hover:bg-gray-800/30 hover:border-gray-300/50 dark:hover:border-gray-600/50 text-gray-700 dark:text-gray-300"),
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
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-3 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>


              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
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
              className="fixed inset-0 bg-black/50 z-40 lg:hidden mobile-menu-overlay"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 z-50 lg:hidden overflow-y-auto shadow-2xl mobile-menu safe-area-inset"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {navItems.map((item) => (
                    <div key={item.label}>
                      {item.label === "Courses" ? (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            setShowCoursesModal(true);
                          }}
                          className="w-full h-16 flex items-center justify-center text-center px-6 text-lg font-semibold transition-all duration-300 rounded-xl shadow-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border border-primary-600 transform hover:scale-105 active:scale-95"
                        >
                          <span className="text-center">{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className="w-full h-16 flex items-center justify-center text-center px-6 text-lg font-semibold transition-all duration-300 rounded-xl shadow-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border border-primary-600 transform hover:scale-105 active:scale-95"
                        >
                          <span className="text-center">{item.label}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Courses Modal */}
      <CoursesModal
        isOpen={showCoursesModal}
        onClose={() => setShowCoursesModal(false)}
      />
    </>
  );
};

export default Header;
