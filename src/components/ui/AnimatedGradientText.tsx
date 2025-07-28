import React from "react";
import { motion } from "framer-motion";

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  text,
  className = "",
}) => {
  return (
    <motion.h1
      className={`font-bold bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {text}
    </motion.h1>
  );
};
