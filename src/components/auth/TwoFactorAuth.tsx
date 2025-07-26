import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@components/ui/Button'
import { cn } from '@/utils/cn'

interface TwoFactorAuthProps {
  mode?: 'setup' | 'verify'
  qrCodeUrl?: string
  secretKey?: string
  onVerify?: (code: string) => Promise<void>
  onSkip?: () => void
  className?: string
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  mode = 'setup',
  qrCodeUrl,
  secretKey,
  onVerify,
  onSkip,
  className,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('')
      const newCode = [...code]
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit
        }
      })
      setCode(newCode)
      const nextIndex = Math.min(index + pastedCode.length, 5)
      inputRefs.current[nextIndex]?.focus()
    } else {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter a complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (onVerify) {
        await onVerify(fullCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (secretKey) {
      navigator.clipboard.writeText(secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (mode === 'setup') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('w-full max-w-md', className)}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Set up Two-Factor Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: QR Code */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Step 1: Scan QR Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 bg-white p-2 rounded"
                />
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Can't scan? Enter this code manually:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {secretKey}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Verify */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Step 2: Enter Verification Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit code from your authenticator app:
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-center gap-2 mb-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={cn(
                    'w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg',
                    'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    error
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-700'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleVerify}
              disabled={isLoading || code.join('').length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Enable 2FA'}
            </Button>
            {onSkip && (
              <Button
                variant="outline"
                size="lg"
                onClick={onSkip}
              >
                Skip
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Verify mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full max-w-md', className)}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
          <Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                'w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg',
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              )}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleVerify}
          disabled={isLoading || code.join('').length !== 6}
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Lost your authenticator?{' '}
          <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
            Use backup code
          </a>
        </p>
      </div>
    </motion.div>
  )
}

export default TwoFactorAuth