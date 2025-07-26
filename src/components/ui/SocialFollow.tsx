import React from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  UserPlus,
  Users,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface SocialFollowProps {
  platforms: PlatformFollowData[];
  variant?: 'default' | 'compact' | 'detailed';
  layout?: 'horizontal' | 'vertical' | 'grid';
  showFollowerCount?: boolean;
  className?: string;
}

export interface PlatformFollowData {
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin';
  username: string;
  url: string;
  followers?: number;
  verified?: boolean;
}

const platformConfig = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-blue-600',
    followText: 'Like',
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-sky-500 hover:bg-sky-600',
    textColor: 'text-sky-500',
    followText: 'Follow',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    textColor: 'text-pink-600',
    followText: 'Follow',
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600 hover:bg-red-700',
    textColor: 'text-red-600',
    followText: 'Subscribe',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700 hover:bg-blue-800',
    textColor: 'text-blue-700',
    followText: 'Follow',
  },
};

function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export const SocialFollow: React.FC<SocialFollowProps> = ({
  platforms,
  variant = 'default',
  layout = 'horizontal',
  showFollowerCount = true,
  className,
}) => {
  const containerClasses = {
    horizontal: 'flex flex-wrap gap-4',
    vertical: 'flex flex-col gap-4',
    grid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  };

  return (
    <div className={clsx(containerClasses[layout], className)}>
      {platforms.map((platform, index) => {
        const config = platformConfig[platform.platform];
        const Icon = config.icon;

        if (variant === 'compact') {
          return (
            <motion.a
              key={index}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-200',
                'hover:shadow-lg hover:scale-105',
                config.color
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{config.followText}</span>
            </motion.a>
          );
        }

        if (variant === 'detailed') {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx('p-3 rounded-lg text-white', config.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {config.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{platform.username}
                    </p>
                  </div>
                </div>
                {platform.verified && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              {showFollowerCount && platform.followers && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatFollowerCount(platform.followers)}
                    </span>
                    <span className="text-sm">followers</span>
                  </div>
                </div>
              )}

              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                  'text-white font-medium transition-all duration-200',
                  'hover:shadow-md hover:scale-105',
                  config.color
                )}
              >
                <UserPlus className="w-4 h-4" />
                {config.followText}
              </a>
            </motion.div>
          );
        }

        // Default variant
        return (
          <motion.a
            key={index}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className={clsx('p-2 rounded-lg text-white', config.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {config.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{platform.username}
              </p>
            </div>
            {showFollowerCount && platform.followers && (
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatFollowerCount(platform.followers)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  followers
                </p>
              </div>
            )}
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </motion.a>
        );
      })}
    </div>
  );
};

// Call to Action Component
interface SocialCTAProps {
  title?: string;
  description?: string;
  platforms: PlatformFollowData[];
  className?: string;
}

export const SocialCTA: React.FC<SocialCTAProps> = ({
  title = 'Follow Us',
  description = 'Stay updated with our latest news and updates',
  platforms,
  className,
}) => {
  return (
    <div className={clsx('text-center py-12', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        <SocialFollow
          platforms={platforms}
          variant="compact"
          layout="horizontal"
          showFollowerCount={false}
          className="justify-center"
        />
      </motion.div>
    </div>
  );
};