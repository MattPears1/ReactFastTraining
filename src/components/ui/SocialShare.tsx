import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  Link2,
  Share2,
  Check,
  MessageCircle,
  Send,
} from "lucide-react";
import { clsx } from "clsx";

export interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  platforms?: SocialPlatform[];
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "floating";
  showLabels?: boolean;
  className?: string;
  onShare?: (platform: SocialPlatform) => void;
}

export type SocialPlatform =
  | "facebook"
  | "twitter"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "email"
  | "copy";

interface PlatformConfig {
  name: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  shareUrl: (params: ShareParams) => string;
}

interface ShareParams {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
}

const platformConfigs: Record<SocialPlatform, PlatformConfig> = {
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "hover:bg-blue-600 hover:text-white",
    shareUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "hover:bg-sky-500 hover:text-white",
    shareUrl: ({ url, title, hashtags, via }) => {
      const params = new URLSearchParams();
      params.set("url", url);
      params.set("text", title);
      if (hashtags?.length) params.set("hashtags", hashtags.join(","));
      if (via) params.set("via", via);
      return `https://twitter.com/intent/tweet?${params.toString()}`;
    },
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "hover:bg-blue-700 hover:text-white",
    shareUrl: ({ url, title, description }) => {
      const params = new URLSearchParams();
      params.set("url", url);
      params.set("title", title);
      if (description) params.set("summary", description);
      return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
    },
  },
  whatsapp: {
    name: "WhatsApp",
    icon: MessageCircle,
    color: "hover:bg-green-600 hover:text-white",
    shareUrl: ({ url, title }) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  telegram: {
    name: "Telegram",
    icon: Send,
    color: "hover:bg-blue-500 hover:text-white",
    shareUrl: ({ url, title }) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  email: {
    name: "Email",
    icon: Mail,
    color: "hover:bg-gray-700 hover:text-white",
    shareUrl: ({ url, title, description }) => {
      const subject = encodeURIComponent(title);
      const body = encodeURIComponent(`${description || title}\n\n${url}`);
      return `mailto:?subject=${subject}&body=${body}`;
    },
  },
  copy: {
    name: "Copy Link",
    icon: Link2,
    color: "hover:bg-gray-700 hover:text-white",
    shareUrl: ({ url }) => url,
  },
};

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export const SocialShare: React.FC<SocialShareProps> = ({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = typeof window !== "undefined" ? document.title : "",
  description,
  hashtags,
  via,
  platforms = ["facebook", "twitter", "linkedin", "whatsapp", "copy"],
  size = "md",
  variant = "default",
  showLabels = false,
  className,
  onShare,
}) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = async (platform: SocialPlatform) => {
    const config = platformConfigs[platform];
    const shareUrl = config.shareUrl({
      url,
      title,
      description,
      hashtags,
      via,
    });

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    } else {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }

    onShare?.(platform);
    setShowShareMenu(false);
  };

  if (variant === "floating") {
    return (
      <div className={clsx("relative", className)}>
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className={clsx(
            "flex items-center justify-center rounded-full",
            "bg-primary-600 text-white shadow-lg",
            "hover:bg-primary-700 transition-all duration-200",
            "hover:shadow-xl hover:scale-110",
            sizeClasses[size],
          )}
          aria-label="Share"
        >
          <Share2 className={iconSizeClasses[size]} />
        </button>

        <AnimatePresence>
          {showShareMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2"
            >
              <div className="flex flex-col gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                {platforms.map((platform) => {
                  const config = platformConfigs[platform];
                  const Icon = config.icon;
                  const isCopied = copiedPlatform === platform;

                  return (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className={clsx(
                        "flex items-center justify-center rounded-full",
                        "bg-gray-100 dark:bg-gray-700 transition-all duration-200",
                        config.color,
                        sizeClasses[size],
                      )}
                      aria-label={`Share on ${config.name}`}
                    >
                      {isCopied ? (
                        <Check className={iconSizeClasses[size]} />
                      ) : (
                        <Icon className={iconSizeClasses[size]} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center",
        showLabels ? "flex-col sm:flex-row gap-4" : "gap-2",
        className,
      )}
    >
      {platforms.map((platform) => {
        const config = platformConfigs[platform];
        const Icon = config.icon;
        const isCopied = copiedPlatform === platform;

        return (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={clsx(
              "group flex items-center gap-2 transition-all duration-200",
              variant === "minimal"
                ? clsx(
                    "rounded-full p-2",
                    "text-gray-600 dark:text-gray-400",
                    config.color,
                  )
                : clsx(
                    "rounded-lg px-3 py-2",
                    "bg-gray-100 dark:bg-gray-800",
                    "text-gray-700 dark:text-gray-300",
                    "hover:shadow-md",
                    config.color,
                  ),
              !showLabels && sizeClasses[size],
            )}
            aria-label={`Share on ${config.name}`}
          >
            {isCopied ? (
              <Check className={iconSizeClasses[size]} />
            ) : (
              <Icon className={iconSizeClasses[size]} />
            )}
            {showLabels && (
              <span className="text-sm font-medium">
                {isCopied ? "Copied!" : config.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
