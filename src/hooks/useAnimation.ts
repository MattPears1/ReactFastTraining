import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export const useKineticTypography = (text: string, delay = 0) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!isInView) return;

    const words = text.split(" ");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex <= words.length) {
        setDisplayText(words.slice(0, currentIndex).join(" "));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100 + delay);

    return () => clearInterval(interval);
  }, [text, delay, isInView]);

  return { ref, displayText };
};

export const useParallax = (speed = 0.5) => {
  const [scrollY, setScrollY] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const screenCenterY = window.innerHeight / 2;
      const distance = centerY - screenCenterY;

      setScrollY(distance * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, scrollY };
};

export const useMagneticEffect = () => {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      const maxDistance = 100;

      if (distance < maxDistance) {
        const strength = 1 - distance / maxDistance;
        setPosition({
          x: distanceX * strength * 0.3,
          y: distanceY * strength * 0.3,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return { ref, position };
};

export const useScrollReveal = (options = {}) => {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isInView = useInView(ref, { once: true, margin: "-100px", ...options });

  useEffect(() => {
    if (isInView) {
      setIsRevealed(true);
    }
  }, [isInView]);

  return { ref, isRevealed };
};

export const useGlitchEffect = (text: string) => {
  const [glitchedText, setGlitchedText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitch = () => {
    setIsGlitching(true);
    const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let iterations = 0;

    const interval = setInterval(() => {
      setGlitchedText(
        text
          .split("")
          .map((char, index) => {
            if (Math.random() > 0.7 && iterations < 5) {
              return glitchChars[
                Math.floor(Math.random() * glitchChars.length)
              ];
            }
            return char;
          })
          .join(""),
      );

      iterations++;

      if (iterations > 10) {
        clearInterval(interval);
        setGlitchedText(text);
        setIsGlitching(false);
      }
    }, 50);
  };

  return { glitchedText, isGlitching, glitch };
};

export const useWavyText = (text: string) => {
  const characters = text.split("").map((char, index) => ({
    char,
    style: {
      "--char-index": index,
      display: "inline-block",
      whiteSpace: char === " " ? "pre" : "normal",
    } as React.CSSProperties,
  }));

  return { characters };
};
