import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, CheckCircle } from 'lucide-react'
import Button from './Button'
import { usePWA } from '@/hooks/usePWA'
import { cn } from '@/utils/cn'

interface PWAInstallPromptProps {
  className?: string
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className }) => {
  const { canInstall, isInstalled, promptInstall } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installSuccess, setInstallSuccess] = useState(false)

  useEffect(() => {
    // Show prompt after user has been on site for 30 seconds
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])

  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await promptInstall()
    
    if (success) {
      setInstallSuccess(true)
      setTimeout(() => {
        setShowPrompt(false)
      }, 3000)
    } else {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!canInstall || isInstalled) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
            className
          )}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            {installSuccess ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Installation Successful!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can now use our app offline
                </p>
              </motion.div>
            ) : (
              <>
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Smartphone className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Install Our App
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Get quick access and work offline by installing our app on your device.
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleInstall}
                        disabled={isInstalling}
                        leftIcon={<Download />}
                      >
                        {isInstalling ? 'Installing...' : 'Install Now'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                      >
                        Maybe Later
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mini install button for header/footer
export const PWAInstallButton: React.FC<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}> = ({ variant = 'ghost', size = 'sm', className }) => {
  const { canInstall, isInstalled, promptInstall } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)

  if (!canInstall || isInstalled) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    await promptInstall()
    setIsInstalling(false)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      disabled={isInstalling}
      leftIcon={<Download />}
      className={className}
    >
      {isInstalling ? 'Installing...' : 'Install App'}
    </Button>
  )
}

// Update notification for new app version
export const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true)
      })
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-primary-600 dark:bg-primary-500 text-white p-4"
        >
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm font-medium">
              A new version of the app is available!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUpdate}
              >
                Update Now
              </Button>
              <button
                onClick={() => setShowUpdate(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PWAInstallPrompt