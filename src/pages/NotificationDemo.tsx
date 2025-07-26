import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info, Send } from 'lucide-react';
import { useNotifications } from '@contexts/NotificationContext';
import { Toast } from '@components/ui/Toast';
import { AlertBanner } from '@components/ui/AlertBanner';
import { useToast } from '@contexts/ToastContext';

const NotificationDemo: React.FC = () => {
  const { addNotification, showSystemAlert, notifications } = useNotifications();
  const { showToast } = useToast();

  const demoNotifications = [
    {
      type: 'info' as const,
      title: 'New Feature Available',
      message: 'Check out our new dashboard analytics!',
      icon: <Info className="w-5 h-5" />,
    },
    {
      type: 'success' as const,
      title: 'Order Confirmed',
      message: 'Your order #12345 has been confirmed and will be delivered tomorrow.',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      type: 'warning' as const,
      title: 'Storage Almost Full',
      message: 'You have used 90% of your storage quota. Consider upgrading your plan.',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      type: 'error' as const,
      title: 'Payment Failed',
      message: 'We couldn\'t process your payment. Please update your payment method.',
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ];

  const sendNotification = (notification: typeof demoNotifications[0]) => {
    addNotification({
      ...notification,
      actions: [
        {
          label: 'View Details',
          onClick: () => console.log('View details clicked'),
        },
      ],
    });
  };

  const showToastDemo = (type: 'info' | 'success' | 'warning' | 'error') => {
    const messages = {
      info: 'This is an informational message',
      success: 'Operation completed successfully!',
      warning: 'Please review this important information',
      error: 'An error occurred. Please try again.',
    };

    showToast({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1) + ' Toast',
      message: messages[type],
    });
  };

  const showSystemAlertDemo = (type: 'info' | 'success' | 'warning' | 'error') => {
    const alerts = {
      info: {
        title: 'Scheduled Maintenance',
        message: 'We\'ll be performing maintenance on Sunday from 2-4 AM EST.',
      },
      success: {
        title: 'System Updated',
        message: 'All systems have been successfully updated to the latest version.',
      },
      warning: {
        title: 'High Traffic Alert',
        message: 'We\'re experiencing higher than normal traffic. Response times may be slower.',
      },
      error: {
        title: 'Service Disruption',
        message: 'Some services are currently unavailable. We\'re working to restore them.',
      },
    };

    showSystemAlert({
      type,
      ...alerts[type],
      persistent: type === 'error',
      actions: [
        {
          label: 'Learn More',
          onClick: () => console.log('Learn more clicked'),
          primary: true,
        },
        {
          label: 'Dismiss',
          onClick: () => console.log('Dismissed'),
        },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Notification System Demo
          </h1>

          {/* Notification Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Current Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {notifications.length}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Unread</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Read</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-200">
                  {notifications.filter(n => n.read).length}
                </p>
              </div>
            </div>
          </div>

          {/* Notification Triggers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Send Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click the bell icon in the header to see notifications
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoNotifications.map((notification, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                      ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : ''}
                      ${notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : ''}
                      ${notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : ''}
                    `}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {notification.message}
                      </p>
                      <button
                        onClick={() => sendNotification(notification)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Send Notification
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toast Demos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Toast Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Temporary notifications that appear in the corner
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => showToastDemo('info')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Info Toast
              </button>
              <button
                onClick={() => showToastDemo('success')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Success Toast
              </button>
              <button
                onClick={() => showToastDemo('warning')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Warning Toast
              </button>
              <button
                onClick={() => showToastDemo('error')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Error Toast
              </button>
            </div>
          </div>

          {/* System Alert Demos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">System Alerts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Important system-wide messages that appear at the top of the page
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => showSystemAlertDemo('info')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Info Alert
              </button>
              <button
                onClick={() => showSystemAlertDemo('success')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Success Alert
              </button>
              <button
                onClick={() => showSystemAlertDemo('warning')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Warning Alert
              </button>
              <button
                onClick={() => showSystemAlertDemo('error')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Error Alert (Persistent)
              </button>
            </div>
          </div>

          {/* Alert Banner Examples */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Alert Banners</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Static alert banners for inline messages
            </p>
            <div className="space-y-4">
              <AlertBanner
                type="info"
                title="Information"
                message="This is an informational alert banner with an action button."
                action={{
                  label: 'Learn More',
                  onClick: () => console.log('Learn more clicked'),
                }}
              />
              <AlertBanner
                type="success"
                title="Success"
                message="Your changes have been saved successfully."
                dismissible={false}
              />
              <AlertBanner
                type="warning"
                title="Warning"
                message="Please review your settings before continuing."
              />
              <AlertBanner
                type="error"
                title="Error"
                message="There was an error processing your request. Please try again."
                action={{
                  label: 'Retry',
                  onClick: () => console.log('Retry clicked'),
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationDemo;