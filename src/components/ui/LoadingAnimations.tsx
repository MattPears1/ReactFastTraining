import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Cross } from 'lucide-react'

export const HeartPulseLoader: React.FC<{ size?: number }> = ({ size = 60 }) => {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.1, 1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Heart 
        className="w-full h-full text-red-500 fill-red-500"
        strokeWidth={0}
      />
    </motion.div>
  )
}

export const MedicalCrossSpinner: React.FC<{ size?: number }> = ({ size = 60 }) => {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <Cross className="w-full h-full text-green-500" strokeWidth={3} />
    </motion.div>
  )
}

export const EmergencyDotsLoader: React.FC = () => {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-4 h-4 bg-blue-500 rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: index * 0.16,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <HeartPulseLoader size={80} />
        <motion.p 
          className="mt-4 text-lg text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  )
}