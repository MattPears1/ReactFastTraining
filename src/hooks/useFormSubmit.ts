import { useState } from 'react'
import { useToast } from '@contexts/ToastContext'
import { ERROR_MESSAGES } from '@constants/index'

interface UseFormSubmitOptions<T> {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useFormSubmit<T = any>(
  submitFn: (data: T) => Promise<any>,
  options: UseFormSubmitOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { showToast } = useToast()

  const {
    onSuccess,
    onError,
    successMessage = 'Submitted successfully!',
    errorMessage = ERROR_MESSAGES.genericError
  } = options

  const handleSubmit = async (data: T) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await submitFn(data)
      
      if (response.success) {
        showToast('success', response.message || successMessage)
        onSuccess?.(response.data)
        return response
      } else {
        throw new Error(response.error || errorMessage)
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      showToast('error', error.message || errorMessage)
      onError?.(error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setIsLoading(false)
  }

  return {
    handleSubmit,
    isLoading,
    error,
    reset
  }
}