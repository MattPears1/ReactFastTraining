import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Loader2 } from 'lucide-react'
import { useToast } from '@contexts/ToastContext'
import Button from '@components/ui/Button'

const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
})

type ContactFormData = z.infer<typeof contactSchema>

const ContactForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showToast('success', 'Message sent successfully! We\'ll get back to you soon.')
      reset()
    } catch (error) {
      showToast('error', 'Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="form-label">
            First Name <span className="text-accent-600 dark:text-accent-400">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            className="form-input"
            placeholder="John"
            {...register('firstName')}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="form-error">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="form-label">
            Last Name <span className="text-accent-600 dark:text-accent-400">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            className="form-input"
            placeholder="Doe"
            {...register('lastName')}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="form-error">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="form-label">
            Email Address <span className="text-accent-600 dark:text-accent-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="john@example.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            placeholder="+1 (234) 567-890"
            {...register('phone')}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="form-error">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="company" className="form-label">
          Company Name
        </label>
        <input
          id="company"
          type="text"
          className="form-input"
          placeholder="Acme Inc."
          {...register('company')}
          disabled={isLoading}
        />
        {errors.company && (
          <p className="form-error">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="form-label">
          Subject <span className="text-accent-600 dark:text-accent-400">*</span>
        </label>
        <input
          id="subject"
          type="text"
          className="form-input"
          placeholder="How can we help you?"
          {...register('subject')}
          disabled={isLoading}
        />
        {errors.subject && (
          <p className="form-error">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="form-label">
          Message <span className="text-accent-600 dark:text-accent-400">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          className="form-textarea"
          placeholder="Tell us more about your needs..."
          {...register('message')}
          disabled={isLoading}
        />
        {errors.message && (
          <p className="form-error">{errors.message.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 w-5 h-5 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 transition-all duration-200"
            {...register('consent')}
            disabled={isLoading}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{' '}
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
              Terms of Service
            </a>
            . <span className="text-accent-600 dark:text-accent-400">*</span>
          </span>
        </label>
        {errors.consent && (
          <p className="form-error mt-1">{errors.consent.message}</p>
        )}
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isLoading}
          rightIcon={!isLoading && <Send />}
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}

export default ContactForm