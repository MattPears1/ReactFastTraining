import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { cn } from "@utils/cn";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  cascade?: boolean;
  cascadeDelay?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  threshold = 0.1,
  delay = 0,
  duration = 0.6,
  direction = "up",
  cascade = false,
  cascadeDelay = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const variants = {
    hidden: {
      opacity: 0,
      ...(direction === "up" && { y: 50 }),
      ...(direction === "down" && { y: -50 }),
      ...(direction === "left" && { x: 50 }),
      ...(direction === "right" && { x: -50 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
    },
  };

  const transition = {
    duration,
    delay,
    ease: [0.4, 0, 0.2, 1],
  };

  if (cascade && Array.isArray(children)) {
    return (
      <div ref={ref} className={className}>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            initial="hidden"
            animate={controls}
            variants={variants}
            transition={{
              ...transition,
              delay: delay + index * cascadeDelay,
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Specialized component for text reveals
export const TextReveal: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}> = ({ text, className, delay = 0, staggerDelay = 0.03 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const words = text.split(" ");

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-x-2", className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            animate={controls}
            variants={{
              visible: { y: 0 },
            }}
            transition={{
              duration: 0.5,
              delay: delay + wordIndex * staggerDelay,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
};

// Parallax scroll component
export const ParallaxScroll: React.FC<{
  children: React.ReactNode;
  offset?: number;
  className?: string;
}> = ({ children, offset = 50, className }) => {
  const [scrollY, setScrollY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const speed = offset / 100;
        const yPos = -(rect.top * speed);
        setScrollY(yPos);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [offset]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div
        style={{
          transform: `translateY(${scrollY}px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Fade in on scroll with scale
export const FadeScaleIn: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;