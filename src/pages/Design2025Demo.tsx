import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Palette, 
  Layers, 
  Monitor,
  Moon,
  Sun,
  Eye,
  Code,
  Cpu,
  Globe
} from 'lucide-react'
import Card from '@components/ui/Card'
import MagneticButton, { MagneticButtonVariants } from '@components/ui/MagneticButton'
import { BentoGrid, BentoGridItem, BentoLayouts } from '@components/ui/BentoGrid'
import OrganicDivider, { OrganicDividerPatterns } from '@components/ui/OrganicDivider'
import RetroFilter, { RetroEffects } from '@components/ui/RetroFilter'
import Cursor from '@components/ui/Cursor'
import { useWavyText, useGlitchEffect } from '@hooks/useAnimation'

const Design2025Demo: React.FC = () => {
  const [theme, setTheme] = useState<'default' | 'brutalist' | 'retro' | 'organic'>('default')
  const [cursorVariant, setCursorVariant] = useState<'default' | 'sparkle' | 'morphing' | 'magnetic'>('default')
  const [darkMode, setDarkMode] = useState(false)
  
  const { characters: wavyChars } = useWavyText('2025 Design Trends')
  const { glitchedText, isGlitching, glitch } = useGlitchEffect('ULTRA MODERN')
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, darkMode])
  
  return (
    <>
      <Cursor variant={cursorVariant} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 grain-texture opacity-30" />
            <motion.div 
              className="absolute inset-0 liquid-gradient opacity-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          {/* Floating Shapes */}
          <motion.div className="absolute top-20 left-20 w-64 h-64 organic-shape-1 bg-primary-400/20 blur-3xl float-organic" />
          <motion.div className="absolute bottom-20 right-20 w-80 h-80 organic-shape-2 bg-secondary-400/20 blur-3xl float-organic animation-delay-400" />
          
          <div className="container relative z-10 text-center">
            <motion.h1 
              className="text-7xl md:text-8xl lg:text-9xl font-bold mb-8 text-ultra-bold"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="wavy-text">
                {wavyChars.map((char, i) => (
                  <span key={i} style={char.style}>{char.char}</span>
                ))}
              </span>
            </motion.h1>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={glitch}
            >
              <span className="glitch" data-text={glitchedText}>
                {glitchedText}
              </span>
            </motion.h2>
            
            {/* Control Panel */}
            <motion.div 
              className="inline-flex flex-wrap gap-4 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                <div className="flex gap-2">
                  <MagneticButton
                    size="sm"
                    variant={theme === 'default' ? 'primary' : 'outline'}
                    onClick={() => setTheme('default')}
                  >
                    Default
                  </MagneticButton>
                  <MagneticButton
                    size="sm"
                    variant={theme === 'brutalist' ? 'primary' : 'outline'}
                    onClick={() => setTheme('brutalist')}
                  >
                    Brutalist
                  </MagneticButton>
                  <MagneticButton
                    size="sm"
                    variant={theme === 'retro' ? 'primary' : 'outline'}
                    onClick={() => setTheme('retro')}
                  >
                    Retro
                  </MagneticButton>
                  <MagneticButton
                    size="sm"
                    variant={theme === 'organic' ? 'primary' : 'outline'}
                    onClick={() => setTheme('organic')}
                  >
                    Organic
                  </MagneticButton>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursor</span>
                <div className="flex gap-2">
                  {(['default', 'sparkle', 'morphing', 'magnetic'] as const).map((variant) => (
                    <MagneticButton
                      key={variant}
                      size="sm"
                      variant={cursorVariant === variant ? 'primary' : 'outline'}
                      onClick={() => setCursorVariant(variant)}
                    >
                      {variant.charAt(0).toUpperCase() + variant.slice(1)}
                    </MagneticButton>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MagneticButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setDarkMode(!darkMode)}
                  leftIcon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                >
                  {darkMode ? 'Light' : 'Dark'}
                </MagneticButton>
              </div>
            </motion.div>
          </div>
        </section>
        
        <OrganicDivider variant="wave" animate />
        
        {/* Card Variants Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-5xl font-bold text-center mb-16 text-ultra-bold">Card Variants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card variant="default" hover gradient>
                <div className="p-6">
                  <Layers className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">Default Card</h3>
                  <p className="text-gray-600 dark:text-gray-400">Classic design with subtle gradient overlay and hover effects.</p>
                </div>
              </Card>
              
              <Card variant="3d" hover>
                <div className="p-6">
                  <Cpu className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">3D Transform</h3>
                  <p className="text-gray-600 dark:text-gray-400">Advanced 3D perspective transforms on hover for depth.</p>
                </div>
              </Card>
              
              <Card variant="brutalist" hover>
                <div className="p-6">
                  <Zap className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">Brutalist</h3>
                  <p className="text-gray-600 dark:text-gray-400">Raw, honest design with bold borders and shadows.</p>
                </div>
              </Card>
              
              <Card variant="glass" hover>
                <div className="p-6">
                  <Eye className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">Glassmorphism</h3>
                  <p className="text-gray-600 dark:text-gray-400">Translucent glass effect with backdrop blur.</p>
                </div>
              </Card>
              
              <Card variant="elevated" hover gradient>
                <div className="p-6">
                  <Globe className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">Elevated</h3>
                  <p className="text-gray-600 dark:text-gray-400">Floating card with dramatic shadow effects.</p>
                </div>
              </Card>
              
              <Card variant="bordered" hover>
                <div className="p-6">
                  <Code className="w-12 h-12 mb-4 text-primary-500" />
                  <h3 className="text-2xl font-bold mb-2">Bordered</h3>
                  <p className="text-gray-600 dark:text-gray-400">Minimalist design with focus on content.</p>
                </div>
              </Card>
            </div>
          </div>
        </section>
        
        <OrganicDividerPatterns.gradient />
        
        {/* Button Variants Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-5xl font-bold text-center mb-16 text-ultra-bold">Magnetic Buttons</h2>
            
            <div className="flex flex-wrap justify-center gap-8">
              <MagneticButton size="lg" leftIcon={<Sparkles />}>
                Primary Magnetic
              </MagneticButton>
              
              {MagneticButtonVariants.neon({ 
                children: 'Neon Glow',
                size: 'lg',
                leftIcon: <Zap />
              })}
              
              {MagneticButtonVariants.liquid({ 
                children: 'Liquid Morph',
                size: 'lg',
                variant: 'secondary'
              })}
              
              {MagneticButtonVariants.brutalist({ 
                children: 'BRUTALIST',
                size: 'lg'
              })}
            </div>
          </div>
        </section>
        
        <OrganicDividerPatterns.multiLayer />
        
        {/* Bento Grid Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-5xl font-bold text-center mb-16 text-ultra-bold">Bento Grid Layouts</h2>
            
            {BentoLayouts.hero([
              <div className="p-8 h-full flex flex-col justify-center">
                <h3 className="text-3xl font-bold mb-4">Hero Feature</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">Main feature with maximum impact and visual hierarchy.</p>
              </div>,
              <div className="p-6 h-full">
                <Monitor className="w-12 h-12 mb-4 text-primary-500" />
                <h4 className="text-xl font-bold">Secondary</h4>
              </div>,
              <div className="p-6 h-full">
                <Palette className="w-12 h-12 mb-4 text-secondary-500" />
                <h4 className="text-xl font-bold">Tertiary</h4>
              </div>,
              <div className="p-4 h-full">
                <span className="text-4xl">🎨</span>
              </div>,
              <div className="p-4 h-full">
                <span className="text-4xl">✨</span>
              </div>,
            ])}
          </div>
        </section>
        
        <OrganicDivider variant="blob" animate flip />
        
        {/* Retro Filters Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-5xl font-bold text-center mb-16 text-ultra-bold">Retro Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {RetroEffects.vhsTape(
                <div className="p-8 bg-gray-900 text-white">
                  <h3 className="text-2xl font-bold mb-4">VHS Aesthetic</h3>
                  <p>Complete with tracking lines and color distortion.</p>
                </div>
              )}
              
              {RetroEffects.oldMonitor(
                <div className="text-green-400 font-mono">
                  <h3 className="text-2xl font-bold mb-4">CRT Monitor</h3>
                  <p>Classic computer terminal with scan lines.</p>
                </div>
              )}
              
              <RetroFilter variant="glitch" intensity="medium">
                <div className="p-8 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="text-2xl font-bold mb-4">Glitch Effect</h3>
                  <p className="text-gray-600 dark:text-gray-400">Random digital interference and distortion.</p>
                </div>
              </RetroFilter>
              
              {RetroEffects.filmGrain(
                <div className="p-8 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="text-2xl font-bold mb-4">Film Grain</h3>
                  <p className="text-gray-600 dark:text-gray-400">Vintage film texture with subtle scratches.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            2025 Design System • Cutting Edge Web Aesthetics
          </p>
        </footer>
      </div>
    </>
  )
}

export default Design2025Demo