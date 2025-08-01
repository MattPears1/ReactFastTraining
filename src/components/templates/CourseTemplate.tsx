import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Award,
  MapPin,
  Users,
  CheckCircle,
  Calendar,
  Phone,
  BookOpen,
  Target,
} from "lucide-react";
import SEO from "@components/common/SEO";
import Button from "@components/ui/Button";
import { Link } from "react-router-dom";

export interface CourseTemplateProps {
  courseName: string;
  courseAcronym?: string;
  duration: string;
  price: string;
  certificateValidity: string;
  description: string;
  learningOutcomes: string[];
  whoShouldAttend: string[];
  courseContent: {
    title: string;
    topics: string[];
  }[];
  accreditations: string[];
  locations?: string[];
  groupSize?: string;
  prerequisites?: string;
  whatToExpect?: string[];
  assessmentMethod?: string;
  seoKeywords?: string;
}

const CourseTemplate: React.FC<CourseTemplateProps> = ({
  courseName,
  courseAcronym,
  duration,
  price,
  certificateValidity,
  description,
  learningOutcomes,
  whoShouldAttend,
  courseContent,
  accreditations,
  locations = ["Training venues arranged per booking", "On-site training available"],
  groupSize = "Maximum 12 learners",
  prerequisites = "None - suitable for beginners",
  whatToExpect = [],
  assessmentMethod = "Continuous assessment throughout the course",
  seoKeywords = "",
}) => {
  const pageTitle = courseAcronym
    ? `${courseName} (${courseAcronym}) | React Fast Training`
    : `${courseName} | React Fast Training`;

  const seoDescription = `${description} ${duration} course in Yorkshire. ${accreditations.join(", ")}. Book now from ${price}.`;

  return (
    <div className="relative">
      <SEO
        title={pageTitle}
        description={seoDescription}
        keywords={
          seoKeywords ||
          `${courseName.toLowerCase()}, first aid training Yorkshire, ${courseAcronym?.toLowerCase() || ""}`
        }
        canonical={`/courses/${courseName.toLowerCase().replace(/\s+/g, "-")}`}
      />

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
              <span className="text-sm font-medium">
                {accreditations.join(" & ")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {courseName}
              {courseAcronym && (
                <span className="block text-3xl md:text-4xl lg:text-5xl text-primary-600 dark:text-primary-400 mt-2">
                  ({courseAcronym}) Course Yorkshire
                </span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="group"
                as={Link}
                to="/contact"
              >
                Book Your Place - {price}
                <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" as="a" href="tel:07447485644">
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
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Duration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{duration}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Award className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Certificate
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {certificateValidity}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Locations
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{locations[0]}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Users className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Group Size
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{groupSize}</p>
            </motion.div>
          </div>

          {/* Course Overview */}
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {description}
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Prerequisites:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {prerequisites}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Assessment:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {assessmentMethod}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Certificate:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {certificateValidity}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Learning Outcomes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                By the end of this course, you will be able to:
              </p>
              <ul className="space-y-2">
                {learningOutcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What You'll Learn
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive curriculum covering all essential topics
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseContent.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg"
              >
                <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {module.title}
                </h3>
                <ul className="space-y-2">
                  {module.topics.map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-400">
                        •
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {topic}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Attend */}
      <section className="section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Who Should Attend?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This course is ideal for:
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {whoShouldAttend.map((person, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4"
                >
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {person}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      {whatToExpect.length > 0 && (
        <section className="section bg-gray-50 dark:bg-gray-800">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                What to Expect
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {whatToExpect.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Available Locations */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Training Locations
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {locations.map((location, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-md"
                >
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {location}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We offer flexible training options including on-site delivery at
              your workplace. Contact us to discuss your specific requirements.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-600 dark:bg-primary-700">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Book Your {courseName} Course?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Professional first aid training delivered by experienced
              instructors
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                as={Link}
                to="/contact"
              >
                Book Now - {price}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                as="a"
                href="tel:07447485644"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call for Group Bookings
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CourseTemplate;
