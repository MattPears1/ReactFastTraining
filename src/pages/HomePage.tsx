import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Heart, Clock, MapPin, Award, Shield, Users } from 'lucide-react'
import Button from '@components/ui/Button'
import HeroSection from '@components/sections/HeroSection'
import FeaturesSection from '@components/sections/FeaturesSection'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

const HomePage: React.FC = () => {
  // Memoize static data to prevent recreation on each render
  const stats = useMemo(() => [
    { label: 'Lives Saved', value: '1000+' },
    { label: 'Students Trained', value: '5000+' },
    { label: 'Years Experience', value: '20+' },
    { label: 'Course Pass Rate', value: '98%' },
  ], [])

  const benefits = useMemo(() => [
    {
      icon: Award,
      title: 'Ofqual Regulated',
      description: 'All our courses are fully accredited by Ofqual and HSE approved, ensuring the highest quality training.',
    },
    {
      icon: MapPin,
      title: 'Yorkshire Based',
      description: 'Local training delivered by Yorkshire professionals who understand your needs and can provide on-site training.',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Weekend and evening courses available. We work around your schedule to minimize business disruption.',
    },
  ], [])
  return (
    <div>
      <SEO
        title="Yorkshire First Aid Training | React Fast Training"
        description="Act Fast. Save Lives. Yorkshire's premier first aid training provider. Ofqual regulated courses from £75. Emergency First Aid at Work, Paediatric First Aid & more."
        keywords="first aid training Yorkshire, emergency first aid at work, EFAW course, first aid trainer Yorkshire, HSE approved first aid, Ofqual regulated training"
        canonical="/"
      />
      <HeroSection />
      <FeaturesSection />
      
      {/* Stats Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Yorkshire Businesses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Delivering life-saving training across Yorkshire since 2004
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose React Fast Training?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Professional first aid training that saves money, saves time, and most importantly - saves lives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-xl transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="section bg-primary-50 dark:bg-gray-900">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                £75
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Save Money
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Emergency First Aid at Work courses from just £75 per person - the best value in Yorkshire
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Clock className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Save Time
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                On-site training available - we come to you. No travel time, no lost productivity
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Heart className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Save Lives
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Expert training from experienced professionals with military and emergency services background
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Fully Accredited Training
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our courses meet all regulatory requirements
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Shield className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">Ofqual Regulated</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Award className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">HSE Approved</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <CheckCircle className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">CPD Certified</p>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  )
}

export default HomePage