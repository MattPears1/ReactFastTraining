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

const footerIcons = [
  { Icon: Heart, color: "text-red-500", delay: 0, left: "10%", top: "20%" },
  { Icon: Stethoscope, color: "text-blue-500", delay: 1, left: "80%", top: "10%" },
  { Icon: Siren, color: "text-orange-500", delay: 2, left: "20%", top: "60%" },
  { Icon: Activity, color: "text-green-500", delay: 3, left: "70%", top: "70%" },
  { Icon: ShieldCheck, color: "text-purple-500", delay: 4, left: "90%", top: "50%" },
  { Icon: Cross, color: "text-pink-500", delay: 5, left: "30%", top: "30%" },
  { Icon: Thermometer, color: "text-teal-500", delay: 6, left: "60%", top: "40%" },
  { Icon: HeartHandshake, color: "text-indigo-500", delay: 7, left: "40%", top: "80%" },
];

export const FooterFloatingIcons: React.FC = () => {
  return (
    <div className="sm:hidden absolute inset-0 overflow-hidden pointer-events-none z-0">
      {footerIcons.map((item, index) => (
        <motion.div
          key={`footer-${item.Icon.name}-${index}`}
          className={`absolute ${item.color} opacity-20`}
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            rotate: [0, 8, -8, 0],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 8 + (index % 3) * 2,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon 
            className="w-4 h-4"
          />
        </motion.div>
      ))}
    </div>
  );
};