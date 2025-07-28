import React from "react";
import { motion } from "framer-motion";
import { cn } from "@utils/cn";

interface OrganicDividerProps {
  variant?: "wave" | "blob" | "curve" | "zigzag";
  color?: string;
  className?: string;
  animate?: boolean;
  flip?: boolean;
}

const OrganicDivider: React.FC<OrganicDividerProps> = ({
  variant = "wave",
  color = "currentColor",
  className,
  animate = true,
  flip = false,
}) => {
  const variants = {
    wave: {
      path: "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,133.3C960,128,1056,96,1152,96C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
      viewBox: "0 0 1440 320",
    },
    blob: {
      path: "M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,224C840,224,960,192,1080,181.3C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z",
      viewBox: "0 0 1440 320",
    },
    curve: {
      path: "M0,160L80,170.7C160,181,320,203,480,192C640,181,800,139,960,133.3C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z",
      viewBox: "0 0 1440 320",
    },
    zigzag: {
      path: "M0,64L120,96C240,128,480,192,720,192C960,192,1200,128,1320,96L1440,64L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z",
      viewBox: "0 0 1440 320",
    },
  };

  const selectedVariant = variants[variant];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        flip && "rotate-180",
        className,
      )}
    >
      <motion.svg
        viewBox={selectedVariant.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="relative block w-full h-auto"
        animate={
          animate
            ? {
                d: [
                  selectedVariant.path,
                  variant === "wave"
                    ? "M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,138.7C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    : variant === "blob"
                      ? "M0,192L60,208C120,224,240,256,360,245.3C480,235,600,181,720,181.3C840,181,960,235,1080,250.7C1200,267,1320,245,1380,234.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                      : selectedVariant.path,
                ],
              }
            : undefined
        }
        transition={{
          repeat: animate ? Infinity : 0,
          repeatType: "reverse",
          duration: 10,
          ease: "easeInOut",
        }}
      >
        <path
          d={selectedVariant.path}
          fill={color}
          className="transition-all duration-300"
        />
      </motion.svg>

      {/* Additional organic shapes */}
      {animate && (
        <>
          <motion.div
            className="absolute top-0 left-1/4 w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: color }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-0 right-1/3 w-24 h-24 rounded-full opacity-15"
            style={{ backgroundColor: color }}
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
              scale: [1.1, 0.9, 1.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}
    </div>
  );
};

// Pre-built divider patterns
export const OrganicDividerPatterns = {
  // Layered waves effect
  layeredWaves: (color1 = "#6A37FF", color2 = "#FF0057") => (
    <div className="relative">
      <OrganicDivider
        variant="wave"
        color={color1}
        className="absolute inset-0 opacity-50"
      />
      <OrganicDivider
        variant="wave"
        color={color2}
        className="relative opacity-50"
      />
    </div>
  ),

  // Gradient divider
  gradient: () => (
    <div className="relative">
      <OrganicDivider variant="blob" color="url(#gradient-divider)" />
      <svg width="0" height="0">
        <defs>
          <linearGradient
            id="gradient-divider"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgb(106, 55, 255)" />
            <stop offset="50%" stopColor="rgb(255, 0, 87)" />
            <stop offset="100%" stopColor="rgb(0, 255, 135)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  ),

  // Animated multi-layer
  multiLayer: () => (
    <div className="relative h-32">
      <OrganicDivider
        variant="wave"
        color="rgba(106, 55, 255, 0.1)"
        className="absolute inset-0"
        animate
      />
      <OrganicDivider
        variant="curve"
        color="rgba(255, 0, 87, 0.1)"
        className="absolute inset-0 translate-y-4"
        animate
      />
      <OrganicDivider
        variant="blob"
        color="rgba(0, 255, 135, 0.1)"
        className="absolute inset-0 translate-y-8"
        animate
      />
    </div>
  ),
};

export default OrganicDivider;
