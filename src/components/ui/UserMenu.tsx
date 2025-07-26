import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Bell,
  Heart,
  ShoppingBag,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  FileText,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { clsx } from 'clsx';

export interface UserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
  };
  onLogout?: () => void;
  className?: string;
}

interface MenuItem {
  icon: React.FC<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  divider?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      icon: User,
      label: 'My Profile',
      href: '/profile',
    },
    {
      icon: ShoppingBag,
      label: 'My Orders',
      href: '/orders',
      badge: 2,
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/wishlist',
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      badge: 5,
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      href: '/payment-methods',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      divider: true,
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: '/support',
    },
    {
      icon: FileText,
      label: 'Terms & Privacy',
      href: '/terms',
      divider: true,
    },
    {
      icon: LogOut,
      label: 'Log Out',
      onClick: () => {
        setIsOpen(false);
        onLogout?.();
      },
    },
  ];

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={clsx('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="User menu"
      >
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size="sm"
        />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
        <ChevronRight
          className={clsx(
            'w-4 h-4 text-gray-400 transition-transform hidden md:block',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  size="md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    {user.isVerified && (
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.divider && index > 0 && (
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                  )}
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact User Menu for Mobile
export const CompactUserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
  className,
}) => {
  const navigate = useNavigate();

  const quickActions = [
    { icon: ShoppingBag, label: 'Orders', href: '/orders', badge: 2 },
    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
    { icon: Bell, label: 'Alerts', href: '/notifications', badge: 5 },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4', className)}>
      {/* User Info */}
      <Link
        to="/profile"
        className="flex items-center gap-3 p-3 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
      >
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size="lg"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View Profile
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.href)}
            className="relative flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <action.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {action.label}
            </span>
            {action.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs font-medium rounded-full">
                {action.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
};