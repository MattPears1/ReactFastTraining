import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@utils/cn'

interface RetroFilterProps {
  variant?: 'vhs' | 'crt' | 'grain' | 'scanlines' | 'glitch'
  intensity?: 'light' | 'medium' | 'heavy'
  children: React.ReactNode
  className?: string
}

const RetroFilter: React.FC<RetroFilterProps> = ({
  variant = 'grain',
  intensity = 'medium',
  children,
  className,
}) => {
  const [glitchActive, setGlitchActive] = useState(false)
  
  useEffect(() => {
    if (variant !== 'glitch') return
    
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 200)
    }, 3000 + Math.random() * 4000)
    
    return () => clearInterval(glitchInterval)
  }, [variant])
  
  const intensityOpacity = {
    light: 0.3,
    medium: 0.5,
    heavy: 0.8,
  }
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* VHS Effect */}
      {variant === 'vhs' && (
        <>
          <div 
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  rgba(0, 0, 0, 0.15),
                  rgba(0, 0, 0, 0.15) 1px,
                  transparent 1px,
                  transparent 2px
                )
              `,
              opacity: intensityOpacity[intensity],
            }}
          />
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            animate={{
              backgroundPosition: ['0% 0%', '0% 100%'],
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              background: `
                linear-gradient(
                  to bottom,
                  transparent 0%,
                  rgba(255, 0, 255, 0.1) 50%,
                  transparent 100%
                )
              `,
              backgroundSize: '100% 10px',
              opacity: intensityOpacity[intensity] * 0.5,
            }}
          />
          <div className="absolute inset-0 pointer-events-none z-20 mix-blend-color-burn">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-red-500/10" />
          </div>
        </>
      )}
      
      {/* CRT Effect */}
      {variant === 'crt' && (
        <>
          {/* Curved screen effect */}
          <div 
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.5)',
              borderRadius: '2%',
            }}
          />
          {/* Scanlines */}
          <div 
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  rgba(0, 0, 0, 0.15),
                  rgba(0, 0, 0, 0.15) 1px,
                  transparent 1px,
                  transparent 2px
                )
              `,
              opacity: intensityOpacity[intensity],
            }}
          />
          {/* RGB shift */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute inset-0 bg-red-500/10 mix-blend-multiply translate-x-[1px]" />
            <div className="absolute inset-0 bg-green-500/10 mix-blend-multiply" />
            <div className="absolute inset-0 bg-blue-500/10 mix-blend-multiply -translate-x-[1px]" />
          </div>
          {/* Flicker */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-20 bg-white"
            animate={{
              opacity: [0, 0, 0.05, 0, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </>
      )}
      
      {/* Grain Effect */}
      {variant === 'grain' && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.5'/%3E%3C/svg%3E")`,
            opacity: intensityOpacity[intensity],
          }}
        />
      )}
      
      {/* Scanlines Effect */}
      {variant === 'scanlines' && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          animate={{
            backgroundPosition: ['0px 0px', '0px 10px'],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.3) 2px,
                rgba(0, 0, 0, 0.3) 4px
              )
            `,
            opacity: intensityOpacity[intensity],
          }}
        />
      )}
      
      {/* Glitch Effect */}
      {variant === 'glitch' && glitchActive && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 0, 0, 0.5) 2px,
                  rgba(255, 0, 0, 0.5) 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.5) 2px,
                  rgba(0, 255, 0, 0.5) 3px
                )
              `,
            }}
          />
          <motion.div
            className="absolute inset-0 z-10"
            animate={{
              x: [0, -5, 5, -5, 5, 0],
              scaleX: [1, 1.01, 0.99, 1.01, 0.99, 1],
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </div>
  )
}

// Pre-built retro effects
export const RetroEffects = {
  // Full VHS tape effect
  vhsTape: (children: React.ReactNode) => (
    <RetroFilter variant="vhs" intensity="medium">
      <div className="relative">
        {/* VHS UI overlay */}
        <div className="absolute top-4 left-4 z-30 font-mono text-white">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-500">●</span>
            <span>REC</span>
          </div>
          <div className="text-xs opacity-80">
            {new Date().toLocaleString()}
          </div>
        </div>
        <div className="absolute top-4 right-4 z-30 font-mono text-white text-xs">
          <div>SP</div>
          <div>▶▶</div>
        </div>
        {children}
      </div>
    </RetroFilter>
  ),
  
  // Old computer monitor
  oldMonitor: (children: React.ReactNode) => (
    <div className="relative p-8 bg-gray-800 rounded-lg">
      <div className="relative bg-black rounded overflow-hidden">
        <RetroFilter variant="crt" intensity="heavy">
          <div className="p-8">
            {children}
          </div>
        </RetroFilter>
      </div>
      {/* Monitor frame */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-700 rounded-t" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-gray-700 rounded" />
    </div>
  ),
  
  // Film grain overlay
  filmGrain: (children: React.ReactNode) => (
    <RetroFilter variant="grain" intensity="light">
      <div className="relative">
        {/* Film scratches */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-[20%] w-[1px] h-full bg-white animate-pulse" />
          <div className="absolute top-0 left-[60%] w-[2px] h-full bg-gray-300 animate-pulse animation-delay-200" />
        </div>
        {children}
      </div>
    </RetroFilter>
  ),
}

export default RetroFilter