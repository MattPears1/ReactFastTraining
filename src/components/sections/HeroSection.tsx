import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, BookOpen, Users, Award } from 'lucide-react'
import MagneticButton from '@components/ui/MagneticButton'
import { useKineticTypography } from '@hooks/useAnimation'

const HeroSection: React.FC = () => {
  const { ref: titleRef, displayText } = useKineticTypography('React Fast Training')
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
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
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 opacity-10"
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500">
            <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM2 12v2h7v7h2v-7h7v-2H11V5H9v7z"/>
          </svg>
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-10 opacity-10"
          animate={{
            y: [0, 30, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor" className="text-secondary-500">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </motion.div>
      </div>

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
                  Act Fast. Save Lives.
                </span>
              </h1>
              {/* Decorative Line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mt-4"
              />
            </div>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl">
              Professional first aid training in Yorkshire. Learn life-saving skills from experienced instructors with real-world emergency service backgrounds.
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">Small Groups</p>
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
              {/* Front Card */}
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-square flex flex-col items-center justify-center text-white">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="mb-6">
                      <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM2 12v2h7v7h2v-7h7v-2H11V5H9v7z"/>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Learn to Save Lives</h3>
                  <p className="text-center text-white/90">
                    Professional training that makes a difference
                  </p>
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