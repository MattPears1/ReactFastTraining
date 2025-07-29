import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Stethoscope,
  Siren,
  Activity,
  ShieldCheck,
  Cross,
  Thermometer,
  HeartHandshake,
} from "lucide-react";

const icons = [
  { Icon: Heart, color: "text-red-500", delay: 0, left: "5%", top: "10%" },
  { Icon: Stethoscope, color: "text-blue-500", delay: 1, left: "85%", top: "15%" },
  { Icon: Siren, color: "text-orange-500", delay: 2, left: "15%", top: "70%" },
  { Icon: Activity, color: "text-green-500", delay: 3, left: "70%", top: "60%" },
  { Icon: ShieldCheck, color: "text-purple-500", delay: 4, left: "90%", top: "40%" },
  { Icon: Cross, color: "text-pink-500", delay: 5, left: "25%", top: "30%" },
  { Icon: Thermometer, color: "text-teal-500", delay: 6, left: "60%", top: "20%" },
  { Icon: HeartHandshake, color: "text-indigo-500", delay: 7, left: "40%", top: "80%" },
  // Additional icons for better coverage
  { Icon: Heart, color: "text-red-400", delay: 2.5, left: "50%", top: "50%" },
  { Icon: Stethoscope, color: "text-blue-400", delay: 3.5, left: "10%", top: "45%" },
  { Icon: Activity, color: "text-green-400", delay: 4.5, left: "80%", top: "75%" },
  { Icon: ShieldCheck, color: "text-purple-400", delay: 5.5, left: "35%", top: "5%" },
];

export const FloatingIcons: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.color} opacity-10 sm:opacity-15 lg:opacity-20`}
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + (index % 3) * 2,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon 
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
          />
        </motion.div>
      ))}
    </div>
  );
};
