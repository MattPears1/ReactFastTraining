import React from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  dot?: boolean;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  dot = false,
  color = 'red',
  size = 'md',
  position = 'top-right',
  pulse = true,
  children,
  className,
}) => {
  const showBadge = dot || count > 0;
  const displayCount = count > max ? `${max}+` : count;

  const colorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-500 text-white',
  };

  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'min-w-[18px] h-[18px] text-xs px-1',
    md: dot ? 'w-2.5 h-2.5' : 'min-w-[20px] h-[20px] text-xs px-1.5',
    lg: dot ? 'w-3 h-3' : 'min-w-[24px] h-[24px] text-sm px-2',
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  return (
    <div className={clsx('relative inline-flex', className)}>
      {children}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 15 }}
            className={clsx(
              'absolute flex items-center justify-center rounded-full font-medium',
              colorClasses[color],
              sizeClasses[size],
              positionClasses[position]
            )}
          >
            {pulse && !dot && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
            )}
            {!dot && (
              <span className="relative inline-flex items-center justify-center">
                {displayCount}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compound component for more complex badge scenarios
interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({ children, className }) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {children}
    </div>
  );
};

// Status indicator component
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showLabel?: boolean;
  children: React.ReactNode;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  position = 'bottom-right',
  showLabel = false,
  children,
}) => {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    offline: { color: 'bg-gray-400', label: 'Offline' },
    away: { color: 'bg-yellow-500', label: 'Away' },
    busy: { color: 'bg-red-500', label: 'Busy' },
  };

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="relative">
        {children}
        <span
          className={clsx(
            'absolute flex rounded-full ring-2 ring-white dark:ring-gray-800',
            statusConfig[status].color,
            sizeClasses[size],
            positionClasses[position]
          )}
        >
          {status === 'online' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          )}
        </span>
      </div>
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {statusConfig[status].label}
        </span>
      )}
    </div>
  );
};