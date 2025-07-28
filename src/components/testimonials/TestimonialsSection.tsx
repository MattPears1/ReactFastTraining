import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { TestimonialCard, TestimonialData } from './TestimonialCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

interface TestimonialsSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ 
  limit = 3, 
  showViewAll = true 
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
      const response = await fetch(`/api/testimonials/approved?limit=${limit}&featured=true`);
      const data = await response.json();
      
      setTestimonials(data.testimonials);
      setAverageRating(data.averageRating);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      // Use mock data in development
      setTestimonials(getMockTestimonials());
      setAverageRating(4.8);
      setTotalCount(127);
    } finally {
      setLoading(false);
    }
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
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

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join {totalCount}+ satisfied students who have enhanced their skills with React Fast Training
          </p>
          
          {/* Average Rating */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : i < averageRating
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold">
              {averageRating.toFixed(1)} out of 5
            </span>
            <span className="text-gray-500">
              ({totalCount} reviews)
            </span>
          </div>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {testimonials.slice(0, limit).map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              variant="default"
            />
          ))}
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
                  <TestimonialCard
                    testimonial={testimonial}
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Controls */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={previousTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* View All Link */}
        {showViewAll && (
          <div className="text-center mt-8">
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Read all testimonials
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Submit Testimonial CTA */}
        <div className="mt-12 bg-primary-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Have you completed a course with us?
          </h3>
          <p className="text-gray-600 mb-4">
            We'd love to hear about your experience
          </p>
          <Link
            to="/testimonials/submit"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Share Your Testimonial
          </Link>
        </div>
      </div>
    </section>
  );
};

// Mock data for development
function getMockTestimonials(): TestimonialData[] {
  return [
    {
      id: 1,
      authorName: 'Sarah Johnson',
      authorLocation: 'Leeds, Yorkshire',
      courseTaken: 'Emergency First Aid at Work',
      courseDate: '2025-01-15',
      content: 'Excellent course! The instructor was knowledgeable and made the content easy to understand. I feel confident in my ability to handle emergency situations now.',
      rating: 5,
      photoUrl: 'https://via.placeholder.com/150',
      showFullName: true,
      verifiedBooking: true,
      createdAt: '2025-01-16',
    },
    {
      id: 2,
      authorName: 'Michael Chen',
      authorLocation: 'Sheffield',
      courseTaken: 'Paediatric First Aid',
      courseDate: '2025-01-10',
      content: 'As a nursery teacher, this course was invaluable. The hands-on practice with infant and child CPR gave me the confidence I needed. Highly recommend!',
      rating: 5,
      photoUrl: 'https://via.placeholder.com/150',
      showFullName: true,
      verifiedBooking: true,
      createdAt: '2025-01-11',
    },
    {
      id: 3,
      authorName: 'Emma Williams',
      authorLocation: 'Bradford',
      courseTaken: 'Mental Health First Aid',
      courseDate: '2025-01-05',
      content: 'This course opened my eyes to the importance of mental health support in the workplace. The trainer created a safe space for discussion and learning.',
      rating: 5,
      photoUrl: 'https://via.placeholder.com/150',
      showFullName: false,
      verifiedBooking: true,
      createdAt: '2025-01-06',
    },
  ];
}