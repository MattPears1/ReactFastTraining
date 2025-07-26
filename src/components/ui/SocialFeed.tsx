import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram';
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  url: string;
}

interface SocialFeedProps {
  posts?: SocialPost[];
  platforms?: ('facebook' | 'twitter' | 'instagram')[];
  maxPosts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  className?: string;
  variant?: 'grid' | 'list' | 'carousel';
}

const platformIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
};

const platformColors = {
  facebook: 'text-blue-600',
  twitter: 'text-sky-500',
  instagram: 'text-pink-600',
};

// Mock posts for demonstration
const mockPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'twitter',
    author: {
      name: 'Lex Business',
      username: '@lexbusiness',
      avatar: 'https://via.placeholder.com/40',
    },
    content: 'Excited to announce our new product line! Check out our latest innovations that are designed to make your life easier. #Innovation #NewProducts',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: 45,
    comments: 12,
    shares: 8,
    url: 'https://twitter.com/lexbusiness/status/123456',
  },
  {
    id: '2',
    platform: 'instagram',
    author: {
      name: 'Lex Business',
      username: 'lexbusiness',
      avatar: 'https://via.placeholder.com/40',
    },
    content: 'Behind the scenes at our latest photoshoot! 📸 Can\'t wait to share what we\'ve been working on.',
    media: [
      {
        type: 'image',
        url: 'https://via.placeholder.com/400x300',
      },
    ],
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    likes: 234,
    comments: 28,
    shares: 15,
    url: 'https://instagram.com/p/123456',
  },
  {
    id: '3',
    platform: 'facebook',
    author: {
      name: 'Lex Business',
      username: 'lexbusiness',
      avatar: 'https://via.placeholder.com/40',
    },
    content: 'Thank you to all our customers for making this year amazing! We couldn\'t have done it without your support. Here\'s to an even better year ahead! 🎉',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 156,
    comments: 34,
    shares: 22,
    url: 'https://facebook.com/lexbusiness/posts/123456',
  },
];

export const SocialFeed: React.FC<SocialFeedProps> = ({
  posts = mockPosts,
  platforms,
  maxPosts = 6,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  onRefresh,
  loading = false,
  error,
  className,
  variant = 'grid',
}) => {
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    let filtered = posts;
    
    if (platforms && platforms.length > 0) {
      filtered = posts.filter(post => platforms.includes(post.platform));
    }
    
    if (selectedPlatform) {
      filtered = filtered.filter(post => post.platform === selectedPlatform);
    }
    
    setFilteredPosts(filtered.slice(0, maxPosts));
  }, [posts, platforms, selectedPlatform, maxPosts]);

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, onRefresh]);

  const handleRefresh = () => {
    onRefresh?.();
  };

  if (error) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Failed to load social media posts
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Social Media Feed
          </h3>
          {/* Platform Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform(null)}
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                !selectedPlatform
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              All
            </button>
            {['facebook', 'twitter', 'instagram'].map((platform) => {
              const Icon = platformIcons[platform as keyof typeof platformIcons];
              return (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={clsx(
                    'p-1.5 rounded-full transition-colors',
                    selectedPlatform === platform
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                  aria-label={`Filter by ${platform}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            loading && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Refresh feed"
        >
          <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Posts */}
      {loading && filteredPosts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {variant === 'grid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredPosts.map((post, index) => (
                <SocialPostCard key={post.id} post={post} index={index} />
              ))}
            </motion.div>
          )}

          {variant === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredPosts.map((post, index) => (
                <SocialPostCard key={post.id} post={post} index={index} variant="list" />
              ))}
            </motion.div>
          )}

          {variant === 'carousel' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto pb-4"
            >
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {filteredPosts.map((post, index) => (
                  <div key={post.id} className="w-80 flex-shrink-0">
                    <SocialPostCard post={post} index={index} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {filteredPosts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No social media posts to display
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Post Card Component
interface SocialPostCardProps {
  post: SocialPost;
  index: number;
  variant?: 'grid' | 'list';
}

const SocialPostCard: React.FC<SocialPostCardProps> = ({ post, index, variant = 'grid' }) => {
  const Icon = platformIcons[post.platform];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden',
        'hover:shadow-lg transition-shadow duration-200',
        variant === 'list' && 'flex gap-4'
      )}
    >
      {/* Media (if exists) */}
      {post.media && post.media.length > 0 && variant === 'grid' && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
          <img
            src={post.media[0].url}
            alt="Post media"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar || 'https://via.placeholder.com/40'}
              alt={post.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {post.author.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {post.author.username}
              </p>
            </div>
          </div>
          <Icon className={clsx('w-5 h-5', platformColors[post.platform])} />
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
          {post.content}
        </p>

        {/* Media (if exists and list variant) */}
        {post.media && post.media.length > 0 && variant === 'list' && (
          <div className="mb-3">
            <img
              src={post.media[0].url}
              alt="Post media"
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              {post.shares}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(post.timestamp, { addSuffix: true })}
            </span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="View on social media"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
};