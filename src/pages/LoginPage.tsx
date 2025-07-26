import React from 'react'
import { motion } from 'framer-motion'
import LoginForm from '@components/auth/LoginForm'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  const handleLogin = async (data: any) => {
    // Simulate API call
    console.log('Login data:', data)
    await new Promise(resolve => setTimeout(resolve, 2000))
    // Navigate to dashboard after successful login
    navigate('/dashboard')
  }

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider)
    // Implement social login logic
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10"
        >
          <LoginForm
            onSubmit={handleLogin}
            onSocialLogin={handleSocialLogin}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage