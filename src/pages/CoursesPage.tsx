import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  Shield,
  Users,
  Brain,
  Clock,
  Award,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  Activity,
  Zap,
  Calendar,
  Wind,
} from "lucide-react";
import SEO from "@components/common/SEO";
import Button from "@components/ui/Button";
import { AnimatedCourseCard } from "@components/ui/AnimatedCourseCard";

const courses = [
  // Primary courses - ordered as requested
  {
    id: "efaw",
    title: "Emergency First Aid at Work",
    acronym: "EFAW",
    duration: "1 Day",
    price: "£100",
    icon: Heart,
    color: "primary",
    description: "Essential life-saving skills for workplace emergencies",
    highlights: ["CPR & Resuscitation", "Wound Management", "HSE Approved"],
    href: "/courses/efaw",
  },
  {
    id: "faw",
    title: "First Aid at Work",
    acronym: "FAW",
    duration: "3 Days",
    price: "£200",
    icon: Shield,
    color: "secondary",
    description: "Comprehensive 3-day training for designated workplace first aiders",
    highlights: [
      "Advanced First Aid",
      "Emergency Protocols",
      "3-Year Certificate",
    ],
    href: "/courses/faw",
  },
  {
    id: "paediatric",
    title: "Paediatric First Aid",
    acronym: "PFA",
    duration: "2 Days",
    price: "£120",
    icon: Users,
    color: "accent",
    description: "Specialized 2-day training for those working with children",
    highlights: ["Child CPR", "Common Illnesses", "Ofsted Compliant"],
    href: "/courses/paediatric",
  },
  {
    id: "emergency-paediatric",
    title: "Emergency Paediatric First Aid",
    acronym: "EPFA",
    duration: "1 Day",
    price: "£100",
    icon: Users,
    color: "accent",
    description: "Essential emergency care for infants and children",
    highlights: ["Child CPR", "EYFS Compliant", "1-Day Course"],
    href: "/courses/emergency-paediatric",
  },
];

const additionalCourses = [
  {
    id: "activity-first-aid",
    title: "Activity First Aid",
    acronym: "AFA",
    duration: "1 Day",
    price: "£120",
    icon: Activity,
    color: "warning",
    description: "First aid for sports and outdoor activities",
    highlights: ["Outdoor Skills", "Sports Injuries", "Adventure Activities"],
    href: "/courses/activity-first-aid",
  },
  {
    id: "cpr-aed",
    title: "CPR and AED",
    acronym: "CPR/AED",
    duration: "3 Hours",
    price: "£60",
    icon: Zap,
    color: "error",
    description: "Life-saving CPR and defibrillator training",
    highlights: ["Hands-on Practice", "AED Training", "Essential Skills"],
    href: "/courses/cpr-aed",
  },
  {
    id: "annual-skills-refresher",
    title: "Annual Skills Refresher",
    acronym: "ASR",
    duration: "3 Hours",
    price: "£60",
    icon: Calendar,
    color: "info",
    description: "Keep your first aid skills current",
    highlights: ["Annual Update", "Skills Practice", "HSE Recommended"],
    href: "/courses/annual-skills-refresher",
  },
  {
    id: "oxygen-therapy",
    title: "Oxygen Therapy Course",
    acronym: "O2",
    duration: "3 Hours",
    price: "£60",
    icon: Wind,
    color: "success",
    description: "Safe administration of emergency oxygen",
    highlights: ["Oxygen Equipment", "Safety Protocols", "3-Year Certificate"],
    href: "/courses/oxygen-therapy",
  },
];

const CoursesPage: React.FC = () => {
  return (
    <div className="relative">
      <SEO
        title="First Aid Courses Yorkshire | React Fast Training"
        description="Browse our range of accredited first aid courses in Yorkshire. Emergency First Aid, Paediatric, Mental Health First Aid and more. HSE approved training from £75."
        keywords="first aid courses Yorkshire, EFAW course, FAW training, paediatric first aid, mental health first aid, Yorkshire training"
        canonical="/courses"
      />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 md:py-28 lg:py-32 overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Our{" "}
              <span className="text-gradient gradient-primary">
                First Aid Courses
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Professional, accredited first aid training delivered across
              Yorkshire. Choose from our range of Ofqual regulated and HSE
              approved courses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-6 lg:gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div
                    className={`h-2 bg-gradient-to-r from-${course.color}-500 to-${course.color}-600`}
                  />
                  <div className="p-6 sm:p-6 md:p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-${course.color}-100 dark:bg-${course.color}-900/30 rounded-lg sm:rounded-xl flex items-center justify-center`}
                      >
                        <course.icon
                          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-${course.color}-600 dark:text-${course.color}-400`}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Duration
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                          {course.duration}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                      {course.acronym}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                      {course.description}
                    </p>

                    <div className="space-y-2 mb-4 sm:mb-6">
                      {course.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle
                            className={`w-3 h-3 sm:w-4 sm:h-4 text-${course.color}-600 dark:text-${course.color}-400 flex-shrink-0`}
                          />
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {course.price}
                      </p>
                      <Button
                        href={course.href}
                        variant="outline"
                        size="sm"
                        rightIcon={
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        }
                        className={`border-${course.color}-500 text-${course.color}-600 hover:bg-${course.color}-50 dark:hover:bg-${course.color}-900/20 group-hover:scale-105 transition-transform min-h-[40px] sm:min-h-[44px]`}
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

      {/* Additional Courses */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Specialist & Refresher Courses
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Keep your skills current with our range of refresher and
              specialist courses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div
                    className={`h-1.5 bg-gradient-to-r from-${course.color}-500 to-${course.color}-600`}
                  />
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 bg-${course.color}-100 dark:bg-${course.color}-900/30 rounded-lg flex items-center justify-center`}
                      >
                        <course.icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 text-${course.color}-600 dark:text-${course.color}-400`}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                      {course.acronym}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                        {course.price}
                      </p>
                      <Button
                        href={course.href}
                        size="sm"
                        variant="outline"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        className={`text-${course.color}-600 border-${course.color}-500 hover:bg-${course.color}-50 dark:hover:bg-${course.color}-900/20 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm`}
                      >
                        Details
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
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Why Choose React Fast Training?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              We're committed to delivering the highest quality first aid
              training in Yorkshire
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Award className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fully Accredited
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
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
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-secondary-600 dark:text-secondary-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Trainers
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
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
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Flexible Options
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
                On-site training and weekend courses available
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary-600 dark:bg-primary-700">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Book Your Course?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
              Contact us today to discuss your training needs or book your place
              on our next course
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="md"
                variant="secondary"
                href="/contact"
                className="min-h-[48px]"
              >
                Get in Touch
              </Button>
              <Button
                size="md"
                variant="outline"
                className="border-white text-white hover:bg-white/10 min-h-[48px]"
                href="tel:07447485644"
              >
                Call 07447 485644
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CoursesPage;
