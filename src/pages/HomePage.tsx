import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Heart, Clock, MapPin, Award, Shield, Users, BookOpen, Calendar, Phone, Star } from 'lucide-react'
import Button from '@components/ui/Button'
import HeroSection from '@components/sections/HeroSection'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  const courseCategories = useMemo(() => [
    {
      title: 'Oxygen Therapy Training',
      duration: '3 Hours',
      price: 'From £75',
      icon: Heart,
      color: 'primary',
      description: 'Professional training in oxygen administration and therapy'
    },
    {
      title: 'First Aid at Work',
      duration: '3 Days',
      price: 'Contact for pricing',
      icon: Shield,
      color: 'secondary',
      description: 'Comprehensive training for designated workplace first aiders'
    },
    {
      title: 'Paediatric First Aid',
      duration: '2 Days',
      price: 'Contact for pricing',
      icon: Users,
      color: 'accent',
      description: 'Specialized training for those working with children'
    }
  ], [])

  const trainingApproach = useMemo(() => [
    {
      icon: MapPin,
      title: 'On-Site Training',
      description: 'We come to your Yorkshire workplace - no travel time or expenses for your team',
    },
    {
      icon: Users,
      title: 'Small Group Sizes',
      description: 'Maximum 12 learners per course ensures personal attention and effective learning',
    },
    {
      icon: Award,
      title: 'Experienced Trainers',
      description: 'Learn from professionals with military and emergency service backgrounds',
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
      
      {/* Unique Zigzag Course Section */}
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

          <div className="space-y-8">
            {courseCategories.map((course, index) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`grid md:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 p-8">
                    <div className={`w-16 h-16 bg-${course.color}-100 dark:bg-${course.color}-900/30 rounded-xl flex items-center justify-center mb-6`}>
                      <course.icon className={`w-8 h-8 text-${course.color}-600 dark:text-${course.color}-400`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Duration: {course.duration}
                      </span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {course.price}
                      </span>
                    </div>
                    <Button
                      href={course.title === 'Oxygen Therapy Training'
                        ? '/courses/oxygen-therapy'
                        : '/courses'}
                      variant={course.color === 'secondary' ? 'secondary' : 'primary'}
                      className="w-full"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-br from-${course.color}-100 to-${course.color}-200 dark:from-${course.color}-900/20 dark:to-${course.color}-800/20 rounded-3xl transform rotate-3`} />
                    <img
                      src={course.title === 'Oxygen Therapy Training' 
                        ? '/images/hero/homepage_AI_oxygen.png'
                        : `/images/courses/${course.title.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                      alt={course.title}
                      className="relative rounded-3xl shadow-lg w-full h-64 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-course.jpg'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainingApproach.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`
                  bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300
                  ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}
                  ${index === 3 ? 'lg:col-span-2' : ''}
                `}
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
                <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 ${index === 0 ? 'text-2xl' : 'text-xl'}`}>
                  {item.title}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 ${index === 0 ? 'text-base' : 'text-sm'}`}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
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
              Join a growing community of trained first aiders across Yorkshire
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
                  className="bg-white text-primary-600 hover:bg-gray-100"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Get in Touch
                </Button>
                <Button
                  href="/courses"
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
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
              Training Locations Across Yorkshire
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Convenient venues in major Yorkshire cities. Choose your nearest location for first aid training.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Link to="/locations/leeds" className="block group">
                <div className="relative overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
                    <MapPin className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Leeds</h3>
                    <p className="text-blue-100 mb-4">City centre location near Leeds Station</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span>View courses</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/locations/sheffield" className="block group">
                <div className="relative overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 text-white">
                    <MapPin className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Sheffield</h3>
                    <p className="text-green-100 mb-4">Central venue with parking nearby</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span>View courses</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/locations/bradford" className="block group">
                <div className="relative overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 text-white">
                    <MapPin className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Bradford</h3>
                    <p className="text-purple-100 mb-4">Free parking available on-site</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span>View courses</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Also serving: York, Huddersfield, Wakefield, Halifax, Harrogate and all of Yorkshire
            </p>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                <Phone className="w-4 h-4 mr-2" />
                Contact Us for Other Locations
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage