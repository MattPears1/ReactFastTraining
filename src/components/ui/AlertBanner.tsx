import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
    external?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  fullWidth?: boolean;
}

const defaultIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const alertStyles = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
    button: 'text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100 bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-800/50',
    close: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
    button: 'text-green-800 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100 bg-green-100 dark:bg-green-800/30 hover:bg-green-200 dark:hover:bg-green-800/50',
    close: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    message: 'text-yellow-700 dark:text-yellow-300',
    button: 'text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50',
    close: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
    button: 'text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50',
    close: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
  icon,
  className,
  position = 'top',
  fullWidth = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icon || defaultIcons[type];
  const styles = alertStyles[type];

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.3 }}
          className={clsx(
            'relative border',
            fullWidth ? 'w-full' : 'max-w-2xl mx-auto',
            styles.container,
            className
          )}
        >
          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-start">
              {Icon && (
                <div className="flex-shrink-0">
                  {typeof Icon === 'function' ? (
                    <Icon className={clsx('h-5 w-5', styles.icon)} aria-hidden="true" />
                  ) : (
                    Icon
                  )}
                </div>
              )}
              <div className="ml-3 flex-1">
                <h3 className={clsx('text-sm font-medium', styles.title)}>
                  {title}
                </h3>
                {message && (
                  <div className={clsx('mt-1 text-sm', styles.message)}>
                    <p>{message}</p>
                  </div>
                )}
                {action && (
                  <div className="mt-3">
                    <button
                      onClick={action.onClick}
                      className={clsx(
                        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        styles.button
                      )}
                    >
                      {action.label}
                      {action.external && (
                        <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {dismissible && (
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className={clsx(
                        'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                        styles.close
                      )}
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// System-wide alert banner for critical messages
interface SystemAlertProps {
  show: boolean;
  type: AlertType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({
  show,
  type,
  title,
  message,
  onDismiss,
  persistent = false,
  actions,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className={clsx(
            'px-4 py-3 sm:px-6 shadow-lg',
            alertStyles[type].container
          )}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center">
                  {React.createElement(defaultIcons[type], {
                    className: clsx('h-5 w-5 mr-3', alertStyles[type].icon),
                    'aria-hidden': true
                  })}
                  <div>
                    <p className={clsx('font-medium', alertStyles[type].title)}>
                      {title}
                    </p>
                    {message && (
                      <p className={clsx('mt-1 text-sm', alertStyles[type].message)}>
                        {message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-3">
                  {actions?.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={clsx(
                        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        action.primary
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                          : alertStyles[type].button
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                  {!persistent && onDismiss && (
                    <button
                      onClick={onDismiss}
                      className={clsx(
                        'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                        alertStyles[type].close
                      )}
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};