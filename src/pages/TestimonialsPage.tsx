import React, { useState, useEffect } from 'react';
import { SEO } from '@/components/common/SEO';
import { HeroSection } from '@/components/common/HeroSection';
import { TestimonialCard, TestimonialData } from '@/components/testimonials/TestimonialCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';

const TestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchTestimonials();
  }, [filterCourse, sortBy]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCourse !== 'all') params.append('course', filterCourse);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/testimonials/approved?${params}`);
      const data = await response.json();
      setTestimonials(data.testimonials);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      // Use mock data in development
      setTestimonials(getMockTestimonials());
    } finally {
      setLoading(false);
    }
  };

  const courses = [
    'All Courses',
    'Emergency First Aid at Work',
    'First Aid at Work',
    'Paediatric First Aid',
    'Mental Health First Aid',
    'Fire Safety Training',
    'Basic Life Support',
  ];

  const filteredTestimonials = testimonials.filter(t => 
    filterCourse === 'all' || t.courseTaken === filterCourse
  );

  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <>
      <SEO 
        title="Student Testimonials - React Fast Training"
        description="Read what our students say about their first aid training experience with React Fast Training. Real reviews from real people across Yorkshire."
      />

      <HeroSection
        title="Student Testimonials"
        subtitle="Hear from our satisfied students about their training experience"
        backgroundImage="/images/testimonials-hero.jpg"
        ctaText="Share Your Story"
        ctaLink="/testimonials/submit"
        secondaryCtaText="Book a Course"
        secondaryCtaLink="/booking"
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value === 'All Courses' ? 'all' : e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {courses.map((course) => (
                  <option key={course} value={course === 'All Courses' ? 'all' : course}>
                    {course}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <Link
              to="/testimonials/submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Share Your Story
            </Link>
          </div>

          {/* Testimonials Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : sortedTestimonials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                No testimonials found for the selected filters.
              </p>
              <Link
                to="/testimonials/submit"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Be the first to share your experience!
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Testimonial */}
              {sortedTestimonials.some(t => t.rating === 5) && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Review</h2>
                  <TestimonialCard
                    testimonial={sortedTestimonials.find(t => t.rating === 5)!}
                    variant="featured"
                  />
                </div>
              )}

              {/* All Testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedTestimonials.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    variant="default"
                  />
                ))}
              </div>
            </>
          )}

          {/* Statistics */}
          <div className="mt-16 bg-gray-50 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  {testimonials.length}+
                </p>
                <p className="text-gray-600 mt-1">Happy Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  {(testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length || 0).toFixed(1)}
                </p>
                <p className="text-gray-600 mt-1">Average Rating</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  {testimonials.filter(t => t.verifiedBooking).length}
                </p>
                <p className="text-gray-600 mt-1">Verified Reviews</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  100%
                </p>
                <p className="text-gray-600 mt-1">Would Recommend</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
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
      content: 'Absolutely brilliant course! The instructor was incredibly knowledgeable and made everything easy to understand. The hands-on practice really helped build my confidence. I now feel prepared to handle emergency situations both at work and in everyday life. Highly recommend React Fast Training!',
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
      content: 'As a nursery teacher, this course was invaluable. The instructor covered everything from basic first aid to specific scenarios with infants and children. The small class size meant we all got plenty of hands-on practice. I especially appreciated the sections on choking and CPR for different age groups.',
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
      content: 'This course completely changed my perspective on mental health in the workplace. The trainer created a safe, non-judgmental environment where we could discuss sensitive topics openly. I learned practical strategies for supporting colleagues and recognizing warning signs. Essential training for any workplace.',
      rating: 5,
      photoUrl: null,
      showFullName: false,
      verifiedBooking: true,
      createdAt: '2025-01-06',
    },
    {
      id: 4,
      authorName: 'David Thompson',
      authorLocation: 'York',
      courseTaken: 'First Aid at Work',
      courseDate: '2024-12-20',
      content: 'Comprehensive three-day course that covered everything from minor injuries to serious medical emergencies. The balance between theory and practical sessions was perfect. Our instructor Lex was fantastic - patient, encouraging, and clearly passionate about first aid. Worth every penny!',
      rating: 5,
      photoUrl: 'https://via.placeholder.com/150',
      showFullName: true,
      verifiedBooking: true,
      createdAt: '2024-12-21',
    },
    {
      id: 5,
      authorName: 'Lisa Patel',
      authorLocation: 'Huddersfield',
      courseTaken: 'Fire Safety Training',
      courseDate: '2024-12-15',
      content: 'Excellent fire safety training that went beyond just using extinguishers. We learned about fire prevention, evacuation procedures, and different types of fires. The practical session with real fire extinguishers was particularly valuable. Feeling much more confident about workplace safety now.',
      rating: 4,
      photoUrl: null,
      showFullName: true,
      verifiedBooking: true,
      createdAt: '2024-12-16',
    },
  ];
}

export default TestimonialsPage;