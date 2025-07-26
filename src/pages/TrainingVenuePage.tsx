import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Train, Wifi, Coffee, Users, Clock, Shield, Accessibility } from 'lucide-react';
import { SEO } from '@components/common/SEO';
import { PageTransition } from '@components/ui/PageTransition';
import { Card } from '@components/ui/Card';

const TrainingVenuePage: React.FC = () => {
  const facilities = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Spacious Training Room',
      description: 'Comfortable seating for up to 20 participants with flexible layout options'
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: 'Modern Amenities',
      description: 'High-speed WiFi, projection equipment, and whiteboards for interactive learning'
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: 'Refreshment Area',
      description: 'Tea, coffee, and water provided throughout the day with break-out space'
    },
    {
      icon: <Accessibility className="w-6 h-6" />,
      title: 'Fully Accessible',
      description: 'Ground floor location with step-free access and accessible facilities'
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: 'Convenient Parking',
      description: 'Free on-site parking available for all course participants'
    },
    {
      icon: <Train className="w-6 h-6" />,
      title: 'Public Transport Links',
      description: 'Well-connected location with bus and tram stops nearby'
    }
  ];

  return (
    <PageTransition>
      <SEO
        title="Training Venue - React Fast Training"
        description="Our professional training venue in North and Central Sheffield provides the perfect environment for effective first aid training."
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Our Training Venue
              </h1>
              <p className="text-xl opacity-90">
                Professional training facilities in North and Central Sheffield
              </p>
            </motion.div>
          </div>
        </section>

        {/* Location Notice */}
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Venue Address & Security
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      For the security and privacy of our participants, the exact training venue address 
                      will be provided upon booking confirmation.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Location:</strong> North and Central Sheffield<br />
                      Full address and directions will be included in your booking confirmation email.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* General Location Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-3xl mx-auto text-center mb-12"
            >
              <MapPin className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Strategic Sheffield Location
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our venue is strategically located in the North and Central Sheffield area, 
                offering excellent accessibility from all parts of the city and surrounding areas.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    By Car
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Easy access from M1 Junction 33/34</li>
                    <li>• 10-15 minutes from Sheffield city centre</li>
                    <li>• Free on-site parking for all participants</li>
                    <li>• Disabled parking bays available</li>
                  </ul>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Public Transport
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Multiple bus routes within walking distance</li>
                    <li>• Sheffield Supertram connections nearby</li>
                    <li>• 20 minutes from Sheffield train station</li>
                    <li>• Transport details provided with booking</li>
                  </ul>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="py-16 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Training Facilities
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Our venue provides all the facilities needed for an effective and comfortable day's training
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {facilities.map((facility, index) => (
                <motion.div
                  key={facility.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                        {facility.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {facility.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {facility.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                What to Expect on Training Day
              </h2>

              <Card>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Training Times
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Courses typically run from 9:00 AM to 4:30 PM with regular breaks throughout the day.
                        Please arrive 15 minutes early for registration and setup.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Coffee className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Refreshments
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Tea, coffee, and water are provided throughout the day. Lunch break is scheduled,
                        with local cafes and shops nearby, or you're welcome to bring your own lunch.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        COVID-19 Safety
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        We maintain high standards of cleanliness and hygiene. Hand sanitizer is available
                        throughout the venue, and we ensure proper ventilation in all training areas.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600 dark:bg-primary-800">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Book Your Training?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join us at our professional training venue in Sheffield for comprehensive first aid training
              </p>
              <a
                href="/courses"
                className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Available Courses
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default TrainingVenuePage;