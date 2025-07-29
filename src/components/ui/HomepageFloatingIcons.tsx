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
  Clipboard,
  Phone,
  Clock,
  Award,
} from "lucide-react";

const icons = [
  // Upper section icons
  { Icon: Heart, color: "text-red-500", delay: 0, left: "5%", top: "5%" },
  { Icon: Stethoscope, color: "text-blue-500", delay: 1, left: "85%", top: "8%" },
  { Icon: Siren, color: "text-orange-500", delay: 2, left: "15%", top: "12%" },
  { Icon: Activity, color: "text-green-500", delay: 3, left: "70%", top: "15%" },
  { Icon: ShieldCheck, color: "text-purple-500", delay: 4, left: "90%", top: "20%" },
  
  // Mid section icons
  { Icon: Cross, color: "text-pink-500", delay: 5, left: "25%", top: "30%" },
  { Icon: Thermometer, color: "text-teal-500", delay: 6, left: "60%", top: "35%" },
  { Icon: HeartHandshake, color: "text-indigo-500", delay: 7, left: "40%", top: "40%" },
  { Icon: Heart, color: "text-red-400", delay: 2.5, left: "50%", top: "25%" },
  { Icon: Stethoscope, color: "text-blue-400", delay: 3.5, left: "10%", top: "45%" },
  
  // Lower section icons
  { Icon: Activity, color: "text-green-400", delay: 4.5, left: "80%", top: "50%" },
  { Icon: ShieldCheck, color: "text-purple-400", delay: 5.5, left: "35%", top: "55%" },
  { Icon: Cross, color: "text-pink-400", delay: 1.5, left: "65%", top: "60%" },
  { Icon: Clipboard, color: "text-yellow-500", delay: 6.5, left: "20%", top: "65%" },
  { Icon: Phone, color: "text-gray-500", delay: 7.5, left: "75%", top: "70%" },
  
  // Bottom section icons
  { Icon: Clock, color: "text-orange-400", delay: 8, left: "45%", top: "75%" },
  { Icon: Award, color: "text-purple-600", delay: 8.5, left: "10%", top: "80%" },
  { Icon: Thermometer, color: "text-teal-400", delay: 9, left: "85%", top: "85%" },
  { Icon: HeartHandshake, color: "text-indigo-400", delay: 9.5, left: "30%", top: "90%" },
  { Icon: Heart, color: "text-red-300", delay: 10, left: "55%", top: "95%" },
];

export const HomepageFloatingIcons: React.FC = () => {
  return (
    <div className="hidden sm:block fixed top-0 left-0 right-0 h-[100vh] overflow-hidden pointer-events-none z-0">
      {icons.map((item, index) => (
        <motion.div
          key={`${item.Icon.name}-${index}`}
          className={`absolute ${item.color} opacity-30 sm:opacity-8`}
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-8, 8, -8],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10 + (index % 4) * 2,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon 
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
          />
        </motion.div>
      ))}
    </div>
  );
};