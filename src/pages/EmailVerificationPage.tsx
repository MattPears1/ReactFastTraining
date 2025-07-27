import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Button from '@components/ui/Button'
import { authApi } from '@/services/api/auth'

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided. Please check your email for the correct link.')
        return
      }

      try {
        const response = await authApi.verifyEmail(token)
        if (response.success) {
          setStatus('success')
          setMessage('Your email has been verified successfully! You can now login to your account.')
        } else {
          setStatus('error')
          setMessage(response.message || 'Verification failed. The link may have expired.')
        }
      } catch (error: any) {
        setStatus('error')
        if (error.response?.data?.message) {
          setMessage(error.response.data.message)
        } else {
          setMessage('An error occurred during verification. Please try again or contact support.')
        }
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {status === 'loading' && (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4"
            >
              <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4"
            >
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you continue to have issues, please contact support.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg" fullWidth>
                    Try Registering Again
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" fullWidth>
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Email us at{' '}
            <a
              href="mailto:support@reactfasttraining.co.uk"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              support@reactfasttraining.co.uk
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default EmailVerificationPage