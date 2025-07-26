import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { cn } from '@utils/cn'
import Button from './Button'

interface Product {
  id: string
  name: string
  description: string
  price: string
  priceDetail: string
  features: string[]
  category: 'product' | 'service'
  popular?: boolean
  icon: React.ElementType
  color: string
}

interface ProductCardProps {
  product: Product
}

const colorClasses = {
  primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const Icon = product.icon

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <div className="card h-full flex flex-col relative overflow-hidden group">
        {product.popular && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-500 text-gray-900 text-xs font-semibold rounded-full">
              <Star className="w-3 h-3" />
              Popular
            </span>
          </div>
        )}

        <div className="card-body flex flex-col h-full">
          {/* Icon */}
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
            colorClasses[product.color as keyof typeof colorClasses]
          )}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                product.category === 'product'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              )}>
                {product.category}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {product.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {product.price}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.priceDetail}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {product.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {feature}
                  </span>
                </li>
              ))}
              {product.features.length > 4 && (
                <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                  +{product.features.length - 4} more features
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              fullWidth
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {product.category === 'product' ? 'Get Started' : 'Learn More'}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </div>

        {/* Hover Effect Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 dark:from-primary-900/0 dark:to-primary-800/0 group-hover:from-primary-50/50 group-hover:to-primary-100/50 dark:group-hover:from-primary-900/10 dark:group-hover:to-primary-800/10 transition-all duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}

export default React.memo(ProductCard)