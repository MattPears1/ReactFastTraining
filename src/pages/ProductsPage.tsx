import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Briefcase, Check, X, ArrowRight, 
  Zap, Shield, Users, BarChart3, Globe, Smartphone,
  Cloud, Code, Headphones, TrendingUp, Star, Filter
} from 'lucide-react'
import Button from '@components/ui/Button'
import ProductCard from '@components/ui/ProductCard'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'
import { cn } from '@utils/cn'

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

const products: Product[] = [
  {
    id: '1',
    name: 'Business Suite Pro',
    description: 'Complete business management solution with CRM, project management, and analytics.',
    price: '$99',
    priceDetail: 'per user/month',
    features: [
      'CRM & Contact Management',
      'Project & Task Management',
      'Advanced Analytics Dashboard',
      'Team Collaboration Tools',
      'Custom Workflows',
      'API Access',
      '24/7 Support',
    ],
    category: 'product',
    popular: true,
    icon: Briefcase,
    color: 'primary',
  },
  {
    id: '2',
    name: 'Cloud Infrastructure',
    description: 'Scalable cloud hosting and infrastructure management for modern applications.',
    price: '$199',
    priceDetail: 'per month',
    features: [
      'Auto-scaling Infrastructure',
      '99.9% Uptime SLA',
      'Global CDN',
      'Automated Backups',
      'Security Monitoring',
      'Load Balancing',
      'DevOps Tools',
    ],
    category: 'product',
    icon: Cloud,
    color: 'blue',
  },
  {
    id: '3',
    name: 'Analytics Platform',
    description: 'Advanced data analytics and business intelligence platform.',
    price: '$149',
    priceDetail: 'per month',
    features: [
      'Real-time Data Processing',
      'Custom Dashboards',
      'Predictive Analytics',
      'Data Visualization',
      'Export & Reporting',
      'Machine Learning Models',
      'Data Integration',
    ],
    category: 'product',
    icon: BarChart3,
    color: 'green',
  },
  {
    id: '4',
    name: 'Digital Transformation',
    description: 'End-to-end digital transformation consulting and implementation services.',
    price: 'Custom',
    priceDetail: 'Contact for pricing',
    features: [
      'Business Process Analysis',
      'Technology Assessment',
      'Strategic Roadmap',
      'Implementation Support',
      'Change Management',
      'Training & Workshops',
      'Ongoing Optimization',
    ],
    category: 'service',
    popular: true,
    icon: TrendingUp,
    color: 'purple',
  },
  {
    id: '5',
    name: 'Custom Development',
    description: 'Tailored software development services for your unique business needs.',
    price: 'From $10K',
    priceDetail: 'per project',
    features: [
      'Requirements Analysis',
      'Custom Solution Design',
      'Agile Development',
      'Quality Assurance',
      'Deployment Support',
      'Maintenance Plans',
      'Source Code Ownership',
    ],
    category: 'service',
    icon: Code,
    color: 'orange',
  },
  {
    id: '6',
    name: 'Managed Support',
    description: '24/7 managed IT support and maintenance services.',
    price: '$499',
    priceDetail: 'per month',
    features: [
      '24/7 Help Desk',
      'System Monitoring',
      'Security Updates',
      'Performance Optimization',
      'Incident Management',
      'Regular Health Checks',
      'Priority Support',
    ],
    category: 'service',
    icon: Headphones,
    color: 'red',
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: 'per month',
    description: 'Perfect for small businesses just getting started',
    features: [
      { name: 'Up to 5 users', included: true },
      { name: 'Basic features', included: true },
      { name: 'Email support', included: true },
      { name: 'Mobile app', included: true },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    period: 'per month',
    description: 'For growing businesses that need more power',
    popular: true,
    features: [
      { name: 'Up to 50 users', included: true },
      { name: 'All features', included: true },
      { name: 'Priority support', included: true },
      { name: 'Mobile app', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Advanced analytics', included: true },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contact sales',
    description: 'Tailored solutions for large organizations',
    features: [
      { name: 'Unlimited users', included: true },
      { name: 'All features', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Mobile app', included: true },
      { name: 'API access', included: true },
      { name: 'Custom development', included: true },
      { name: 'SLA guarantee', included: true },
    ],
  },
]

const ProductsPage: React.FC = () => {
  const [view, setView] = useState<'products' | 'pricing'>('products')
  const [filter, setFilter] = useState<'all' | 'product' | 'service'>('all')

  const filteredProducts = products.filter(
    product => filter === 'all' || product.category === filter
  )

  return (
    <div>
      <SEO
        title="Products & Services"
        description="Explore our comprehensive range of business solutions, software products, and professional services. From CRM to cloud infrastructure, find the perfect solution for your needs."
        keywords="business software, CRM solutions, cloud services, analytics tools, professional services, enterprise products"
        canonical="/products"
      />
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Products & <span className="text-gradient gradient-primary">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
              Comprehensive solutions designed to transform your business and drive growth.
            </p>
            
            {/* View Toggle */}
            <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setView('products')}
                className={cn(
                  'px-6 py-2 rounded-md font-medium transition-all duration-200',
                  view === 'products'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                Products & Services
              </button>
              <button
                onClick={() => setView('pricing')}
                className={cn(
                  'px-6 py-2 rounded-md font-medium transition-all duration-200',
                  view === 'pricing'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                Pricing Plans
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {view === 'products' ? (
        <>
          {/* Filter Section */}
          <section className="section pt-0">
            <div className="container">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Filter by:</span>
                  <div className="flex gap-2">
                    {(['all', 'product', 'service'] as const).map((category) => (
                      <button
                        key={category}
                        onClick={() => setFilter(category)}
                        className={cn(
                          'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                          filter === category
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        {category === 'all' ? 'All' : category === 'product' ? 'Products' : 'Services'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredProducts.length} of {products.length} items
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Pricing Plans */}
          <section className="section pt-0">
            <div className="container">
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {pricingPlans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'relative rounded-2xl p-8',
                      plan.popular
                        ? 'bg-primary-600 text-white shadow-2xl scale-105 z-10'
                        : 'bg-white dark:bg-gray-800 shadow-lg'
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-accent-500 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-8">
                      <h3 className={cn(
                        'text-2xl font-bold mb-2',
                        plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'
                      )}>
                        {plan.name}
                      </h3>
                      <div className="mb-4">
                        <span className={cn(
                          'text-4xl font-bold',
                          plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'
                        )}>
                          {plan.price}
                        </span>
                        <span className={cn(
                          'text-sm ml-2',
                          plan.popular ? 'text-primary-100' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {plan.period}
                        </span>
                      </div>
                      <p className={cn(
                        'text-sm',
                        plan.popular ? 'text-primary-100' : 'text-gray-600 dark:text-gray-400'
                      )}>
                        {plan.description}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-center gap-3">
                          {feature.included ? (
                            <Check className={cn(
                              'w-5 h-5 flex-shrink-0',
                              plan.popular ? 'text-primary-200' : 'text-success-500'
                            )} />
                          ) : (
                            <X className={cn(
                              'w-5 h-5 flex-shrink-0',
                              plan.popular ? 'text-primary-300' : 'text-gray-400'
                            )} />
                          )}
                          <span className={cn(
                            'text-sm',
                            plan.popular 
                              ? feature.included ? 'text-white' : 'text-primary-200'
                              : feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                          )}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      fullWidth
                      variant={plan.popular ? 'secondary' : 'primary'}
                      className={plan.popular ? 'bg-white text-primary-600 hover:bg-gray-100' : ''}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Features Comparison */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Solutions?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We deliver more than just products and services – we deliver results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Star, title: '5-Star Support', description: 'Award-winning customer service available 24/7' },
              { icon: Shield, title: 'Enterprise Security', description: 'Bank-level security and compliance certifications' },
              { icon: Zap, title: 'Lightning Fast', description: 'Optimized performance for maximum efficiency' },
              { icon: Globe, title: 'Global Scale', description: 'Trusted by businesses in over 50 countries' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to Transform Your Business?"
        description="Start your journey with a free consultation or trial."
        primaryButtonText="Start Free Trial"
        secondaryButtonText="Schedule Demo"
        features={['No credit card required', 'Full feature access', 'Cancel anytime']}
      />
    </div>
  )
}

export default ProductsPage