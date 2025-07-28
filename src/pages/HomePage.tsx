import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Heart,
  Clock,
  MapPin,
  Award,
  Shield,
  Users,
  BookOpen,
  Calendar,
  Phone,
  Star,
  Sun,
} from "lucide-react";
import Button from "@components/ui/Button";
import HeroSection from "@components/sections/HeroSection";
import CTASection from "@components/sections/CTASection";
import SEO from "@components/common/SEO";
import { Link } from "react-router-dom";
import { useNotifications } from "@contexts/NotificationContext";
import { useTheme } from "@contexts/ThemeContext";
import { getCourseColorTheme } from "@/config/courseColorThemes.config";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";

const HomePage: React.FC = () => {
  console.log('🏠 [HOMEPAGE] HomePage component rendering...', {
    timestamp: new Date().toISOString(),
    url: window.location.href
  });

  const { addNotification } = useNotifications();
  const { setTheme } = useTheme();
  
  console.log('🔧 [HOMEPAGE] Hooks initialized:', {
    hasNotificationContext: !!addNotification,
    hasThemeContext: !!setTheme,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🏁 [HOMEPAGE] HomePage mounted', {
      timestamp: new Date().toISOString(),
      performanceNow: performance.now()
    });
    
    try {
      const firstVisit = localStorage.getItem("firstVisit");
      console.log('💾 [STORAGE] First visit check:', {
        firstVisit: firstVisit,
        isFirstVisit: !firstVisit,
        timestamp: new Date().toISOString()
      });
      
      if (!firstVisit) {
        console.log('🔔 [NOTIFICATION] Adding first visit notification...');
        addNotification({
          type: "info",
          title: "Light Mode Available",
          message: "Prefer a lighter background? Switch to light mode.",
          persistent: true,
          icon: <Sun className="w-5 h-5" />,
          actions: [
            {
              label: "Switch to Light Mode",
              onClick: () => {
                console.log('🎨 [THEME] User switching to light mode');
                setTheme("light");
              },
            },
          ],
        });
        localStorage.setItem("firstVisit", "false");
        console.log('✅ [STORAGE] First visit flag set');
      }
    } catch (error) {
      console.error('❌ [HOMEPAGE] Error in first visit check:', error);
    }
    
    return () => {
      console.log('🏁 [HOMEPAGE] HomePage unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, [addNotification, setTheme]);

  const courseCategories = useMemo(
    () => [
      // Row 1
      {
        title: "First Aid at Work (FAW)",
        duration: "3 Days",
        price: "£200",
        href: "/courses/faw",
      },
      {
        title: "Emergency First Aid at Work (EFAW)",
        duration: "1 Day",
        price: "£100",
        href: "/courses/efaw",
      },
      // Row 2
      {
        title: "Paediatric First Aid (PFA)",
        duration: "2 Days",
        price: "£120",
        href: "/courses/paediatric",
      },
      {
        title: "Emergency Paediatric First Aid (EPFA)",
        duration: "1 Day",
        price: "£100",
        href: "/courses/emergency-paediatric",
      },
      // Row 3
      {
        title: "Activity First Aid (Act FA)",
        duration: "1 Day",
        price: "£120",
        href: "/courses/activity-first-aid",
      },
      {
        title: "Annual Skills Refresher",
        duration: "3 Hours",
        price: "£60",
        href: "/courses/annual-skills-refresher",
      },
      // Row 4
      {
        title: "CPR and AED",
        duration: "3 Hours",
        price: "£60",
        href: "/courses/cpr-aed",
      },
      {
        title: "Oxygen Therapy Course",
        duration: "3 Hours",
        price: "£60",
        href: "/courses/oxygen-therapy",
      },
    ],
    [],
  );

  const trainingApproach = useMemo(
    () => [
      {
        icon: MapPin,
        title: "Flexible Training Locations",
        description:
          "Training venues arranged per booking to suit your needs - at your workplace or a convenient location",
      },
      {
        icon: Users,
        title: "Group Sizes",
        description:
          "Maximum 12 learners per course ensuring personal attention and effective learning",
      },
      {
        icon: Award,
        title: "Experienced trainer",
        description:
          "Learn from a professional with a military and emergency service background",
      },
    ],
    [],
  );

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
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900" />

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Available Training Courses
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              All courses are Ofqual regulated and HSE compliant, delivered by
              an experienced professional
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {courseCategories.map((course, index) => {
              // Determine course category and color theme
              const title = course.title.toLowerCase();
              const isWorkplace =
                title.includes("work") && !title.includes("paediatric");
              const isPaediatric = title.includes("paediatric");
              const isRefresher = title.includes("refresher");
              const isSpecialist = !isWorkplace && !isPaediatric && !isRefresher;
              const isPrimary = index < 2; // FAW and EFAW are most popular

              // Get color theme
              const colorTheme = getCourseColorTheme(course.title);

              return (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link
                    to={course.href}
                    className={`
                      block rounded-xl overflow-hidden transition-all duration-300
                      bg-gradient-to-br shadow-lg hover:shadow-2xl transform hover:-translate-y-1
                      ${isWorkplace ? "from-blue-50 via-white to-blue-50/30 dark:from-blue-900/20 dark:via-gray-800 dark:to-blue-900/10 border border-blue-200 dark:border-blue-700" : ""}
                      ${isPaediatric ? "from-purple-50 via-white to-purple-50/30 dark:from-purple-900/20 dark:via-gray-800 dark:to-purple-900/10 border border-purple-200 dark:border-purple-700" : ""}
                      ${isRefresher ? "from-green-50 via-white to-green-50/30 dark:from-green-900/20 dark:via-gray-800 dark:to-green-900/10 border border-green-200 dark:border-green-700" : ""}
                      ${isSpecialist ? "from-orange-50 via-white to-orange-50/30 dark:from-orange-900/20 dark:via-gray-800 dark:to-orange-900/10 border border-orange-200 dark:border-orange-700" : ""}
                      relative p-6 sm:p-8 min-h-[140px]
                    `}
                  >
                    {/* Badge for primary courses */}
                    {isPrimary && (
                      <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    {isRefresher && (
                      <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        HSE Recommended
                      </span>
                    )}

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 pr-20">
                      {course.title}
                    </h3>

                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {course.duration}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`
                          text-2xl font-bold
                          ${isWorkplace ? "text-blue-600 dark:text-blue-400" : ""}
                          ${isPaediatric ? "text-purple-600 dark:text-purple-400" : ""}
                          ${isRefresher ? "text-green-600 dark:text-green-400" : ""}
                          ${isSpecialist ? "text-orange-600 dark:text-orange-400" : ""}
                        `}
                        >
                          {course.price}
                        </span>
                      </div>
                    </div>

                    {/* Hover effect arrow */}
                    <ArrowRight
                      className={`
                      absolute bottom-6 right-6 w-5 h-5 transform translate-x-2 opacity-0 
                      group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300
                      ${isWorkplace ? "text-gray-400 group-hover:text-blue-500" : ""}
                      ${isPaediatric ? "text-gray-400 group-hover:text-purple-500" : ""}
                      ${isRefresher ? "text-gray-400 group-hover:text-green-500" : ""}
                      ${isSpecialist ? "text-gray-400 group-hover:text-orange-500" : ""}
                    `}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Training Approach Section - Bento Box Layout */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-4 sm:px-0">
              Quality training delivered in a way that works for you
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Professional and flexible first aid training solutions
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trainingApproach.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${index === 0 ? "bg-primary-100 dark:bg-primary-900/30" : ""}
                  ${index === 1 ? "bg-secondary-100 dark:bg-secondary-900/30" : ""}
                  ${index === 2 ? "bg-accent-100 dark:bg-accent-900/30" : ""}
                  ${index === 3 ? "bg-info-light dark:bg-info-dark/30" : ""}
                `}
                >
                  <item.icon
                    className={`
                    w-6 h-6
                    ${index === 0 ? "text-primary-600 dark:text-primary-400" : ""}
                    ${index === 1 ? "text-secondary-600 dark:text-secondary-400" : ""}
                    ${index === 2 ? "text-accent-600 dark:text-accent-400" : ""}
                    ${index === 3 ? "text-info dark:text-info-light" : ""}
                  `}
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section - Unique Cards */}
      <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Start Your First Aid Journey
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Join a growing community of trained first aiders across South
              Yorkshire
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Choose Your Course
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
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
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Book Your Date
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
                Flexible scheduling to suit your needs, including evenings and
                weekends
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Certified
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
                Receive your certificate upon successful completion
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
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-white text-center shadow-2xl">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Ready to Learn Life-Saving Skills?
              </h3>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90">
                Contact us today for a personalized quote for your team
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  href="/contact"
                  size="md"
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur border-2 border-white min-h-[48px]"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Get in Touch
                </Button>
                <Button
                  href="/courses"
                  size="md"
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur border-2 border-white min-h-[48px]"
                >
                  View All Courses
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Fully Accredited Training
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Our certifications meet all regulatory requirements
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Ofqual Regulated
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-secondary-600 dark:text-secondary-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                HSE Approved
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                CPD Certified
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-info dark:text-info-light" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Quality Assured
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Yorkshire Locations Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-4 sm:px-0">
              Flexible Training Across South Yorkshire
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              We arrange training venues to suit each booking - whether at your workplace or a convenient 
              location. We'll work with you to find the best venue for your needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              href="/contact"
              size="md"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white min-h-[48px] px-6 sm:px-8"
            >
              Contact Us to Arrange Training
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
