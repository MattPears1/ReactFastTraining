import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, BookOpen, Users, Award } from 'lucide-react'
import MagneticButton from '@components/ui/MagneticButton'
import { useKineticTypography } from '@hooks/useAnimation'
import { FloatingIcons } from '@components/ui/FloatingIcons'
import { AnimatedGradientText } from '@components/ui/AnimatedGradientText'

const HeroSection: React.FC = () => {
  const { ref: titleRef, displayText } = useKineticTypography('Professional First Aid Training')
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-16 md:-mt-20 lg:-mt-24 pt-16 md:pt-20 lg:pt-24">
      {/* Unique Diagonal Split Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M 0 0 L 100 0 L 100 70 L 0 100 Z" fill="rgba(16, 185, 129, 0.03)" />
        </svg>
      </div>

      {/* Floating Medical Icons Background */}
      <FloatingIcons />

      <div className="container relative z-10">
        {/* Unique Asymmetric Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Main Content - Takes up 7 columns */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            {/* Certification Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6"
            >
              <Award className="w-4 h-4" />
              Ofqual Regulated & HSE Approved
            </motion.div>

            {/* Title with Unique Typography */}
            <div className="relative mb-8">
              <h1 ref={titleRef} className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-gray-900 dark:text-white leading-tight">
                <span className="block">{displayText}</span>
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                  in South Yorkshire
                </span>
              </h1>
              {/* Animated Slogan */}
              <AnimatedGradientText 
                text="Act Fast | Learn Skills" 
                className="text-2xl md:text-3xl mt-4 font-semibold"
              />
              {/* Decorative Line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mt-4"
              />
            </div>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl">
              Professional first aid training in Yorkshire. Learn life-saving skills from an experienced instructor with real-world emergency service background.
            </p>

            {/* CTA Buttons in Unique Layout */}
            <div className="flex flex-wrap gap-4 mb-8">
              <MagneticButton
                size="lg"
                href="/courses"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                View Courses
              </MagneticButton>
              <MagneticButton
                variant="outline"
                size="lg"
                href="/contact"
                className="border-2 border-secondary-500 text-secondary-600 hover:bg-secondary-50"
              >
                Get a Quote
              </MagneticButton>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">From £75</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <Users className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Individual Groups</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <CheckCircle className="w-8 h-8 text-accent-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Certified</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Visual Element - Takes up 5 columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            {/* Unique Card Stack Design */}
            <div className="relative">
              {/* Back Card */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-3xl transform rotate-6 scale-95"
                animate={{
                  rotate: [6, 8, 6],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Middle Card */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 rounded-3xl transform -rotate-3 scale-98"
                animate={{
                  rotate: [-3, -5, -3],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Front Card with Logo */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800">
                <div className="flex items-center justify-center h-full p-12">
                  <img 
                    src="/images/logos/fulllogo_transparent.png" 
                    alt="React Fast Training Logo"
                    className="w-full h-auto max-w-md"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-course.jpg'
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 50C240 20 480 80 720 50C960 20 1200 80 1440 50V100H0V50Z" fill="white" fillOpacity="0.1"/>
          <path d="M0 60C240 30 480 90 720 60C960 30 1200 90 1440 60V100H0V60Z" fill="white" fillOpacity="0.2"/>
          <path d="M0 70C240 40 480 100 720 70C960 40 1200 100 1440 70V100H0V70Z" fill="white" fillOpacity="0.3"/>
        </svg>
      </div>
    </section>
  )
}

export default HeroSection