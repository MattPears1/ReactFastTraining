import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PasswordResetForm from '@components/auth/PasswordResetForm'
import { authApi } from '@/services/api/auth'

const ForgotPasswordPage: React.FC = () => {
  const handlePasswordReset = async (data: { email: string }) => {
    await authApi.forgotPassword(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
        
        <PasswordResetForm onSubmit={handlePasswordReset} />
      </div>
    </div>
  )
}

export default ForgotPasswordPage