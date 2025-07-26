import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Home, LogIn, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@components/ui/Button'

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()

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
            <div className="relative inline-block">
              <h1 className="text-8xl md:text-9xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                403
              </h1>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <Lock className="w-20 h-20 text-orange-600 dark:text-orange-400" />
              </motion.div>
            </div>
            <div className="w-24 h-1 bg-orange-600 dark:bg-orange-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Access Forbidden
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              You don't have permission to access this resource. Please log in or contact an administrator if you believe this is an error.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              leftIcon={<ArrowLeft />}
            >
              Go Back
            </Button>
            <Button
              href="/login"
              variant="secondary"
              leftIcon={<LogIn />}
            >
              Log In
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
            className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Why am I seeing this?
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left max-w-md mx-auto">
              <li>• You need to be logged in to access this page</li>
              <li>• Your account doesn't have the required permissions</li>
              <li>• The link you followed may be outdated</li>
              <li>• There might be restrictions based on your location</li>
            </ul>
          </motion.div>

          {/* Decorative Lock Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
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
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut",
                }}
                className="absolute"
              >
                <Lock className="w-8 h-8 text-orange-300 dark:text-orange-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage