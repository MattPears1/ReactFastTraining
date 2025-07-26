import React from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Globe,
  MessageCircle,
  Send,
  MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label?: string;
}

export type SocialPlatform = 
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'github'
  | 'whatsapp'
  | 'telegram'
  | 'tiktok'
  | 'pinterest'
  | 'website';

interface SocialLinksProps {
  links: SocialLink[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'colored';
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const platformIcons: Record<SocialPlatform, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
  telegram: Send,
  tiktok: Globe, // Using Globe as placeholder
  pinterest: MapPin, // Using MapPin as placeholder
  website: Globe,
};

const platformColors: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-600 hover:bg-blue-700',
  twitter: 'bg-sky-500 hover:bg-sky-600',
  instagram: 'bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
  linkedin: 'bg-blue-700 hover:bg-blue-800',
  youtube: 'bg-red-600 hover:bg-red-700',
  github: 'bg-gray-800 hover:bg-gray-900',
  whatsapp: 'bg-green-600 hover:bg-green-700',
  telegram: 'bg-blue-500 hover:bg-blue-600',
  tiktok: 'bg-black hover:bg-gray-900',
  pinterest: 'bg-red-700 hover:bg-red-800',
  website: 'bg-gray-700 hover:bg-gray-800',
};

const sizeClasses = {
  sm: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  md: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
  lg: {
    button: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-lg',
  },
};

export const SocialLinks: React.FC<SocialLinksProps> = ({
  links,
  size = 'md',
  variant = 'default',
  showLabels = false,
  orientation = 'horizontal',
  className,
}) => {
  const sizes = sizeClasses[size];

  return (
    <div
      className={clsx(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center gap-3' : 'flex-col gap-3',
        className
      )}
    >
      {links.map((link, index) => {
        const Icon = platformIcons[link.platform];
        const label = link.label || link.platform.charAt(0).toUpperCase() + link.platform.slice(1);

        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'group flex items-center gap-2 transition-all duration-200',
              showLabels ? 'px-4 py-2 rounded-lg' : 'rounded-full',
              !showLabels && sizes.button,
              variant === 'default' && clsx(
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-200 dark:hover:bg-gray-700',
                'hover:shadow-md'
              ),
              variant === 'minimal' && clsx(
                'text-gray-600 dark:text-gray-400',
                'hover:text-gray-900 dark:hover:text-white',
                'hover:scale-110'
              ),
              variant === 'colored' && clsx(
                'text-white',
                platformColors[link.platform],
                'hover:shadow-lg hover:scale-105'
              )
            )}
            aria-label={`Visit our ${label} page`}
          >
            <Icon className={sizes.icon} />
            {showLabels && (
              <span className={clsx('font-medium', sizes.text)}>
                {label}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
};

// Social Links Bar Component
interface SocialBarProps {
  links: SocialLink[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  fixed?: boolean;
  className?: string;
}

export const SocialBar: React.FC<SocialBarProps> = ({
  links,
  position = 'left',
  fixed = true,
  className,
}) => {
  const positionClasses = {
    top: 'top-0 left-0 right-0 flex-row justify-center',
    bottom: 'bottom-0 left-0 right-0 flex-row justify-center',
    left: 'left-0 top-1/2 -translate-y-1/2 flex-col',
    right: 'right-0 top-1/2 -translate-y-1/2 flex-col',
  };

  return (
    <div
      className={clsx(
        'flex gap-2 p-4',
        fixed && 'fixed z-40',
        positionClasses[position],
        (position === 'left' || position === 'right') && 'bg-white dark:bg-gray-800 shadow-lg rounded-r-lg',
        (position === 'top' || position === 'bottom') && 'bg-white dark:bg-gray-800 shadow-lg',
        className
      )}
    >
      <SocialLinks
        links={links}
        size="sm"
        variant="colored"
        orientation={position === 'left' || position === 'right' ? 'vertical' : 'horizontal'}
      />
    </div>
  );
};