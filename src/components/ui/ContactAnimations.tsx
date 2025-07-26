import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone } from 'lucide-react'

export const MapPinAnimation: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div 
        className="absolute inset-0 bg-red-500 rounded-full rounded-b-none"
        style={{
          clipPath: 'polygon(50% 100%, 0 40%, 50% 0, 100% 40%)',
        }}
      />
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
    </motion.div>
  )
}

export const PhoneRingAnimation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      className="inline-block"
      animate={{
        rotate: [0, 10, -10, 8, -8, 5, -5, 2, -2, 0],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut"
      }}
      style={{ transformOrigin: 'center top' }}
    >
      {children}
    </motion.div>
  )
}