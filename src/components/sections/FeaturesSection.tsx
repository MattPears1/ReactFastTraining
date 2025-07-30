import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Clock,
  MapPin,
  Award,
  Users,
  BookOpen,
  GraduationCap,
  Building,
  Baby,
  Brain,
  Briefcase,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Emergency First Aid at Work",
    description:
      "One-day course covering life-saving basics. HSE compliant training for workplace first aiders. Certificate valid for 3 years.",
    price: "£75",
    duration: "1 Day",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  {
    icon: Briefcase,
    title: "First Aid at Work",
    description:
      "Comprehensive course for designated workplace first aiders. Covers all emergency situations and advanced techniques.",
    price: "£225",
    duration: "1 Day",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Baby,
    title: "Paediatric First Aid",
    description:
      "Essential training for childcare professionals. Covers infant and child CPR, choking, and common childhood emergencies.",
    price: "£95",
    duration: "1 Day",
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/20",
  },
  {
    icon: Brain,
    title: "Mental Health First Aid",
    description:
      "Learn to recognise and support mental health issues in the workplace. Includes crisis intervention techniques.",
    price: "£125",
    duration: "1 Day",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    icon: Users,
    title: "Group Bookings",
    description:
      "On-site training for 6+ people. We come to your workplace. Flexible scheduling including weekends and evenings.",
    price: "From £60pp",
    duration: "Flexible",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    icon: GraduationCap,
    title: "Refresher Training",
    description:
      "3-hour refresher courses for those with existing certificates. Keep your skills sharp and certification current.",
    price: "£45",
    duration: "3 Hours",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
];

const additionalFeatures = [
  { icon: Award, label: "Ofqual Regulated" },
  { icon: CheckCircle, label: "HSE Approved" },
  { icon: Clock, label: "Same Day Certificates" },
  { icon: MapPin, label: "Yorkshire Based" },
  { icon: BookOpen, label: "Free Course Materials" },
  { icon: Building, label: "On-Site Training" },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="section">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our First Aid Training Courses
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Professional, practical first aid training delivered by an
            experienced instructor. All courses are Ofqual regulated and HSE
            approved.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="card h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div
                    className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {feature.price}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.duration}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Why Choose React Fast Training?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg shadow-md flex items-center justify-center mx-auto mb-3 hover:shadow-lg transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Comparison or Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Not sure which course is right for you?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Contact us for advice
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
