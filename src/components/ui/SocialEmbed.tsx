import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export interface SocialEmbedProps {
  url: string;
  platform?: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface EmbedConfig {
  getEmbedUrl: (url: string, options?: any) => string;
  defaultHeight: number;
  scriptSrc?: string;
  scriptId?: string;
}

const embedConfigs: Record<string, EmbedConfig> = {
  twitter: {
    getEmbedUrl: (url) => {
      const tweetId = url.match(/status\/(\d+)/)?.[1];
      return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
    },
    defaultHeight: 500,
    scriptSrc: 'https://platform.twitter.com/widgets.js',
    scriptId: 'twitter-wjs',
  },
  youtube: {
    getEmbedUrl: (url) => {
      const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&\n?#]+)/)?.[1];
      return `https://www.youtube.com/embed/${videoId}`;
    },
    defaultHeight: 315,
  },
  facebook: {
    getEmbedUrl: (url) => {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true`;
    },
    defaultHeight: 500,
    scriptSrc: 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v15.0',
    scriptId: 'facebook-jssdk',
  },
  instagram: {
    getEmbedUrl: (url) => {
      const postId = url.match(/\/p\/([^/]+)/)?.[1];
      return `https://www.instagram.com/p/${postId}/embed`;
    },
    defaultHeight: 600,
    scriptSrc: 'https://www.instagram.com/embed.js',
  },
  linkedin: {
    getEmbedUrl: (url) => {
      return `https://www.linkedin.com/embed/feed/update/${encodeURIComponent(url)}`;
    },
    defaultHeight: 500,
  },
  tiktok: {
    getEmbedUrl: (url) => {
      const videoId = url.match(/video\/(\d+)/)?.[1];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    },
    defaultHeight: 700,
    scriptSrc: 'https://www.tiktok.com/embed.js',
  },
};

function detectPlatform(url: string): string | null {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return null;
}

export const SocialEmbed: React.FC<SocialEmbedProps> = ({
  url,
  platform,
  width = '100%',
  height,
  theme = 'light',
  className,
  onLoad,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const detectedPlatform = platform || detectPlatform(url);
  const config = detectedPlatform ? embedConfigs[detectedPlatform] : null;

  useEffect(() => {
    if (!config) {
      setError('Unsupported platform or invalid URL');
      setLoading(false);
      return;
    }

    // Load platform-specific scripts if needed
    if (config.scriptSrc && typeof window !== 'undefined') {
      const existingScript = config.scriptId 
        ? document.getElementById(config.scriptId)
        : document.querySelector(`script[src="${config.scriptSrc}"]`);

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = config.scriptSrc;
        script.async = true;
        if (config.scriptId) {
          script.id = config.scriptId;
        }
        document.body.appendChild(script);
      }
    }
  }, [config]);

  const handleIframeLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleIframeError = () => {
    const err = new Error('Failed to load embed');
    setError('Failed to load social media content');
    setLoading(false);
    onError?.(err);
  };

  if (!detectedPlatform || !config) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Unable to embed this content
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          View on {detectedPlatform || 'social media'}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {error}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          View on {detectedPlatform}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  const embedUrl = config.getEmbedUrl(url, { theme });
  const embedHeight = height || config.defaultHeight;

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        className
      )}
      style={{ width, height: embedHeight }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      <motion.iframe
        ref={iframeRef}
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
        title={`Embedded ${detectedPlatform} content`}
      />
    </div>
  );
};

// Lazy Loading Wrapper
interface LazyEmbedProps extends SocialEmbedProps {
  placeholder?: React.ReactNode;
}

export const LazySocialEmbed: React.FC<LazyEmbedProps> = ({
  placeholder,
  ...embedProps
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        <SocialEmbed {...embedProps} />
      ) : (
        placeholder || (
          <div
            className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
            style={{ width: embedProps.width || '100%', height: embedProps.height || 400 }}
          >
            <p className="text-gray-500 dark:text-gray-400">
              Click to load {embedProps.platform || 'social media'} content
            </p>
          </div>
        )
      )}
    </div>
  );
};