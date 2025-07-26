import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, CheckCircle } from 'lucide-react'
import MagneticButton from '@components/ui/MagneticButton'
import OrganicDivider from '@components/ui/OrganicDivider'
import { useKineticTypography, useParallax } from '@hooks/useAnimation'
import RetroFilter from '@components/ui/RetroFilter'

const HeroSection: React.FC = () => {
  const { ref: parallaxRef, scrollY } = useParallax(0.5)
  const { ref: titleRef, displayText } = useKineticTypography('Act Fast. Save Lives.')
  
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden py-20 sm:py-24 md:py-0">
      {/* Dynamic Background with Medical Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 medical-cross-pattern" />
        {/* Liquid gradient background */}
        <div className="absolute inset-0 liquid-gradient opacity-10" />
      </div>

      {/* Animated Background Shapes - Enhanced with Organic Movement */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          ref={parallaxRef}
          className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 organic-shape-1 bg-primary-400/20 blur-3xl float-organic"
          style={{
            transform: `translateY(${scrollY}px)`,
          }}
        />
        <motion.div
          className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 organic-shape-2 bg-secondary-400/20 blur-3xl float-organic animation-delay-400"
          style={{
            transform: `translateY(${-scrollY * 0.8}px)`,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 organic-shape-3 bg-accent-400/10 blur-2xl float-organic animation-delay-600"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Ofqual Regulated & HSE Approved Training
            </motion.div>

            <h1 ref={titleRef} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-ultra-bold leading-tight">
              <span className="block kinetic-text">
                {displayText}
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl mt-4 text-gray-700 dark:text-gray-300 font-semibold">
                Yorkshire's Premier First Aid Training
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl">
              Professional first aid training delivered by experienced instructors with military and emergency services backgrounds. 
              Courses from £75. On-site training available across Yorkshire.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <MagneticButton
                size="lg"
                href="/contact"
                rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="group w-full sm:w-auto justify-center"
              >
                <span className="relative">
                  Book Your Course
                  <span className="absolute inset-0 text-gradient gradient-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Book Your Course
                  </span>
                </span>
              </MagneticButton>
              <MagneticButton
                variant="outline"
                size="lg"
                leftIcon={<PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="border-2 sm:border-3 hover:border-primary-500 transition-colors w-full sm:w-auto justify-center"
              >
                View Courses
              </MagneticButton>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Trusted by Yorkshire businesses and organizations
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">98% Pass Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Same Day Certificates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Small Group Sizes</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Asymmetric Hero Visual - 3D Transform */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -30 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative perspective-1000 hidden lg:block"
          >
            <div className="relative z-10 transform-gpu">
              {/* 3D Card with depth */}
              <motion.div 
                className="aspect-square bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl shadow-2xl flex items-center justify-center card-3d"
                whileHover={{ 
                  rotateY: 15,
                  rotateX: -10,
                  scale: 1.05,
                }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="text-white text-center p-8 relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM2 12v2h7v7h2v-7h7v-2H11V5H9v7z"/>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-4">
                      Learn Life-Saving Skills
                    </h3>
                    <p className="mb-6 text-lg">
                      Join thousands who've trained with us
                    </p>
                    <MagneticButton variant="secondary" size="lg">
                      Book Now - £75
                    </MagneticButton>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Brutalist/Asymmetric Decorative Elements */}
            <motion.div
              className="absolute -z-10 top-12 -right-12 w-full h-full brutalist-border bg-black dark:bg-white"
              animate={{
                rotate: [0, 8, 0],
                x: [0, 20, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -z-20 -top-8 right-8 w-full h-full border-4 border-primary-500 rounded-3xl"
              animate={{
                rotate: [0, -12, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -left-4 w-12 h-12 bg-accent-400 rounded-lg shadow-lg"
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-4 -right-4 w-16 h-16 bg-success-400 rounded-full shadow-lg"
              animate={{
                y: [0, 20, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Organic Divider at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 transform translate-y-1">
        <OrganicDivider 
          variant="wave" 
          color="rgb(var(--primary-100))" 
          className="dark:opacity-20" 
          animate 
        />
      </div>
      
      {/* SVG Filters for Gooey Effect */}
      <svg className="absolute" width="0" height="0">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </section>
  )
}

export default HeroSection