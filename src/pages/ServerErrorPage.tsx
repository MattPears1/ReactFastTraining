import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Home, AlertTriangle, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@components/ui/Button'

const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-bold text-red-600 dark:text-red-400 mb-4">
                500
              </h1>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400" />
              </motion.div>
            </div>
            <div className="w-24 h-1 bg-red-600 dark:bg-red-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Internal Server Error
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Oops! Something went wrong on our end. The issue has been logged and will be addressed promptly.
            </p>
          </motion.div>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left"
            >
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                Error Code: SERVER_ERROR_500
                <br />
                Timestamp: {new Date().toISOString()}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleRefresh}
              variant="outline"
              leftIcon={<RefreshCw />}
            >
              Try Again
            </Button>
            <Button
              href="/"
              leftIcon={<Home />}
            >
              Go to Homepage
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              If the problem persists, please contact us:
            </p>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <a
                href="mailto:support@example.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                support@example.com
              </a>
            </div>
          </motion.div>

          {/* Animated Background Elements */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          >
            <div className="absolute top-20 left-20 w-40 h-40 bg-red-500 rounded-full filter blur-3xl opacity-20" />
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-orange-500 rounded-full filter blur-3xl opacity-20" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ServerErrorPage