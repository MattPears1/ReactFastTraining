import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Shield, Users, Brain, Clock, Award, ArrowRight, CheckCircle } from 'lucide-react'
import SEO from '@components/common/SEO'
import Button from '@components/ui/Button'

const courses = [
  {
    id: 'efaw',
    title: 'Emergency First Aid at Work',
    acronym: 'EFAW',
    duration: '1 Day',
    price: 'From £75',
    icon: Heart,
    color: 'primary',
    description: 'Essential life-saving skills for workplace emergencies',
    highlights: ['CPR & Resuscitation', 'Wound Management', 'HSE Approved'],
    href: '/courses/efaw'
  },
  {
    id: 'faw',
    title: 'First Aid at Work',
    acronym: 'FAW',
    duration: '3 Days',
    price: 'From £225',
    icon: Shield,
    color: 'secondary',
    description: 'Comprehensive training for designated workplace first aiders',
    highlights: ['Advanced First Aid', 'Emergency Protocols', '3-Year Certificate'],
    href: '/courses/faw'
  },
  {
    id: 'paediatric',
    title: 'Paediatric First Aid',
    acronym: 'PFA',
    duration: '2 Days',
    price: 'From £150',
    icon: Users,
    color: 'accent',
    description: 'Specialized training for those working with children',
    highlights: ['Child CPR', 'Common Illnesses', 'Ofsted Compliant'],
    href: '/courses/paediatric'
  },
  {
    id: 'mental-health',
    title: 'Mental Health First Aid',
    acronym: 'MHFA',
    duration: '2 Days',
    price: 'From £200',
    icon: Brain,
    color: 'info',
    description: 'Support mental wellbeing in your workplace',
    highlights: ['Crisis Intervention', 'Active Listening', 'MHFA England Approved'],
    href: '/courses/mental-health'
  }
]

const CoursesPage: React.FC = () => {
  return (
    <div className="relative">
      <SEO
        title="First Aid Courses Yorkshire | React Fast Training"
        description="Browse our range of accredited first aid courses in Yorkshire. Emergency First Aid, Paediatric, Mental Health First Aid and more. HSE approved training from £75."
        keywords="first aid courses Yorkshire, EFAW course, FAW training, paediatric first aid, mental health first aid, Yorkshire training"
        canonical="/courses"
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
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Our <span className="text-gradient gradient-primary">First Aid Courses</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Professional, accredited first aid training delivered across Yorkshire. 
              Choose from our range of HSE approved and Ofqual regulated courses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={`h-2 bg-gradient-to-r from-${course.color}-500 to-${course.color}-600`} />
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-16 h-16 bg-${course.color}-100 dark:bg-${course.color}-900/30 rounded-xl flex items-center justify-center`}>
                        <course.icon className={`w-8 h-8 text-${course.color}-600 dark:text-${course.color}-400`} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{course.duration}</p>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                      {course.acronym}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {course.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {course.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 text-${course.color}-600 dark:text-${course.color}-400`} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {course.price}
                      </p>
                      <Button
                        as={Link}
                        to={course.href}
                        variant="outline"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className={`border-${course.color}-500 text-${course.color}-600 hover:bg-${course.color}-50 dark:hover:bg-${course.color}-900/20 group-hover:scale-105 transition-transform`}
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose React Fast Training?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're committed to delivering the highest quality first aid training in Yorkshire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fully Accredited
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All courses are Ofqual regulated and HSE approved
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Trainers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Learn from professionals with real emergency experience
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Flexible Options
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                On-site training and weekend courses available
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-600 dark:bg-primary-700">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Book Your Course?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Contact us today to discuss your training needs or book your place on our next course
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                as={Link}
                to="/contact"
              >
                Get in Touch
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                as="a"
                href="tel:07845123456"
              >
                Call 07845 123456
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CoursesPage