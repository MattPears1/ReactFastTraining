import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Stethoscope, Siren, Activity, ShieldCheck, BandaidIcon, Thermometer, HeartHandshake } from 'lucide-react'

const icons = [
  { Icon: Heart, color: 'text-red-500', delay: 0 },
  { Icon: Stethoscope, color: 'text-blue-500', delay: 1 },
  { Icon: Siren, color: 'text-orange-500', delay: 2 },
  { Icon: Activity, color: 'text-green-500', delay: 3 },
  { Icon: ShieldCheck, color: 'text-purple-500', delay: 4 },
  { Icon: BandaidIcon, color: 'text-pink-500', delay: 5 },
  { Icon: Thermometer, color: 'text-teal-500', delay: 6 },
  { Icon: HeartHandshake, color: 'text-indigo-500', delay: 7 },
]

export const FloatingIcons: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.color} opacity-20`}
          style={{
            left: `${10 + (index * 12)}%`,
            top: `${20 + (index % 3) * 30}%`,
          }}
          animate={{
            y: [-30, 30, -30],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 6 + index,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut"
          }}
        >
          <item.Icon size={40 + (index % 3) * 10} />
        </motion.div>
      ))}
    </div>
  )
}