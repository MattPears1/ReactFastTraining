import React from 'react';
import { SEO } from '@/components/common/SEO';
import { TestimonialForm } from '@/components/testimonials/TestimonialForm';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TestimonialSubmitPage: React.FC = () => {
  return (
    <>
      <SEO 
        title="Share Your Experience - React Fast Training"
        description="Share your first aid training experience with React Fast Training. Help others learn about our courses by leaving a testimonial."
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Share Your Training Experience</h1>
          <p className="text-xl mb-8 text-primary-50">Your feedback helps us improve and helps others choose the right course</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back to testimonials link */}
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all testimonials
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                We'd Love to Hear From You
              </h2>
              <p className="text-gray-600 mb-8">
                Your testimonial helps future students make informed decisions about their training. 
                Please share your honest experience with React Fast Training.
              </p>

              <TestimonialForm />
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Why Share Your Experience?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Help others find quality first aid training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Provide valuable feedback to improve our courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Share your success story with the community</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default TestimonialSubmitPage;