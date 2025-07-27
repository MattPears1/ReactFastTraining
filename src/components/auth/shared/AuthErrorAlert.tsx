import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, XCircle } from 'lucide-react';
import { ApiError } from '@/types/auth.types';

interface AuthErrorAlertProps {
  error: string | ApiError | null;
  onClose?: () => void;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isLockout = typeof error === 'object' && error.code === 'auth/account-locked';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-lg flex items-start gap-3 ${
        isLockout 
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {isLockout ? (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={`text-sm ${
          isLockout 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-amber-600 dark:text-amber-400'
        }`}>
          {errorMessage}
        </p>
        {isLockout && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Please reset your password to regain access to your account.
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close alert"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};