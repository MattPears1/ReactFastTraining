import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, UserPlus, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@components/ui/Button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { registerSchema } from '@/utils/validation'
import { PasswordInput, AuthErrorAlert, GoogleAuthButton } from './shared'
import { ApiError } from '@/types/auth.types'

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSubmit?: (data: RegisterFormData) => Promise<void>
  onSocialSignup?: (provider: 'google') => void
  className?: string
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onSocialSignup, className }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const { signup, clearError, error: authError } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')
  
  // Clear errors when user starts typing
  useEffect(() => {
    if (error || authError) {
      clearError()
      setError(null)
    }
  }, [password])

  const handleFormSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (onSubmit) {
        await onSubmit(data)
        setIsRegistered(true)
      } else {
        await signup({
          name: data.name,
          email: data.email,
          password: data.password,
        })
        setIsRegistered(true)
      }
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignup = () => {
    if (onSocialSignup) {
      onSocialSignup('google')
    } else {
      // TODO: Implement Google OAuth when backend is ready
      setError({
        code: 'auth/network-error',
        message: 'Google signup is not available yet',
        statusCode: 501,
      })
    }
  }

  if (isRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('w-full max-w-md text-center', className)}
      >
        <div className="mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification email to your address. Please check your inbox and click the link to verify your account.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or wait a few minutes.
          </p>
          
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Back to Login
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full max-w-md', className)}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <AuthErrorAlert 
          error={error || authError} 
          onClose={() => {
            setError(null)
            clearError()
          }}
        />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <input
              {...register('name')}
              type="text"
              id="name"
              className={cn(
                'w-full px-4 py-3 pl-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.name
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              )}
              placeholder="Enter your full name"
            />
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              {...register('email')}
              type="email"
              id="email"
              className={cn(
                'w-full px-4 py-3 pl-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.email
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              )}
              placeholder="Enter your email"
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <PasswordInput
          {...register('password')}
          id="password"
          label="Password"
          error={errors.password?.message}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          placeholder="Create a password"
          password={password}
          showStrengthIndicator
        />

        <PasswordInput
          {...register('confirmPassword')}
          id="confirmPassword"
          label="Confirm Password"
          error={errors.confirmPassword?.message}
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm your password"
        />

        <div>
          <label className="flex items-start">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          leftIcon={!isLoading && <UserPlus className="w-5 h-5" />}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or sign up with</span>
          </div>
        </div>

        <GoogleAuthButton 
          onClick={handleGoogleSignup} 
          variant="signup"
          disabled={isLoading}
        />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  )
}

export default RegisterForm