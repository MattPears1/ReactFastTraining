import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, Shield, Users, BarChart3, Globe, Smartphone, 
  Cloud, Lock, Palette, Code, Headphones, TrendingUp 
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast Performance',
    description: 'Optimized for speed with cutting-edge technology that ensures your applications run at peak performance.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with end-to-end encryption, regular security audits, and compliance certifications.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Built for teams with real-time collaboration features, role-based access, and activity tracking.',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive analytics dashboard with real-time insights and customizable reports.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: 'Deploy globally with our CDN and multi-region infrastructure for low latency worldwide.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Responsive design that works seamlessly across all devices and screen sizes.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
  },
]

const additionalFeatures = [
  { icon: Cloud, label: 'Cloud Storage' },
  { icon: Lock, label: 'Data Privacy' },
  { icon: Palette, label: 'Customizable' },
  { icon: Code, label: 'API Access' },
  { icon: Headphones, label: '24/7 Support' },
  { icon: TrendingUp, label: 'Scalable' },
]

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
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our comprehensive suite of features is designed to help you achieve your goals faster 
            and more efficiently than ever before.
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
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
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
            Plus Many More Features
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
            Not sure which features you need?
          </p>
          <a
            href="/features"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            View detailed comparison
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
  )
}

export default FeaturesSection