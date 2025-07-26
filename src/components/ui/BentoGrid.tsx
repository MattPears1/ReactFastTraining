import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@utils/cn'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'asymmetric' | 'masonry'
}

interface BentoGridItemProps {
  children: React.ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3 | 4
  delay?: number
}

export const BentoGrid: React.FC<BentoGridProps> = ({ 
  children, 
  className,
  variant = 'default' 
}) => {
  const gridVariants = {
    default: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    asymmetric: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
    masonry: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[150px] sm:auto-rows-[200px]',
  }
  
  return (
    <div className={cn(
      'grid gap-3 sm:gap-4 md:gap-6',
      gridVariants[variant],
      className
    )}>
      {children}
    </div>
  )
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({ 
  children, 
  className,
  colSpan = 1,
  rowSpan = 1,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        'relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300',
        'group cursor-pointer',
        className
      )}
      style={{
        gridColumn: colSpan > 1 ? `span ${colSpan} / span ${colSpan}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan} / span ${rowSpan}` : undefined,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 transition-all duration-500 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary-500/20 to-transparent transform translate-x-8 -translate-y-8 rotate-45" />
    </motion.div>
  )
}

// Pre-built Bento layouts
export const BentoLayouts = {
  // Hero layout with one large item and smaller items
  hero: (items: React.ReactNode[]) => (
    <BentoGrid variant="asymmetric">
      {items.map((item, index) => {
        if (index === 0) {
          return (
            <BentoGridItem 
              key={index} 
              colSpan={1} 
              rowSpan={1} 
              delay={index}
              className="sm:col-span-2 md:col-span-4 sm:row-span-2"
            >
              {item}
            </BentoGridItem>
          )
        }
        if (index === 1 || index === 2) {
          return (
            <BentoGridItem 
              key={index} 
              colSpan={1} 
              rowSpan={1} 
              delay={index}
              className="sm:col-span-1 md:col-span-2"
            >
              {item}
            </BentoGridItem>
          )
        }
        return (
          <BentoGridItem key={index} colSpan={1} rowSpan={1} delay={index}>
            {item}
          </BentoGridItem>
        )
      })}
    </BentoGrid>
  ),
  
  // Balanced layout with mixed sizes
  balanced: (items: React.ReactNode[]) => (
    <BentoGrid>
      {items.map((item, index) => {
        const patterns = [
          { colSpan: 2, rowSpan: 1 },
          { colSpan: 1, rowSpan: 2 },
          { colSpan: 1, rowSpan: 1 },
          { colSpan: 2, rowSpan: 2 },
          { colSpan: 1, rowSpan: 1 },
          { colSpan: 1, rowSpan: 1 },
        ]
        const pattern = patterns[index % patterns.length]
        
        return (
          <BentoGridItem 
            key={index} 
            colSpan={pattern.colSpan as 1 | 2} 
            rowSpan={pattern.rowSpan as 1 | 2}
            delay={index}
          >
            {item}
          </BentoGridItem>
        )
      })}
    </BentoGrid>
  ),
  
  // Masonry-style layout
  masonry: (items: React.ReactNode[]) => (
    <BentoGrid variant="masonry">
      {items.map((item, index) => {
        const heights = [1, 2, 1, 3, 2, 1]
        const rowSpan = heights[index % heights.length] as 1 | 2 | 3
        
        return (
          <BentoGridItem key={index} rowSpan={rowSpan} delay={index}>
            {item}
          </BentoGridItem>
        )
      })}
    </BentoGrid>
  ),
}