import React from 'react'
import { motion } from 'framer-motion'
import RegisterForm from '@components/auth/RegisterForm'
import { useNavigate } from 'react-router-dom'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()

  const handleRegister = async (data: any) => {
    // Simulate API call
    console.log('Register data:', data)
    await new Promise(resolve => setTimeout(resolve, 2000))
    // Navigate to login or dashboard after successful registration
    navigate('/login')
  }

  const handleSocialSignup = (provider: string) => {
    console.log('Social signup with:', provider)
    // Implement social signup logic
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
            Create your account
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Join us and start your journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10"
        >
          <RegisterForm
            onSubmit={handleRegister}
            onSocialSignup={handleSocialSignup}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage