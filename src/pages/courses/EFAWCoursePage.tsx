import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Award, MapPin, Users, CheckCircle, Calendar, Phone, Mail } from 'lucide-react'
import SEO from '@components/common/SEO'
import Button from '@components/ui/Button'
import { Link } from 'react-router-dom'

const EFAWCoursePage: React.FC = () => {
  const courseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': 'https://www.reactfasttraining.co.uk/courses/emergency-first-aid-at-work#course',
    name: 'Emergency First Aid at Work (EFAW)',
    description: 'HSE approved 1-day Emergency First Aid at Work course covering essential life-saving skills. Ideal for low-risk workplaces in Yorkshire.',
    provider: {
      '@type': 'Organization',
      name: 'React Fast Training',
      sameAs: 'https://www.reactfasttraining.co.uk'
    },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: '100',
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      url: 'https://www.reactfasttraining.co.uk/courses/emergency-first-aid-at-work',
      validFrom: '2025-01-01'
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Workplace employees',
      geographicArea: {
        '@type': 'Place',
        name: 'Yorkshire, UK'
      }
    },
    courseMode: ['In-person', 'On-site'],
    courseWorkload: 'PT6H',
    educationalCredentialAwarded: 'EFAW Certificate (Valid for 3 years)',
    competencyRequired: 'None - suitable for beginners',
    teaches: [
      'CPR and resuscitation',
      'Choking management',
      'Wound treatment',
      'Shock management',
      'Recovery position',
      'Emergency procedures'
    ],
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'https://schema.org/OfflineEventAttendanceMode',
        duration: 'P1D',
        instructor: {
          '@type': 'Person',
          name: 'Lex Hancock',
          jobTitle: 'Lead First Aid Trainer'
        }
      }
    ]
  }

  return (
    <div className="relative">
      <SEO
        title="Emergency First Aid at Work Course Yorkshire | EFAW Training"
        description="1-day Emergency First Aid at Work (EFAW) course in Yorkshire from £100. HSE approved training in Sheffield. Book your place today."
        keywords="EFAW course Yorkshire, emergency first aid at work Leeds, EFAW training Sheffield, first aid course Bradford, 1 day first aid course Yorkshire"
        canonical="/courses/emergency-first-aid-at-work"
        jsonLd={courseStructuredData}
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
            <div className="inline-flex items-center gap-2 bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200 px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">HSE Approved & Ofqual Regulated</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Emergency First Aid at Work
              <span className="block text-3xl md:text-4xl lg:text-5xl text-primary-600 dark:text-primary-400 mt-2">
                (EFAW) Course Yorkshire
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Essential 1-day first aid training for Yorkshire workplaces. 
              Learn life-saving skills from experienced professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group" as={Link} to="/booking?course=EFAW">
                Book Your Place - £100
                <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" as={Link} to="/contact">
                <Phone className="w-5 h-5 mr-2" />
                Call 07447 485644
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Information */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Clock className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Duration</h3>
              <p className="text-gray-600 dark:text-gray-400">1 Day (6 hours)</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Award className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Certificate</h3>
              <p className="text-gray-600 dark:text-gray-400">Valid for 3 years</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Locations</h3>
              <p className="text-gray-600 dark:text-gray-400">Leeds, Sheffield, Bradford</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Users className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Group Size</h3>
              <p className="text-gray-600 dark:text-gray-400">Max 12 delegates</p>
            </motion.div>
          </div>

          {/* Course Description */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              About the EFAW Course
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p>
                The Emergency First Aid at Work (EFAW) course is designed to meet the requirements of the 
                Health and Safety (First Aid) Regulations 1981. This comprehensive 1-day course is perfect 
                for nominated workplace first aiders in low-risk environments across Yorkshire.
              </p>
              <p>
                Our experienced trainers, including ex-military personnel, deliver engaging and practical 
                training that equips you with the confidence and skills to handle emergency situations 
                effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What You'll Learn
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Core Skills
              </h3>
              <ul className="space-y-3">
                {[
                  'Adult CPR and resuscitation techniques',
                  'Safe use of an AED (defibrillator)',
                  'Choking management procedures',
                  'Recovery position placement',
                  'Control of bleeding and shock',
                  'Basic wound management'
                ].map((skill, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Emergency Procedures
              </h3>
              <ul className="space-y-3">
                {[
                  'Scene safety and initial assessment',
                  'Primary survey techniques',
                  'When and how to call emergency services',
                  'Managing an unconscious casualty',
                  'Dealing with seizures',
                  'Record keeping and reporting'
                ].map((skill, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Information */}
      <section className="section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Book Your EFAW Course
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Public Courses
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Join our scheduled courses at venues across Yorkshire:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">Leeds City Centre</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">Sheffield Business Park</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">Bradford City Centre</span>
                    </li>
                  </ul>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    £100 per person
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Includes certification, manual & refreshments
                  </p>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    On-Site Training
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    We come to your workplace anywhere in Yorkshire:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      <span className="text-gray-700 dark:text-gray-300">No travel time for staff</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      <span className="text-gray-700 dark:text-gray-300">Tailored to your workplace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      <span className="text-gray-700 dark:text-gray-300">Flexible scheduling</span>
                    </li>
                  </ul>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    From £600
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    For groups up to 12 people
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Next available dates: Every Wednesday & Saturday
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" as={Link} to="/booking?course=EFAW">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book This Course
                </Button>
                <Button variant="outline" size="lg" as={Link} to="/contact">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-primary-50 dark:bg-gray-900">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Choose React Fast Training?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fully Accredited
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                HSE approved & Ofqual regulated courses with recognized certification
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Trainers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ex-military & emergency services professionals with real-world experience
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Local to Yorkshire
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Based in Yorkshire, serving Leeds, Sheffield, Bradford and beyond
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default EFAWCoursePage