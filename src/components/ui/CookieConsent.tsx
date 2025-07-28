import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  X,
  Shield,
  BarChart3,
  Megaphone,
  Settings,
} from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";
import { cn } from "@/utils/cn";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentProps {
  position?: "bottom" | "top" | "center";
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  onAccept?: (preferences: CookiePreferences) => void;
  onDecline?: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({
  position = "bottom",
  privacyPolicyUrl = "/privacy-policy",
  cookiePolicyUrl = "/cookie-policy",
  onAccept,
  onDecline,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
    onAccept?.(allAccepted);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
    onAccept?.(preferences);
  };

  const handleDeclineAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(onlyNecessary);
    onDecline?.();
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
    setShowSettings(false);

    // Emit custom event for analytics to update
    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated", { detail: prefs }),
    );
  };

  const positionClasses = {
    bottom: "bottom-0 left-0 right-0",
    top: "top-0 left-0 right-0",
    center:
      "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl",
  };

  const cookieCategories = [
    {
      id: "necessary",
      name: "Necessary Cookies",
      description:
        "These cookies are essential for the website to function properly.",
      icon: Shield,
      required: true,
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
      icon: BarChart3,
      required: false,
    },
    {
      id: "marketing",
      name: "Marketing Cookies",
      description:
        "Used to track visitors across websites for marketing purposes.",
      icon: Megaphone,
      required: false,
    },
    {
      id: "preferences",
      name: "Preference Cookies",
      description: "Remember your preferences and personalization choices.",
      icon: Settings,
      required: false,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              y: position === "bottom" ? 100 : position === "top" ? -100 : 0,
              opacity: position === "center" ? 0 : 1,
            }}
            animate={{ y: 0, opacity: 1 }}
            exit={{
              y: position === "bottom" ? 100 : position === "top" ? -100 : 0,
              opacity: position === "center" ? 0 : 1,
            }}
            className={cn(
              "fixed z-50 p-4",
              positionClasses[position],
              position !== "center" && "shadow-lg",
            )}
          >
            <div
              className={cn(
                "bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
                position === "center" ? "p-8" : "p-6",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Cookie className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    We use cookies to enhance your browsing experience, serve
                    personalized content, and analyze our traffic. By clicking
                    "Accept All", you consent to our use of cookies. You can
                    manage your preferences by clicking "Cookie Settings".
                  </p>

                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAcceptAll}
                      >
                        Accept All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeclineAll}
                      >
                        Decline All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSettings(true)}
                      >
                        Cookie Settings
                      </Button>
                    </div>

                    <div className="flex gap-4 text-xs">
                      <a
                        href={privacyPolicyUrl}
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      <a
                        href={cookiePolicyUrl}
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Cookie Policy
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsVisible(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Cookie Settings"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose which cookies you want to accept. Your choice will be saved
            for one year.
          </p>

          <div className="space-y-4">
            {cookieCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          preferences[category.id as keyof CookiePreferences]
                        }
                        onChange={(e) => {
                          if (!category.required) {
                            setPreferences({
                              ...preferences,
                              [category.id]: e.target.checked,
                            });
                          }
                        }}
                        disabled={category.required}
                        className="sr-only peer"
                      />
                      <div
                        className={cn(
                          "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600",
                          category.required
                            ? "opacity-50 cursor-not-allowed"
                            : "peer-checked:bg-primary-600",
                        )}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAcceptSelected}>
              Save Preferences
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Cookie management utilities
export const getCookieConsent = (): CookiePreferences | null => {
  const consent = localStorage.getItem("cookie-consent");
  return consent ? JSON.parse(consent) : null;
};

export const hasCookieConsent = (
  category: keyof CookiePreferences,
): boolean => {
  const consent = getCookieConsent();
  return consent ? consent[category] : false;
};

export const clearCookieConsent = () => {
  localStorage.removeItem("cookie-consent");
  localStorage.removeItem("cookie-consent-date");
  window.location.reload();
};

export default CookieConsent;
