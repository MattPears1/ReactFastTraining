import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import Button from '@components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export const SessionTimeoutWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionExpiring = (event: CustomEvent) => {
      setMinutesLeft(event.detail.minutesLeft);
      setShowWarning(true);
    };

    window.addEventListener('auth:session-expiring-soon', handleSessionExpiring as EventListener);

    return () => {
      window.removeEventListener('auth:session-expiring-soon', handleSessionExpiring as EventListener);
    };
  }, []);

  const handleExtendSession = async () => {
    // TODO: Implement session extension when refresh token is available
    setShowWarning(false);
    window.location.reload(); // Temporary solution - reload to re-authenticate
  };

  const handleLogout = async () => {
    setShowWarning(false);
    await logout();
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}. 
                  Would you like to stay logged in?
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExtendSession}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Stay Logged In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};