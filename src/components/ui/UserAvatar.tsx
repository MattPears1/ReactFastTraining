import React from 'react';
import { User } from 'lucide-react';
import { clsx } from 'clsx';

export interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  shape?: 'circle' | 'square';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User avatar',
  name,
  size = 'md',
  status,
  shape = 'circle',
  className,
  onClick,
}) => {
  const isClickable = !!onClick;
  const initials = name ? getInitials(name) : '';
  const bgColor = name ? getColorFromName(name) : 'bg-gray-400';

  return (
    <div className="relative inline-block">
      <button
        onClick={onClick}
        disabled={!isClickable}
        className={clsx(
          'relative overflow-hidden bg-gray-200 dark:bg-gray-700',
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          isClickable && 'cursor-pointer hover:opacity-90 transition-opacity',
          !isClickable && 'cursor-default',
          className
        )}
        aria-label={alt}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          <div
            className={clsx(
              'w-full h-full flex items-center justify-center text-white font-medium',
              bgColor
            )}
          >
            {initials}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <User className="w-1/2 h-1/2" />
          </div>
        )}
      </button>

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
            statusColors[status],
            statusSizes[size]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

// Avatar Group Component
export interface AvatarGroupProps {
  users: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: UserAvatarProps['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'md',
  className,
}) => {
  const displayUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {displayUsers.map((user, index) => (
        <div
          key={index}
          className="relative ring-2 ring-white dark:ring-gray-900 rounded-full"
          style={{ zIndex: displayUsers.length - index }}
        >
          <UserAvatar
            src={user.src}
            name={user.name}
            alt={user.alt}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'relative flex items-center justify-center',
            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
            'font-medium rounded-full ring-2 ring-white dark:ring-gray-900',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};