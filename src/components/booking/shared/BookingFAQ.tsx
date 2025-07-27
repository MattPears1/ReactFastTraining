import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@utils/cn';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const bookingFAQs: FAQItem[] = [
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), bank transfers for corporate bookings, and payment on invoice for approved accounts. All payments are processed securely through our encrypted payment system.'
  },
  {
    id: 'cancellation',
    question: 'What is your cancellation policy?',
    answer: 'You can cancel or reschedule your booking up to 5 working days before the course date for a full refund. Cancellations within 5 days may be subject to a cancellation fee. In case of illness, we offer free rescheduling with a medical certificate.'
  },
  {
    id: 'group',
    question: 'Do you offer discounts for group bookings?',
    answer: 'Yes! We offer a 10% discount for bookings of 5 or more participants. For larger groups (10+), please contact us for custom pricing. We can also arrange private courses at your premises for groups of 12 or more.'
  },
  {
    id: 'certificate',
    question: 'When will I receive my certificate?',
    answer: 'Certificates are issued on the same day upon successful completion of the course. Digital certificates are emailed within 24 hours, and physical certificates are posted within 3-5 working days. All certificates are valid for 3 years.'
  },
  {
    id: 'requirements',
    question: 'Are there any prerequisites for the courses?',
    answer: 'Most of our courses have no prerequisites. However, requalification courses require a valid or recently expired (within 28 days) certificate. All participants must be at least 16 years old and have a basic understanding of English.'
  },
  {
    id: 'venue',
    question: 'Where are the courses held?',
    answer: 'We have training venues across Yorkshire including Leeds, Sheffield, Bradford, York, and Huddersfield. The exact venue details will be provided in your booking confirmation. We also offer on-site training at your premises.'
  }
];

interface BookingFAQProps {
  className?: string;
}

export const BookingFAQ: React.FC<BookingFAQProps> = ({ className }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  
  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
      </div>
      
      {bookingFAQs.map((faq, index) => (
        <motion.div
          key={faq.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleItem(faq.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
              {faq.question}
            </span>
            <motion.div
              animate={{ rotate: openItems.includes(faq.id) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {openItems.includes(faq.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Can't find what you're looking for? Contact our support team at{' '}
          <a 
            href="mailto:support@reactfasttraining.co.uk" 
            className="font-medium underline hover:no-underline"
          >
            support@reactfasttraining.co.uk
          </a>
          {' '}or call us on{' '}
          <a 
            href="tel:01234567890" 
            className="font-medium underline hover:no-underline"
          >
            01234 567890
          </a>
        </p>
      </div>
    </div>
  );
};