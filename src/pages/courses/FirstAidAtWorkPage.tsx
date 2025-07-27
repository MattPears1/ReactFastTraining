import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Award, Calendar, CheckCircle, BookOpen, Heart, Shield } from 'lucide-react'
import Button from '@components/ui/Button'
import SEO from '@components/common/SEO'
import { Link } from 'react-router-dom'

const FirstAidAtWorkPage: React.FC = () => {
  const courseContent = [
    'The roles and responsibilities of a first aider',
    'Managing an emergency situation',
    'Treating an unconscious casualty',
    'CPR and defibrillator use',
    'Choking procedures',
    'Seizure management',
    'Wounds and bleeding control',
    'Shock treatment',
    'Minor injuries and burns',
    'Injuries to bones, muscles and joints',
    'Spinal injuries',
    'Chest injuries',
    'Anaphylaxis and severe allergic reactions',
    'Heart attack and stroke recognition',
    'Eye injuries',
    'Poisoning',
    'Record keeping and accident reporting'
  ]

  const whoShouldAttend = [
    'Designated workplace first aiders',
    'Health and safety representatives',
    'HR managers and team leaders',
    'Anyone wanting comprehensive first aid skills',
    'Those working in higher-risk environments'
  ]

  const whatYouGet = [
    'Full day intensive training course',
    'HSE approved certification valid for 3 years',
    'Comprehensive course manual',
    'Practical hands-on training',
    'Small group sizes (max 12)',
    'Certificate on successful completion',
    'Post-course support'
  ]

  return (
    <div className="relative bg-white dark:bg-gray-900">
      <SEO
        title="First Aid at Work Course Yorkshire | Full Day FAW Training"
        description="Comprehensive full day First Aid at Work course in Yorkshire. HSE approved FAW training for designated workplace first aiders. Book your place today."
        keywords="first aid at work course, FAW training Yorkshire, full day first aid course, HSE first aid training, workplace first aider"
        canonical="/courses/first-aid-at-work"
      />


      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <pattern id="grid-faw" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid-faw)" />
          </svg>
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              HSE Approved Course
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gray-900 dark:text-white mb-6">
              First Aid at Work
              <span className="block text-3xl md:text-4xl mt-2 text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-primary-500">
                Full Day Comprehensive Training
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              The most comprehensive first aid qualification for workplace first aiders. 
              Learn life-saving skills in one intensive, practical training day.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white"
              >
                Book Your Place
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-secondary-500 text-secondary-600 hover:bg-secondary-50"
              >
                Download Course Info
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Course Overview */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
            >
              <Clock className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Duration</h3>
              <p className="text-gray-600 dark:text-gray-400">Full Day (6 hours)</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">9:00 AM - 3:00 PM</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
            >
              <Award className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Certification</h3>
              <p className="text-gray-600 dark:text-gray-400">Valid for 3 years</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">HSE approved qualification</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
            >
              <Users className="w-12 h-12 text-accent-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Group Size</h3>
              <p className="text-gray-600 dark:text-gray-400">Maximum 12 learners</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Ensures personal attention</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              What You'll Learn
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive training covering all aspects of workplace first aid
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {courseContent.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Attend */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-6">
                Who Should Attend?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This course is ideal for anyone who needs to be a qualified first aider in their workplace. 
                The HSE recommends that all workplaces have adequate first aid provision.
              </p>
              <ul className="space-y-4">
                {whoShouldAttend.map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <Users className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                What's Included
              </h3>
              <ul className="space-y-4">
                {whatYouGet.map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8">
              Learn from the Best
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Lex - Your Course Instructor
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                With extensive experience in high-risk environments including military service and law enforcement, 
                Lex brings real-world expertise to every training session. You'll learn practical skills that work 
                in real emergencies, not just textbook theory.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300">Military Background</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-secondary-500" />
                  <span className="text-gray-700 dark:text-gray-300">Emergency Services</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent-500" />
                  <span className="text-gray-700 dark:text-gray-300">Passionate Educator</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary-500 to-primary-500">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Become a Workplace First Aider?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join our next First Aid at Work course and gain essential workplace first aid skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-secondary-600 hover:bg-gray-100"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Check Available Dates
              </Button>
              <Button
                href="/contact"
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
              >
                Get a Quote
              </Button>
            </div>
            <p className="mt-6 text-white/80">
              Group bookings available • On-site training options • Flexible scheduling
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default FirstAidAtWorkPage