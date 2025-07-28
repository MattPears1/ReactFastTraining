import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Users, Award, ArrowRight } from "lucide-react";
import { cn } from "@utils/cn";

interface Course {
  label: string;
  href: string;
  duration: string;
  description: string;
  icon: string;
}

const courses: Course[] = [
  {
    label: "Emergency First Aid at Work",
    href: "/courses/efaw",
    duration: "1 Day",
    description: "Essential emergency first aid skills for the workplace",
    icon: "🚑",
  },
  {
    label: "First Aid at Work",
    href: "/courses/faw",
    duration: "1 Day",
    description:
      "Comprehensive first aid training for appointed workplace first aiders",
    icon: "🏥",
  },
  {
    label: "Paediatric First Aid",
    href: "/courses/paediatric",
    duration: "1 Day",
    description: "Specialized first aid for those working with children",
    icon: "👶",
  },
  {
    label: "Emergency Paediatric First Aid",
    href: "/courses/emergency-paediatric",
    duration: "5 Hours",
    description: "Emergency first aid skills for childcare settings",
    icon: "🧸",
  },
  {
    label: "FAW Requalification",
    href: "/courses/faw-requalification",
    duration: "5 Hours",
    description: "Refresh your First Aid at Work certification",
    icon: "📋",
  },
  {
    label: "EFAW Requalification",
    href: "/courses/efaw-requalification",
    duration: "3 Hours",
    description: "Refresh your Emergency First Aid certification",
    icon: "🔄",
  },
  {
    label: "Paediatric Requalification",
    href: "/courses/paediatric-requalification",
    duration: "3 Hours",
    description: "Refresh your Paediatric First Aid certification",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    label: "Emergency Paediatric Requalification",
    href: "/courses/emergency-paediatric-requalification",
    duration: "3 Hours",
    description: "Refresh your Emergency Paediatric certification",
    icon: "🍼",
  },
  {
    label: "Activity First Aid",
    href: "/courses/activity-first-aid",
    duration: "1 Day",
    description: "First aid for sports and outdoor activities",
    icon: "⚽",
  },
  {
    label: "Activity First Aid Requalification",
    href: "/courses/activity-first-aid-requalification",
    duration: "3 Hours",
    description: "Refresh your Activity First Aid certification",
    icon: "🏃",
  },
  {
    label: "CPR and AED",
    href: "/courses/cpr-aed",
    duration: "3 Hours",
    description: "Learn life-saving CPR and defibrillator skills",
    icon: "❤️",
  },
  {
    label: "Annual Skills Refresher",
    href: "/courses/annual-skills-refresher",
    duration: "3 Hours",
    description: "Keep your first aid skills sharp and up-to-date",
    icon: "📚",
  },
  {
    label: "Oxygen Therapy",
    href: "/courses/oxygen-therapy",
    duration: "3 Hours",
    description: "Safe administration of emergency oxygen",
    icon: "💨",
  },
];

interface CoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoursesModal: React.FC<CoursesModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Our Training Courses
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                    Select a course to learn more about our HSE approved
                    training
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-4"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {courses.map((course) => (
                    <Link
                      key={course.href}
                      to={course.href}
                      onClick={onClose}
                      className="group relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-0.5 lg:hover:-translate-y-1"
                    >
                      {/* Icon */}
                      <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 lg:mb-4">
                        {course.icon}
                      </div>

                      {/* Content */}
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1.5 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                        {course.label}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                        {course.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{course.duration}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transform group-hover:translate-x-0.5 lg:group-hover:translate-x-1 transition-all" />
                      </div>

                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    All courses are HSE approved and Ofqual regulated
                  </p>
                  <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                    <Link
                      to="/courses"
                      onClick={onClose}
                      className="btn btn-outline btn-xs sm:btn-sm flex-1 sm:flex-initial"
                    >
                      See All Courses
                    </Link>
                    <Link
                      to="/booking"
                      onClick={onClose}
                      className="btn btn-primary btn-xs sm:btn-sm flex-1 sm:flex-initial"
                    >
                      Book Your Course
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CoursesModal;
