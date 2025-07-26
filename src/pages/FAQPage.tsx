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
    question: 'What first aid courses does React Fast Training offer in Yorkshire?',
    answer: 'We offer Emergency First Aid at Work (EFAW), First Aid at Work (FAW), Paediatric First Aid, and Mental Health First Aid courses. All courses are HSE approved and Ofqual regulated, delivered at venues in Leeds, Sheffield, Bradford and across Yorkshire.',
    category: 'Courses',
  },
  {
    id: '2',
    question: 'How much does the Emergency First Aid at Work course cost?',
    answer: 'Our EFAW course costs £75 per person for public courses. This includes all training materials, certification, and refreshments. For on-site group training at your workplace, prices start from £600 for up to 12 delegates.',
    category: 'Pricing',
  },
  {
    id: '3',
    question: 'Where are your training venues located in Yorkshire?',
    answer: 'We have training venues in Leeds city centre (near Leeds Station), Sheffield city centre, and Bradford city centre. All venues have excellent transport links and parking nearby. We also offer on-site training at your workplace anywhere in Yorkshire.',
    category: 'Locations',
  },
  {
    id: '4',
    question: 'How long is a first aid certificate valid?',
    answer: 'Emergency First Aid at Work (EFAW) and First Aid at Work (FAW) certificates are valid for 3 years. After this, you\'ll need to complete a requalification course. We recommend annual refresher training to keep skills current.',
    category: 'Certification',
  },
  {
    id: '5',
    question: 'Do I need any prior experience to attend a first aid course?',
    answer: 'No prior experience or qualifications are needed for our first aid courses. Our training is designed for complete beginners and our experienced trainers will guide you through everything step-by-step.',
    category: 'Requirements',
  },
  {
    id: '6',
    question: 'How many people are in each training group?',
    answer: 'We keep our class sizes small with a maximum of 12 delegates per course. This ensures everyone gets personal attention and plenty of hands-on practice time with the equipment.',
    category: 'Courses',
  },
  {
    id: '7',
    question: 'Can you provide training at our workplace?',
    answer: 'Yes! We offer on-site training anywhere in Yorkshire. This is ideal for businesses as it saves travel time and allows us to tailor the training to your specific workplace hazards. Contact us for a quote.',
    category: 'Business',
  },
  {
    id: '8',
    question: 'What happens if I fail the assessment?',
    answer: 'If you don\'t pass the first time, we\'ll work with you to identify areas for improvement and offer a free reassessment. We want everyone to succeed and gain these vital skills.',
    category: 'Certification',
  },
  {
    id: '9',
    question: 'Are your courses HSE approved?',
    answer: 'Yes, all our first aid courses are fully HSE (Health and Safety Executive) approved and meet the requirements of the Health and Safety (First Aid) Regulations 1981. We\'re also Ofqual regulated.',
    category: 'Accreditation',
  },
  {
    id: '10',
    question: 'Do you offer weekend or evening courses?',
    answer: 'Yes, we offer flexible scheduling including weekend and evening courses to fit around your work commitments. Our regular public courses run on Wednesdays and Saturdays, with additional dates available on request.',
    category: 'Scheduling',
  },
  {
    id: '11',
    question: 'What should I bring to the first aid course?',
    answer: 'Just bring yourself and wear comfortable clothing as there will be practical exercises. We provide all training materials, equipment, and refreshments. You might want to bring a pen and notepad for personal notes.',
    category: 'Requirements',
  },
  {
    id: '12',
    question: 'Who is Lex, the founder of React Fast Training?',
    answer: 'Lex Hancock is our founder and lead trainer. With extensive experience in the military and emergency services, Lex brings real-world first aid experience to every course. His practical, engaging teaching style makes learning both effective and enjoyable.',
    category: 'About Us',
  },
]

const categories = ['All', 'Courses', 'Pricing', 'Locations', 'Certification', 'Requirements', 'Business', 'Accreditation', 'Scheduling', 'About Us']

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
        title="First Aid Training FAQs | Yorkshire Course Questions | React Fast Training"
        description="Find answers about first aid training courses in Yorkshire. EFAW course costs, Leeds Sheffield Bradford locations, HSE certification requirements and more."
        keywords="first aid training questions Yorkshire, EFAW course FAQ, first aid certification Leeds, HSE approved training Sheffield, first aid course costs Bradford"
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
              First Aid Training <span className="text-gradient gradient-primary">FAQs</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about our Yorkshire first aid courses
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
        title="Still Have Questions?"
        description="Get your first aid training questions answered by our expert team."
        primaryButtonText="Contact Us"
        secondaryButtonText="View Courses"
        features={['Personal support', 'Yorkshire based', 'Quick response']}
      />
    </div>
  )
}

export default FAQPage