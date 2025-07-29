import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TestimonialCard, TestimonialData } from "./TestimonialCard";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { Link } from "react-router-dom";

interface TestimonialsSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  limit = 3,
  showViewAll = true,
}) => {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(
        `/api/testimonials/approved?limit=${limit}&featured=true`,
      );
      const data = await response.json();

      // Ensure testimonials is an array
      setTestimonials(data.testimonials || []);
      setAverageRating(data.averageRating || 0);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
      // Don't use mock data - keep testimonials empty if API fails
      setTestimonials([]);
      setAverageRating(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const nextTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }
  };

  const previousTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentIndex(
        (prev) => (prev - 1 + testimonials.length) % testimonials.length,
      );
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  // Always show the submit testimonial section, regardless of whether we have testimonials
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Submit Testimonial CTA - Enhanced UI */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-8 sm:p-12 text-center shadow-xl border border-primary-100 dark:border-primary-800">
          <div className="relative">
            {/* Decorative stars */}
            <div className="absolute -top-6 -left-6 opacity-20">
              <Star className="w-12 h-12 text-primary-400 fill-current" />
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-20">
              <Star className="w-12 h-12 text-secondary-400 fill-current" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Have you completed a course with us?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              We'd love to hear about your experience
            </p>
            
            {/* Enhanced button */}
            <Link
              to="/testimonials/submit"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Share Your Testimonial</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </Link>
            
            {/* Additional trust text */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Your feedback helps us improve and helps others make informed decisions
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

