import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface CursorProps {
  variant?: 'default' | 'sparkle' | 'morphing' | 'magnetic'
}

const Cursor: React.FC<CursorProps> = ({ variant = 'default' }) => {
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  
  const [isPointer, setIsPointer] = useState(false)
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const sparkleIdRef = useRef(0)
  
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      
      // Add sparkles for sparkle variant
      if (variant === 'sparkle' && Math.random() > 0.8) {
        const newSparkle = {
          id: sparkleIdRef.current++,
          x: e.clientX,
          y: e.clientY,
        }
        setSparkles(prev => [...prev.slice(-10), newSparkle])
      }
    }
    
    const updateCursorType = () => {
      const target = document.elementFromPoint(cursorX.get(), cursorY.get())
      const isInteractive = target?.matches('a, button, input, textarea, select, [role="button"], [data-cursor="pointer"]')
      setIsPointer(!!isInteractive)
    }
    
    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', updateCursorType)
    
    // Hide default cursor
    document.body.style.cursor = 'none'
    
    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', updateCursorType)
      document.body.style.cursor = 'auto'
    }
  }, [cursorX, cursorY, variant])
  
  // Remove old sparkles
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev => prev.filter(s => Date.now() - s.id < 800))
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  const cursorVariants = {
    default: {
      width: isPointer ? 40 : 20,
      height: isPointer ? 40 : 20,
      backgroundColor: isPointer ? 'rgba(106, 55, 255, 0.1)' : 'rgba(106, 55, 255, 0.5)',
      border: isPointer ? '2px solid rgb(106, 55, 255)' : 'none',
    },
    sparkle: {
      width: 10,
      height: 10,
      backgroundColor: 'rgb(106, 55, 255)',
      boxShadow: '0 0 10px rgb(106, 55, 255)',
    },
    morphing: {
      width: isPointer ? 60 : 30,
      height: isPointer ? 60 : 30,
      backgroundColor: 'transparent',
      border: '2px solid rgb(106, 55, 255)',
      borderRadius: isPointer ? '30%' : '50%',
      rotate: isPointer ? 45 : 0,
    },
    magnetic: {
      width: isPointer ? 50 : 25,
      height: isPointer ? 50 : 25,
      background: isPointer 
        ? 'radial-gradient(circle, rgba(106, 55, 255, 0.3) 0%, transparent 70%)' 
        : 'radial-gradient(circle, rgba(106, 55, 255, 0.8) 0%, transparent 70%)',
    },
  }
  
  return (
    <>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          className="relative -translate-x-1/2 -translate-y-1/2 rounded-full"
          variants={cursorVariants}
          animate={variant}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        />
      </motion.div>
      
      {/* Sparkles */}
      {variant === 'sparkle' && sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none z-[9998]"
          initial={{ 
            x: sparkle.x - 4, 
            y: sparkle.y - 4,
            scale: 0,
            rotate: 0,
          }}
          animate={{ 
            scale: [0, 1, 0],
            rotate: 180,
            opacity: [1, 0],
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, rgb(255, 214, 0) 0%, transparent 70%)',
          }}
        />
      ))}
      
      {/* Trail effect for morphing variant */}
      {variant === 'morphing' && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9998]"
          style={{
            x: cursorX,
            y: cursorY,
          }}
        >
          <motion.div
            className="relative -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 40,
              height: 40,
              border: '1px solid rgba(106, 55, 255, 0.3)',
            }}
            animate={{
              scale: [1, 2, 2],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        </motion.div>
      )}
    </>
  )
}

export default Cursor