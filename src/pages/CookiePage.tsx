import React from "react";
import { motion } from "framer-motion";
import { Cookie, Info, Settings, Shield } from "lucide-react";
import SEO from "@components/common/SEO";

const CookiePage: React.FC = () => {
  return (
    <div>
      <SEO
        title="Cookie Policy | React Fast Training"
        description="Learn about how React Fast Training uses cookies on our website. Information about cookie types, usage, and management."
        keywords="cookie policy, cookies, privacy, React Fast Training"
        canonical="/cookies"
      />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Cookie className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              How we use cookies to improve your experience
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device (computer, tablet or mobile) when you visit a website. They help the website remember your actions and preferences over time to provide a better user experience.
            </p>
            <p>
              Cookies may be set by the website you are visiting ("first-party cookies") or by third parties, such as analytics or advertising services ("third-party cookies").
            </p>

            <h2>How We Use Cookies</h2>
            <p>React Fast Training uses cookies to:</p>
            <ul>
              <li>Ensure the website functions correctly</li>
              <li>Analyse website traffic and improve performance</li>
              <li>Enable content sharing via social media platforms</li>
            </ul>
            <p className="font-medium">
              We do not use cookies to collect personal information or to share your data with advertisers.
            </p>

            <h2>Types of Cookies We Use</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Essential cookies
                  </p>
                  <p className="text-blue-800 dark:text-blue-300">
                    Required for core site functionality, such as navigation or form submission
                  </p>
                </div>
              </div>
            </div>

            <h2>Managing Cookies</h2>
            <p>
              When you first visit our site, we will ask for your consent to use non-essential cookies. You can change or withdraw your consent at any time.
            </p>
            <p>
              You can also control and manage cookies in your browser settings. For example, you can:
            </p>
            <ul>
              <li>Delete existing cookies</li>
              <li>Block all cookies</li>
              <li>Receive a warning before cookies are set</li>
            </ul>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-6">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-0">
                <strong>Please note:</strong> Disabling certain cookies may affect website functionality.
              </p>
            </div>

            <h2>More Information</h2>
            <p>
              For further details about how we handle your personal data, please refer to our <a href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>.
            </p>
            <p>
              You can also learn more about cookies and how to manage them at:
            </p>
            <ul>
              <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">www.allaboutcookies.org</a></li>
              <li><a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">www.youronlinechoices.eu</a></li>
            </ul>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Cookies Policy or your data, please contact:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <p className="mb-2"><strong>React Fast Training</strong></p>
              <p className="mb-1">Email: <a href="mailto:info@reactfasttraining.co.uk" className="text-primary-600 hover:text-primary-700">info@reactfasttraining.co.uk</a></p>
              <p>Website: <a href="https://www.reactfasttraining.co.uk" className="text-primary-600 hover:text-primary-700">www.reactfasttraining.co.uk</a></p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiePage;