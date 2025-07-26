import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Award, Globe, Heart, Lightbulb } from 'lucide-react'
import TeamSection from '@components/sections/TeamSection'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We put our customers at the heart of everything we do, ensuring their success is our success.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Constantly pushing boundaries and embracing new technologies to deliver cutting-edge solutions.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Working together as a team and with our clients to achieve extraordinary results.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Committed to delivering the highest quality in everything we do, exceeding expectations.',
  },
  {
    icon: Target,
    title: 'Integrity',
    description: 'Operating with transparency, honesty, and ethical practices in all our interactions.',
  },
  {
    icon: Globe,
    title: 'Sustainability',
    description: 'Building solutions that are environmentally conscious and socially responsible.',
  },
]

const milestones = [
  { year: '2010', title: 'Company Founded', description: 'Started with a vision to transform businesses' },
  { year: '2013', title: 'First Major Product', description: 'Launched our flagship solution' },
  { year: '2016', title: 'Global Expansion', description: 'Opened offices in 5 countries' },
  { year: '2019', title: '10K Customers', description: 'Reached a major milestone' },
  { year: '2022', title: 'Industry Leader', description: 'Recognized as a market leader' },
  { year: '2025', title: 'AI Innovation', description: 'Pioneering AI-powered solutions' },
]

const AboutPage: React.FC = () => {
  return (
    <div>
      <SEO
        title="About Us"
        description="Learn about Lex Business - our mission, values, and 15+ years of empowering businesses worldwide with innovative solutions. Meet our team and discover our journey."
        keywords="about lex business, company history, business values, team, mission, vision, corporate culture"
        canonical="/about"
      />
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About <span className="text-gradient gradient-primary">Lex Business</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Empowering businesses worldwide with innovative solutions since 2010. 
              We're more than a company – we're your partner in growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To empower businesses of all sizes with innovative, accessible, and reliable 
                technology solutions that drive growth, efficiency, and success in the digital age.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We believe that every business deserves access to world-class tools and services 
                that were once only available to enterprise companies. Our mission is to democratize 
                technology and make it work for you.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Vision
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To be the global leader in business transformation, recognized for our innovative 
                solutions, exceptional service, and positive impact on businesses and communities worldwide.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We envision a future where technology seamlessly integrates with business operations, 
                enabling companies to focus on what they do best while we handle the technical complexity.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              These principles guide everything we do and shape our company culture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From humble beginnings to industry leadership, here's our story.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700 transform md:-translate-x-1/2" />

              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ml-16 md:ml-0">
                      <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary-600 dark:bg-primary-400 rounded-full transform md:-translate-x-1/2 z-10" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />

      {/* Stats */}
      <section className="section bg-primary-600 dark:bg-primary-700 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Years of Excellence', value: '15+' },
              { label: 'Team Members', value: '500+' },
              { label: 'Countries Served', value: '50+' },
              { label: 'Happy Customers', value: '10K+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Join Our Journey"
        description="Be part of our story and let's create something amazing together."
        primaryButtonText="Get Started"
        secondaryButtonText="Contact Sales"
      />
    </div>
  )
}

export default AboutPage