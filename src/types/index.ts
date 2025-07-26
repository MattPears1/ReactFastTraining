export * from './api.types'

// Common utility types
export type Maybe<T> = T | null | undefined

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

export type FormState<T> = {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
}