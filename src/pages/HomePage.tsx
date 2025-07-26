import React, { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Heart, Clock, MapPin, Award, Shield, Users, BookOpen, Calendar, Phone, Star, Sun } from 'lucide-react'
import Button from '@components/ui/Button'
import HeroSection from '@components/sections/HeroSection'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'
import { Link } from 'react-router-dom'
import { useNotifications } from '@contexts/NotificationContext'
import { useTheme } from '@contexts/ThemeContext'

const HomePage: React.FC = () => {
  const { addNotification } = useNotifications()
  const { setTheme } = useTheme()

  useEffect(() => {
    const firstVisit = localStorage.getItem('firstVisit')
    if (!firstVisit) {
      addNotification({
        type: 'info',
        title: 'Light Mode Available',
        message: 'Prefer a lighter background? Switch to light mode.',
        persistent: true,
        icon: <Sun className="w-5 h-5" />,
        actions: [
          {
            label: 'Switch to Light Mode',
            onClick: () => setTheme('light'),
          },
        ],
      })
      localStorage.setItem('firstVisit', 'false')
    }
  }, [addNotification, setTheme])

  const courseCategories = useMemo(() => [
    // Primary courses first as requested
    { title: 'Emergency First Aid at Work', duration: '1 Day', price: '£100', href: '/courses/efaw' },
    { title: 'First Aid at Work', duration: '3 Days', price: '£200', href: '/courses/faw' },
    { title: 'Paediatric First Aid', duration: '2 Days', price: '£120', href: '/courses/paediatric' },
    { title: 'Emergency Paediatric First Aid', duration: '1 Day', price: '£100', href: '/courses/emergency-paediatric' },
    // Requalification courses
    { title: 'First Aid at Work Requalification', duration: '2 Days', price: '£150', href: '/courses/faw-requalification' },
    { title: 'Emergency First Aid at Work Requalification', duration: '1 Day', price: '£70', href: '/courses/efaw-requalification' },
    { title: 'Paediatric First Aid Requalification', duration: '1 Day', price: '£90', href: '/courses/paediatric-requalification' },
    { title: 'Emergency Paediatric First Aid Requalification', duration: '1 Day', price: '£70', href: '/courses/emergency-paediatric-requalification' },
    // Specialist courses
    { title: 'Activity First Aid', duration: '2 Days', price: '£120', href: '/courses/activity-first-aid' },
    { title: 'Activity First Aid Requalification', duration: '1 Day', price: '£90', href: '/courses/activity-first-aid-requalification' },
    { title: 'CPR and AED', duration: 'Half Day', price: '£60', href: '/courses/cpr-aed' },
    { title: 'Annual Skills Refresher', duration: 'Half Day', price: '£60', href: '/courses/annual-skills-refresher' },
    { title: 'Oxygen Therapy Course', duration: 'Half Day', price: '£60', href: '/courses/oxygen-therapy' },
  ], [])

  const trainingApproach = useMemo(() => [
    {
      icon: MapPin,
      title: 'On-Site Training',
      description: 'We can come to your South Yorkshire workplace',
    },
    {
      icon: Users,
      title: 'Group Sizes',
      description: 'Maximum 12 learners per course ensures personal attention and effective learning',
    },
    {
      icon: Award,
      title: 'Experienced Trainer',
      description: 'Learn from a professional with military and emergency service background',
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Weekend and evening courses available to fit your business needs',
    },
  ], [])

  return (
    <div className="relative bg-white dark:bg-gray-900">
      <SEO
        title="First Aid Training Yorkshire | EFAW Courses Leeds, Sheffield, Bradford | React Fast Training"
        description="Professional first aid training across Yorkshire from £75. Emergency First Aid at Work (EFAW), HSE approved courses in Leeds, Sheffield, Bradford. Led by ex-military trainer Lex. Book today!"
        keywords="first aid training Yorkshire, first aid courses Leeds, first aid training Sheffield, EFAW Yorkshire, emergency first aid Bradford, HSE approved first aid training, first aid training near me"
        canonical="/"
      />
      
      <HeroSection />
      
      {/* Course Section - Simple 2-Column Grid */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900" />
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Available Training Courses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All courses are Ofqual regulated and HSE compliant, delivered by experienced professionals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {courseCategories.slice(0, 12).map((course, index) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={course.href}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50 p-6 hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {course.duration}
                    </span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {course.price}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Centered 13th course */}
          <div className="flex justify-center mt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="w-full md:w-1/2 max-w-md"
            >
              <Link
                to={courseCategories[12].href}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50 p-6 hover:border-primary-300 dark:hover:border-primary-600"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {courseCategories[12].title}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {courseCategories[12].duration}
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {courseCategories[12].price}
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Training Approach Section - Bento Box Layout */}
      <section className="py-20 bg-gradient-to-b from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Our Training Approach
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Quality training delivered the way that works for you
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {trainingApproach.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${index === 0 ? 'bg-primary-100 dark:bg-primary-900/30' : ''}
                  ${index === 1 ? 'bg-secondary-100 dark:bg-secondary-900/30' : ''}
                  ${index === 2 ? 'bg-accent-100 dark:bg-accent-900/30' : ''}
                  ${index === 3 ? 'bg-info-light dark:bg-info-dark/30' : ''}
                `}>
                  <item.icon className={`
                    w-6 h-6
                    ${index === 0 ? 'text-primary-600 dark:text-primary-400' : ''}
                    ${index === 1 ? 'text-secondary-600 dark:text-secondary-400' : ''}
                    ${index === 2 ? 'text-accent-600 dark:text-accent-400' : ''}
                    ${index === 3 ? 'text-info dark:text-info-light' : ''}
                  `} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Flexible Scheduling - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 bg-info-light dark:bg-info-dark/30 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Calendar className="w-6 h-6 text-info dark:text-info-light" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center md:text-left">
              {trainingApproach[3].title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              {trainingApproach[3].description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section - Unique Cards */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Start Your First Aid Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join a growing community of trained first aiders across South Yorkshire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Choose Your Course</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select from our range of accredited first aid courses
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Book Your Date</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Flexible scheduling to suit your needs
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                  <Award className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Get Certified</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive your certificate on successful completion
              </p>
            </motion.div>
          </div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready to Learn Life-Saving Skills?</h3>
              <p className="text-xl mb-8 text-white/90">
                Contact us today for a personalized quote for your team
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  href="/contact"
                  size="lg"
                  className="bg-primary-500 text-white hover:bg-primary-600 border-2 border-white"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Get in Touch
                </Button>
                <Button
                  href="/courses"
                  size="lg"
                  className="bg-primary-500 text-white hover:bg-primary-600 border-2 border-white"
                >
                  View All Courses
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Fully Accredited Training
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Our certifications meet all regulatory requirements
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-700 rounded-2xl shadow-lg flex items-center justify-center mb-3 mx-auto">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ofqual Regulated</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-700 rounded-2xl shadow-lg flex items-center justify-center mb-3 mx-auto">
                <Award className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-600 dark:text-secondary-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">HSE Approved</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-700 rounded-2xl shadow-lg flex items-center justify-center mb-3 mx-auto">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">CPD Certified</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-700 rounded-2xl shadow-lg flex items-center justify-center mb-3 mx-auto">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-info dark:text-info-light" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Quality Assured</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Yorkshire Locations Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              Training Locations Across South Yorkshire
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We can come to your workplace anywhere in South Yorkshire, or training venues are available if needed.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex flex-wrap justify-center gap-4 text-lg font-medium text-gray-700 dark:text-gray-300 mb-8">
              <span>Barnsley</span>
              <span className="text-gray-400">•</span>
              <span>Doncaster</span>
              <span className="text-gray-400">•</span>
              <span>Rotherham</span>
              <span className="text-gray-400">•</span>
              <span>Sheffield</span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">
              Also serving: Leeds, Bradford, York, Wakefield, and all of Yorkshire
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage