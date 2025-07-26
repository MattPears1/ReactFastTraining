import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Zap, Shield, Users } from 'lucide-react'
import Button from '@components/ui/Button'
import HeroSection from '@components/sections/HeroSection'
import FeaturesSection from '@components/sections/FeaturesSection'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

const HomePage: React.FC = () => {
  // Memoize static data to prevent recreation on each render
  const stats = useMemo(() => [
    { label: 'Happy Customers', value: '10K+' },
    { label: 'Products Delivered', value: '50K+' },
    { label: 'Team Members', value: '100+' },
    { label: 'Years of Experience', value: '15+' },
  ], [])

  const benefits = useMemo(() => [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get up and running in minutes with our streamlined processes and efficient solutions.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security and regular backups.',
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: '24/7 customer support from our team of dedicated professionals.',
    },
  ], [])
  return (
    <div>
      <SEO
        title="Home"
        description="Discover innovative business solutions that transform your company. Professional services, cutting-edge products, and expert support for modern businesses."
        keywords="business solutions, professional services, enterprise software, business transformation, consulting services"
        canonical="/"
      />
      <HeroSection />
      <FeaturesSection />
      
      {/* Stats Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
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
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We provide comprehensive solutions that help your business grow and succeed in today's competitive market.
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

      <CTASection />
    </div>
  )
}

export default HomePage