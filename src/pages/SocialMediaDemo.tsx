import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, MessageCircle, TrendingUp } from 'lucide-react';
import { SocialShare } from '@components/ui/SocialShare';
import { SocialLinks, SocialBar } from '@components/ui/SocialLinks';
import { SocialFeed } from '@components/ui/SocialFeed';
import { SocialEmbed, LazySocialEmbed } from '@components/ui/SocialEmbed';
import { SocialFollow, SocialCTA } from '@components/ui/SocialFollow';

const SocialMediaDemo: React.FC = () => {
  // Demo data
  const socialLinks = [
    { platform: 'facebook' as const, url: 'https://facebook.com/lexbusiness' },
    { platform: 'twitter' as const, url: 'https://twitter.com/lexbusiness' },
    { platform: 'instagram' as const, url: 'https://instagram.com/lexbusiness' },
    { platform: 'linkedin' as const, url: 'https://linkedin.com/company/lexbusiness' },
    { platform: 'youtube' as const, url: 'https://youtube.com/lexbusiness' },
  ];

  const followPlatforms = [
    {
      platform: 'facebook' as const,
      username: 'lexbusiness',
      url: 'https://facebook.com/lexbusiness',
      followers: 15420,
      verified: true,
    },
    {
      platform: 'twitter' as const,
      username: 'lexbusiness',
      url: 'https://twitter.com/lexbusiness',
      followers: 8932,
      verified: true,
    },
    {
      platform: 'instagram' as const,
      username: 'lexbusiness',
      url: 'https://instagram.com/lexbusiness',
      followers: 24567,
      verified: false,
    },
    {
      platform: 'youtube' as const,
      username: 'LexBusinessOfficial',
      url: 'https://youtube.com/lexbusiness',
      followers: 5021,
      verified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Social Media Integration Demo
          </h1>

          {/* Social Share Buttons */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-primary-600" />
              Share Buttons
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Default Variant</h3>
                <SocialShare
                  url="https://example.com/product"
                  title="Check out this amazing product!"
                  description="Discover our latest innovation"
                  hashtags={['innovation', 'tech']}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Minimal Variant</h3>
                <SocialShare
                  variant="minimal"
                  platforms={['facebook', 'twitter', 'linkedin', 'email']}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">With Labels</h3>
                <SocialShare
                  showLabels
                  size="lg"
                  platforms={['whatsapp', 'telegram', 'email', 'copy']}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Floating Action Button</h3>
                <div className="relative h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500">Content area</p>
                  <SocialShare variant="floating" className="absolute bottom-4 right-4" />
                </div>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              Social Links
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Default Style</h3>
                <SocialLinks links={socialLinks} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Colored Style</h3>
                <SocialLinks links={socialLinks} variant="colored" />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Minimal Style with Labels</h3>
                <SocialLinks links={socialLinks} variant="minimal" showLabels />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Vertical Orientation</h3>
                <SocialLinks links={socialLinks} orientation="vertical" variant="colored" />
              </div>
            </div>
          </section>

          {/* Social Follow */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              Follow Buttons
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3">Default Variant</h3>
                <SocialFollow platforms={followPlatforms} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Compact Variant</h3>
                <SocialFollow platforms={followPlatforms} variant="compact" />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Detailed Variant</h3>
                <SocialFollow platforms={followPlatforms} variant="detailed" layout="grid" />
              </div>
            </div>
          </section>

          {/* Social Feed */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary-600" />
              Social Feed
            </h2>
            <SocialFeed variant="grid" />
          </section>

          {/* Social Embeds */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Social Media Embeds</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Embed social media content directly into your pages
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">YouTube Video</h3>
                <LazySocialEmbed
                  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  height={400}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Twitter/X Post</h3>
                <div className="max-w-xl">
                  <SocialEmbed
                    url="https://twitter.com/elonmusk/status/1234567890"
                    platform="twitter"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Social CTA */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <SocialCTA
              title="Connect With Us"
              description="Join our community and stay updated with the latest news, products, and special offers"
              platforms={followPlatforms}
            />
          </section>

          {/* Fixed Social Bar Example */}
          <SocialBar
            links={socialLinks.slice(0, 3)}
            position="right"
            fixed={false}
            className="md:fixed"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SocialMediaDemo;