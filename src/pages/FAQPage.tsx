import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, HelpCircle, MessageSquare } from 'lucide-react'
import { cn } from '@utils/cn'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What services does Lex Business offer?',
    answer: 'We offer a comprehensive suite of business solutions including consulting, software development, digital transformation, cloud services, and ongoing support. Our services are tailored to meet the unique needs of each client.',
    category: 'General',
  },
  {
    id: '2',
    question: 'How do I get started with Lex Business?',
    answer: 'Getting started is easy! Simply contact us through our contact form, schedule a consultation call, or start with our free trial. Our team will guide you through the process and help you choose the right solutions for your business.',
    category: 'Getting Started',
  },
  {
    id: '3',
    question: 'What is your pricing model?',
    answer: 'We offer flexible pricing models including subscription-based plans, one-time project fees, and custom enterprise solutions. Pricing depends on the services you need and the scale of your business. Contact our sales team for a personalized quote.',
    category: 'Pricing',
  },
  {
    id: '4',
    question: 'Do you offer a free trial?',
    answer: 'Yes! We offer a 14-day free trial for most of our services. No credit card is required to start, and you can cancel anytime. This allows you to experience our solutions and see the value they bring to your business.',
    category: 'Pricing',
  },
  {
    id: '5',
    question: 'What kind of support do you provide?',
    answer: 'We provide 24/7 customer support through multiple channels including live chat, email, and phone. Our support team includes technical experts who can help with any issues or questions you may have.',
    category: 'Support',
  },
  {
    id: '6',
    question: 'How secure is my data with Lex Business?',
    answer: 'Security is our top priority. We use enterprise-grade encryption, regular security audits, and comply with industry standards including GDPR, SOC 2, and ISO 27001. Your data is stored in secure, redundant data centers with regular backups.',
    category: 'Security',
  },
  {
    id: '7',
    question: 'Can I integrate Lex Business with my existing tools?',
    answer: 'Absolutely! We offer robust API access and pre-built integrations with popular business tools including CRM systems, accounting software, project management tools, and more. Our team can also help with custom integrations.',
    category: 'Integration',
  },
  {
    id: '8',
    question: 'What makes Lex Business different from competitors?',
    answer: 'We combine cutting-edge technology with personalized service. Our solutions are built on modern architecture, we offer exceptional customer support, and we focus on delivering measurable results for your business.',
    category: 'General',
  },
  {
    id: '9',
    question: 'Do you offer training for your products?',
    answer: 'Yes, we provide comprehensive training resources including documentation, video tutorials, webinars, and personalized training sessions. We ensure your team is fully equipped to leverage our solutions effectively.',
    category: 'Support',
  },
  {
    id: '10',
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee for most services. If you\'re not satisfied with our solutions, you can request a full refund within 30 days of purchase. Some restrictions may apply to custom development work.',
    category: 'Pricing',
  },
]

const categories = ['All', 'General', 'Getting Started', 'Pricing', 'Support', 'Security', 'Integration']

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Create FAQ structured data
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div>
      <SEO
        title="Frequently Asked Questions"
        description="Find answers to common questions about Lex Business products, services, pricing, and support. Get help with integration, security, and technical issues."
        keywords="lex business faq, frequently asked questions, help center, support, pricing questions, integration help"
        canonical="/faq"
        jsonLd={faqJsonLd}
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
            <HelpCircle className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked <span className="text-gradient gradient-primary">Questions</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Find answers to common questions about our products and services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="section pt-0">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-8"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-200"
              />
            </motion.div>

            {/* Category Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-2 mb-12"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {category}
                </button>
              ))}
            </motion.div>

            {/* FAQ Items */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredFAQs.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.question}
                        </h3>
                        <span className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                          {item.category}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-gray-500 transition-transform duration-200',
                          openItems.includes(item.id) && 'rotate-180'
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {openItems.includes(item.id) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredFAQs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No questions found matching your search.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('All')
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <MessageSquare className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="btn btn-primary"
              >
                Contact Support
              </a>
              <button className="btn btn-outline">
                Start Live Chat
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Ready to Experience the Difference?"
        description="Join thousands of businesses already using Lex Business solutions."
        primaryButtonText="Start Free Trial"
        secondaryButtonText="Watch Demo"
        features={['No credit card required', '14-day free trial', 'Full access to all features']}
      />
    </div>
  )
}

export default FAQPage