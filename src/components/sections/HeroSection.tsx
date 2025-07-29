import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Award, Phone } from "lucide-react";
import MagneticButton from "@components/ui/MagneticButton";
import { useKineticTypography } from "@hooks/useAnimation";
import { AnimatedGradientText } from "@components/ui/AnimatedGradientText";

const HeroSection: React.FC = () => {
  const { ref: titleRef, displayText } = useKineticTypography(
    "Professional First Aid Training",
  );

  return (
    <section className="relative min-h-[100vh] flex items-start sm:items-center overflow-hidden pt-20 sm:pt-0">
      {/* Simplified Background for Mobile Performance */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        {/* Simplified pattern for mobile */}
        <div className="absolute inset-0 opacity-5 bg-medical-pattern" />
      </div>

      {/* Background floating icons handled by HomepageFloatingIcons at page level */}

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Main Content - Mobile First */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Certification Badge - Smaller on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Ofqual Regulated and HSE Approved</span>
            </motion.div>

            {/* Mobile-Optimized Title */}
            <div className="relative mb-6 sm:mb-8">
              <h1
                ref={titleRef}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-gray-900 dark:text-white leading-tight"
              >
                <span className="block">{displayText}</span>
                <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                  in Yorkshire
                </span>
              </h1>

              {/* Slogan - Hidden on very small screens */}
              <div className="hidden sm:block">
                <AnimatedGradientText
                  text="Act Fast | Save Lives"
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3 sm:mt-4 font-semibold"
                />
              </div>

              {/* Decorative Line - Centered on Mobile */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60px" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mt-3 sm:mt-4 mx-auto lg:mx-0"
              />
            </div>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 px-4 sm:px-0">
              Learn life-saving skills from an experienced professional. For
              businesses and individuals.
            </p>

            {/* CTA Buttons - Stack on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <MagneticButton
                href="/courses"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto px-6 py-4 text-base sm:text-lg"
              >
                View Courses
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Visual Element - Hidden on Mobile, Shown on Desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            {/* Desktop Card Stack Design */}
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
                <div className="flex items-center justify-center h-[400px] xl:h-[500px] p-8 lg:p-12">
                  <img
                    src="/images/logos/fulllogo_transparent.png"
                    alt="React Fast Training Logo"
                    className="w-full h-auto max-w-sm xl:max-w-md"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder-course.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Logo with Animated Frame - Shown only on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 sm:mt-12 lg:hidden text-center"
        >
          <div className="relative inline-block">
            {/* Back Card */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl transform rotate-3 scale-95"
              animate={{
                rotate: [3, 5, 3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Front Card */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl transform -rotate-2"
              animate={{
                rotate: [-2, -3, -2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* White background for logo */}
            <div className="relative bg-white rounded-2xl p-4 shadow-xl">
              <img
                src="/images/logos/fulllogo_transparent.png"
                alt="React Fast Training"
                className="w-40 sm:w-56 h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Wave - Simplified for Mobile */}
      <div className="absolute bottom-0 left-0 right-0 hidden sm:block">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 50C240 20 480 80 720 50C960 20 1200 80 1440 50V100H0V50Z"
            fill="white"
            fillOpacity="0.1"
          />
          <path
            d="M0 70C240 40 480 100 720 70C960 40 1200 100 1440 70V100H0V70Z"
            fill="white"
            fillOpacity="0.2"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
