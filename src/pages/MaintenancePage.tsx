import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Clock, Bell, Twitter, MessageCircle } from 'lucide-react'
import Button from '@components/ui/Button'

const MaintenancePage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  // Estimated completion time (in a real app, this would come from an API)
  const estimatedTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // In a real app, this would send to an API
      setIsSubscribed(true)
      setTimeout(() => setIsSubscribed(false), 5000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="inline-block"
            >
              <Wrench className="w-24 h-24 text-primary-600 dark:text-primary-400" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              We'll Be Right Back!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We're currently performing scheduled maintenance to improve your experience. 
              Thank you for your patience.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              65% Complete
            </p>
          </motion.div>

          {/* Estimated Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Estimated completion: {estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </motion.div>

          {/* Email Notification Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get notified when we're back online
            </p>
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <Button
                  type="submit"
                  leftIcon={<Bell />}
                  variant="primary"
                >
                  Notify Me
                </Button>
              </div>
              {isSubscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-600 dark:text-green-400 mt-2"
                >
                  Thanks! We'll notify you when we're back.
                </motion.p>
              )}
            </form>
          </motion.div>

          {/* What We're Working On */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What we're working on:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400">✓</span>
                <span>Performance improvements for faster page loads</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400">✓</span>
                <span>Enhanced security features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400">⟳</span>
                <span>New features and UI improvements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">○</span>
                <span>Database optimization</span>
              </li>
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Follow us for updates:
            </p>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Animated Gears */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-10 right-10 opacity-10"
            >
              <Wrench className="w-32 h-32 text-primary-600" />
            </motion.div>
            <motion.div
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute bottom-10 left-10 opacity-10"
            >
              <Wrench className="w-24 h-24 text-primary-600" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaintenancePage