import React from "react";
import { motion } from "framer-motion";
import { Clock, Award, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@utils/cn";

interface AnimatedCourseCardProps {
  title: string;
  duration: string;
  price: string;
  features: string[];
  href: string;
  color?: "primary" | "secondary" | "accent";
  popular?: boolean;
}

export const AnimatedCourseCard: React.FC<AnimatedCourseCardProps> = ({
  title,
  duration,
  price,
  features,
  href,
  color = "primary",
  popular = false,
}) => {
  const colorClasses = {
    primary: "from-blue-500 to-blue-600",
    secondary: "from-green-500 to-green-600",
    accent: "from-orange-500 to-orange-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="relative h-full"
    >
      <div className="h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {popular && (
          <div className="absolute -top-4 -right-4 z-10">
            <motion.div
              className="bg-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Popular
            </motion.div>
          </div>
        )}

        <div className={cn("h-2 bg-gradient-to-r", colorClasses[color])} />

        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <motion.div
              className="text-2xl font-bold text-primary-600 dark:text-primary-400"
              whileHover={{ scale: 1.05 }}
            >
              {price}
            </motion.div>
          </div>

          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <motion.li
                key={feature}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CheckCircle
                  className={cn(
                    "w-4 h-4",
                    `text-${color}-600 dark:text-${color}-400`,
                  )}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {feature}
                </span>
              </motion.li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Link to={href} className="flex-1 group">
              <motion.button
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/booking" className="flex-1">
              <motion.button
                className={cn(
                  "w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-200",
                  "bg-gradient-to-r",
                  colorClasses[color],
                  "hover:shadow-lg",
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Book Now
              </motion.button>
            </Link>
          </div>

          {/* Certificate Badge with Shine Animation */}
          <motion.div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium relative overflow-hidden">
            <Award className="w-4 h-4" />
            <span>HSE Approved</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: [-100, 100] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ transform: "skewX(-20deg)" }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
