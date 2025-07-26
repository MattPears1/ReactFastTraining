import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Heart, Shield, Users, Brain, Activity, 
  CheckCircle, Calendar, Clock, Award, MapPin,
  ArrowRight, BookOpen, RefreshCw
} from 'lucide-react'
import Button from '@components/ui/Button'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

const courseCategories = [
  {
    category: 'Workplace First Aid',
    description: 'HSE approved courses for workplace compliance',
    icon: Shield,
    color: 'primary',
    courses: [
      {
        title: 'Emergency First Aid at Work',
        duration: '1 Day',
        price: '£100',
        href: '/courses/efaw',
        features: ['HSE Approved', '3-Year Certificate', 'CPR Training', 'Basic Life Support']
      },
      {
        title: 'First Aid at Work',
        duration: '3 Days',
        price: '£200',
        href: '/courses/faw',
        features: ['Comprehensive Training', '3-Year Certificate', 'Advanced Techniques', 'Emergency Protocols']
      }
    ]
  },
  {
    category: 'Paediatric First Aid',
    description: 'Ofsted compliant courses for childcare professionals',
    icon: Users,
    color: 'secondary',
    courses: [
      {
        title: 'Paediatric First Aid',
        duration: '2 Days',
        price: '£120',
        href: '/courses/paediatric',
        features: ['EYFS Compliant', 'Child CPR', 'Common Illnesses', 'Emergency Response']
      },
      {
        title: 'Emergency Paediatric First Aid',
        duration: '1 Day',
        price: '£100',
        href: '/courses/emergency-paediatric',
        features: ['Essential Skills', 'Quick Course', 'EYFS Compliant', 'Practical Focus']
      }
    ]
  },
  {
    category: 'Requalification Courses',
    description: 'Refresh your certification before it expires',
    icon: RefreshCw,
    color: 'accent',
    courses: [
      {
        title: 'FAW Requalification',
        duration: '2 Days',
        price: '£150',
        href: '/courses/faw-requalification',
        features: ['Skills Refresh', 'Updated Protocols', '3-Year Renewal', 'HSE Approved']
      },
      {
        title: 'EFAW Requalification',
        duration: '1 Day',
        price: '£70',
        href: '/courses/efaw-requalification',
        features: ['Quick Refresh', 'Same Day Certificate', 'HSE Compliant', 'Practical Assessment']
      }
    ]
  },
  {
    category: 'Specialist Courses',
    description: 'Additional training for specific needs',
    icon: Activity,
    color: 'info',
    courses: [
      {
        title: 'Activity First Aid',
        duration: '2 Days',
        price: '£120',
        href: '/courses/activity-first-aid',
        features: ['Outdoor Focus', 'Sports Injuries', 'Remote Scenarios', 'Adventure Activities']
      },
      {
        title: 'CPR and AED',
        duration: 'Half Day',
        price: '£60',
        href: '/courses/cpr-aed',
        features: ['Life-Saving Skills', 'Defibrillator Training', 'Hands-on Practice', 'Essential Knowledge']
      }
    ]
  }
]

const trainingFeatures = [
  {
    icon: Award,
    title: 'Fully Accredited',
    description: 'All courses are Ofqual regulated and HSE approved'
  },
  {
    icon: MapPin,
    title: 'On-Site Training',
    description: 'We come to your workplace across South Yorkshire'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Weekend and evening courses available'
  },
  {
    icon: Heart,
    title: 'Experienced Instructor',
    description: 'Learn from a professional with military and emergency service background'
  }
]

const ProductsPage: React.FC = () => {
  return (
    <div className="relative bg-white dark:bg-gray-900">
      <SEO
        title="First Aid Training Courses | React Fast Training"
        description="Professional first aid training courses in South Yorkshire. HSE approved workplace first aid, paediatric, and specialist courses from £60. Delivered by an experienced instructor."
        keywords="first aid courses South Yorkshire, workplace first aid training, paediatric first aid courses, HSE approved training, CPR training Yorkshire"
        canonical="/products"
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
              First Aid Training <span className="text-gradient gradient-primary">Courses</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
              Professional, accredited first aid training delivered across South Yorkshire. 
              Choose from our range of HSE approved and Ofsted compliant courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                href="/contact"
                size="lg"
                rightIcon={<ArrowRight />}
              >
                Book Your Course
              </Button>
              <Button
                href="/courses"
                size="lg"
                variant="outline"
              >
                View All Courses
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Course Categories */}
      {courseCategories.map((category, categoryIndex) => (
        <section 
          key={category.category}
          className={`section ${categoryIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
        >
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className={`w-16 h-16 bg-${category.color}-100 dark:bg-${category.color}-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <category.icon className={`w-8 h-8 text-${category.color}-600 dark:text-${category.color}-400`} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {category.category}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {category.description}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {category.courses.map((course, index) => (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r from-${category.color}-500 to-${category.color}-600`} />
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {course.price}
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {course.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 text-${category.color}-600 dark:text-${category.color}-400`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-3">
                        <Button
                          href={course.href}
                          variant="outline"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                          fullWidth
                        >
                          Learn More
                        </Button>
                        <Button
                          href="/contact"
                          fullWidth
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Why Choose Us */}
      <section className="section">
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
              Quality training delivered by an experienced professional
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trainingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Group Bookings */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <BookOpen className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Group Training Available
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Save time and money with on-site training for your team. 
              We can accommodate groups of up to 12 learners per course, 
              ensuring everyone gets personal attention and hands-on practice time.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Benefits of On-Site Training
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">No travel time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Training delivered at your workplace</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Team building</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Staff learn together as a team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Cost effective</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Save money on group bookings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Flexible scheduling</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose dates that suit your business</p>
                  </div>
                </div>
              </div>
              <Button
                href="/contact"
                size="lg"
                className="mt-8"
              >
                Enquire About Group Training
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  )
}

export default ProductsPage