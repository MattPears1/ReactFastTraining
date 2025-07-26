import React from 'react'
import { motion } from 'framer-motion'
import { WifiOff, RefreshCw, Download, Smartphone } from 'lucide-react'
import Button from '@components/ui/Button'

const OfflinePage: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block"
            >
              <WifiOff className="w-24 h-24 text-gray-400 dark:text-gray-600" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              You're Offline
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              It looks like you've lost your internet connection. 
              Please check your connection and try again.
            </p>
          </motion.div>

          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                No Internet Connection
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Last online: {new Date().toLocaleTimeString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              onClick={handleRefresh}
              variant="primary"
              leftIcon={<RefreshCw />}
            >
              Try Again
            </Button>
          </motion.div>

          {/* Offline Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Available Offline Features:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Download className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Cached Pages
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View previously visited pages
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  App Features
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basic app functionality available
                </p>
              </div>
            </div>
          </motion.div>

          {/* Troubleshooting Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Troubleshooting Tips:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left max-w-md mx-auto">
              <li>• Check your Wi-Fi or mobile data connection</li>
              <li>• Try moving closer to your router</li>
              <li>• Restart your device</li>
              <li>• Check if airplane mode is turned off</li>
              <li>• Contact your internet service provider</li>
            </ul>
          </motion.div>

          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.1, 0],
                  scale: [0, 1, 0],
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
                className="absolute"
              >
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflinePage