import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Car, Train, Bus, Coffee, Wifi, Users, Clock, Shield, CheckCircle, Phone, Mail } from 'lucide-react'
import Button from '@components/ui/Button'
import SEO from '@components/common/SEO'
import { Link } from 'react-router-dom'

const TrainingVenuePage: React.FC = () => {
  const facilities = [
    { icon: Wifi, name: 'Free WiFi', description: 'High-speed internet throughout' },
    { icon: Coffee, name: 'Refreshments', description: 'Tea, coffee & biscuits provided' },
    { icon: Car, name: 'Free Parking', description: 'Ample parking spaces available' },
    { icon: Users, name: 'Spacious Rooms', description: 'Comfortable training environment' }
  ]

  const accessibility = [
    'Wheelchair accessible entrance and facilities',
    'Hearing loop system available',
    'Ground floor training rooms',
    'Accessible parking spaces',
    'Clear signage throughout',
    'Adjustable seating arrangements'
  ]

  const nearbyAmenities = [
    'City centre location near transport links',
    'Multiple restaurants and cafes within 5 minutes',
    'Hotels and B&Bs for overnight stays',
    'Shopping centres nearby',
    'Banks and ATMs close by',
    'Pharmacy and medical centre adjacent'
  ]

  const transportOptions = [
    {
      icon: Train,
      mode: 'By Train',
      details: [
        'Sheffield Station: 15 minute walk',
        'Meadowhall Interchange: 20 minutes by tram',
        'Direct trains from major Yorkshire cities',
        'Supertram stops nearby'
      ]
    },
    {
      icon: Bus,
      mode: 'By Bus',
      details: [
        'Multiple bus routes stop nearby',
        'Direct buses from all Sheffield areas',
        'Park & Ride services available',
        'Night bus services for evening courses'
      ]
    },
    {
      icon: Car,
      mode: 'By Car',
      details: [
        'Free on-site parking',
        'Easy access from M1 and Sheffield Parkway',
        'Sat Nav: Postcode provided upon booking',
        'Electric vehicle charging points'
      ]
    }
  ]

  return (
    <div className="relative bg-white dark:bg-gray-900">
      <SEO
        title="Training Venue Sheffield | First Aid Course Location | React Fast Training"
        description="Modern training facilities in Sheffield Centre and North Sheffield for first aid courses. Free parking, WiFi and refreshments. Fully accessible. Exact address provided upon booking."
        keywords="first aid training venue Sheffield, training facilities Sheffield Centre, course venue North Sheffield, Sheffield training location, accessible venue Sheffield"
        canonical="/venue"
      />

      {/* Logo at very top right */}
      <div className="fixed top-4 right-4 z-50">
        <img 
          src="/images/logos/fulllogo_transparent.png" 
          alt="React Fast Training" 
          className="h-20 md:h-30 lg:h-40 w-auto"
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <pattern id="grid-venue" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%"  fill="url(#grid-venue)" />
          </svg>
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Sheffield Centre & North Sheffield
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gray-900 dark:text-white mb-6">
              Our Training Venue
              <span className="block text-3xl md:text-4xl mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Professional & Accessible Facilities
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Modern, comfortable training facilities designed for effective learning. 
              Convenient location in Sheffield Centre and North Sheffield with excellent transport links.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/contact"
                size="lg"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
              >
                Book a Venue Visit
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call for Directions
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Location */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Training Venue Location
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our training venue is located in Sheffield Centre and North Sheffield
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto mb-12">
            {/* Venue Security Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Shield className="w-24 h-24 text-white/20" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Venue Address & Security
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  For the security and privacy of our participants, the exact training venue address 
                  will be provided upon booking confirmation.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  <strong>Location:</strong> Sheffield Centre and North Sheffield<br />
                  Full address and directions will be included in your booking confirmation email.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Our venue is easily accessible from all areas of Sheffield and 
                    surrounding regions, with excellent transport links and parking facilities.
                  </p>
                </div>
                <Link to="/contact">
                  <Button className="w-full" variant="primary">
                    Book Your Course
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Additional Locations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              On-Site Training Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              We also deliver training at your workplace anywhere in Sheffield and surrounding areas.
            </p>
            <Link to="/contact">
              <Button variant="secondary">
                Enquire About On-Site Training
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Venue Facilities
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for a comfortable learning experience
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {facilities.map((facility, index) => (
              <motion.div
                key={facility.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <facility.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {facility.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {facility.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Accessibility */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-secondary-500" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Fully Accessible Venues
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                All our training venues are designed to be fully accessible, ensuring everyone 
                can participate comfortably in our courses.
              </p>
              <ul className="space-y-3">
                {accessibility.map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Coffee className="w-8 h-8 text-accent-500" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Nearby Amenities
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our venues are strategically located near essential amenities for your convenience.
              </p>
              <ul className="space-y-3">
                {nearbyAmenities.map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Getting Here */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Getting to Our Venues
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Easy access by car, train or bus from anywhere in Yorkshire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {transportOptions.map((option, index) => (
              <motion.div
                key={option.mode}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <option.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {option.mode}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {option.details.map((detail, idx) => (
                    <li key={idx} className="text-gray-600 dark:text-gray-400 text-sm">
                      • {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <MapPin className="w-16 h-16 mx-auto mb-6 text-white/90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Visit Our Training Venues
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Book a venue visit or contact us for detailed directions to your nearest training location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/contact"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                <Mail className="w-5 h-5 mr-2" />
                Get Directions
              </Button>
              <Button
                as="a"
                href="tel:0800123456"
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call for Venue Info
              </Button>
            </div>
            <p className="mt-6 text-white/80">
              Professional venues • Free parking • Fully accessible • Refreshments included
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

export default TrainingVenuePage