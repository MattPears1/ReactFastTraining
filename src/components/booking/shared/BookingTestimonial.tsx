import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn } from '@utils/cn';

interface TestimonialData {
  id: string;
  name: string;
  company?: string;
  rating: number;
  text: string;
  courseType: string;
  date: string;
}

interface BookingTestimonialProps {
  testimonial?: TestimonialData;
  className?: string;
}

const defaultTestimonials: TestimonialData[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'Leeds Primary School',
    rating: 5,
    text: 'Excellent training! The instructor was knowledgeable and made the course engaging. I feel confident in my first aid skills now.',
    courseType: 'Paediatric First Aid',
    date: '2 weeks ago'
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Sheffield Construction Ltd',
    rating: 5,
    text: 'Very professional service from booking to completion. The online booking system was easy to use and we received instant confirmation.',
    courseType: 'First Aid at Work',
    date: '1 month ago'
  },
  {
    id: '3',
    name: 'Emma Williams',
    rating: 5,
    text: 'Great value for money. The course was comprehensive and the practical sessions were really helpful. Highly recommend!',
    courseType: 'Emergency First Aid at Work',
    date: '3 weeks ago'
  }
];

export const BookingTestimonial: React.FC<BookingTestimonialProps> = ({
  testimonial,
  className
}) => {
  // Select a random testimonial if none provided
  const displayTestimonial = testimonial || defaultTestimonials[Math.floor(Math.random() * defaultTestimonials.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <Quote className="w-8 h-8 text-primary-500 opacity-20 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < displayTestimonial.rating
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                )}
              />
            ))}
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 italic mb-4">
            "{displayTestimonial.text}"
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {displayTestimonial.name}
              </p>
              {displayTestimonial.company && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {displayTestimonial.company}
                </p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {displayTestimonial.courseType}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {displayTestimonial.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};