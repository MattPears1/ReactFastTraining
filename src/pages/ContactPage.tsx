import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react'
import ContactForm from '@components/ui/ContactForm'
import Map from '@components/ui/Map'
import SEO from '@components/common/SEO'

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['123 Business Ave, Suite 100', 'New York, NY 10001', 'United States'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+1 (234) 567-890', '+1 (234) 567-891', 'Mon-Fri 9AM-6PM EST'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@lexbusiness.com', 'support@lexbusiness.com', 'sales@lexbusiness.com'],
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: ['Monday - Friday: 9:00 AM - 6:00 PM', 'Saturday: 10:00 AM - 4:00 PM', 'Sunday: Closed'],
  },
]

const ContactPage: React.FC = () => {
  return (
    <div>
      <SEO
        title="Contact Us"
        description="Get in touch with Lex Business. Contact our team for support, sales inquiries, or partnership opportunities. We're here to help your business succeed."
        keywords="contact lex business, customer support, sales inquiry, business partnership, get in touch"
        canonical="/contact"
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
            <img 
              src="/images/logos/fulllogo_transparent.png" 
              alt="React Fast Training" 
              className="h-20 w-auto mx-auto mb-8"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Get in <span className="text-gradient gradient-primary">Touch</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              We're here to help and answer any questions you might have. 
              We look forward to hearing from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-xl transition-shadow duration-300"
              >
                <div className="card-body text-center">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {info.title}
                  </h3>
                  <div className="space-y-1">
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form and Map */}
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Send Us a Message
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
              <ContactForm />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-full min-h-[500px]"
            >
              <Map />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <MessageSquare className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Have Questions?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Check out our frequently asked questions for quick answers to common queries.
              </p>
              <a
                href="/faq"
                className="inline-flex items-center gap-2 btn btn-primary"
              >
                View FAQ
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Contact Options */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Live Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get instant support from our team through live chat.
              </p>
              <button className="btn btn-outline">
                Start Chat
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Schedule a Call
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Book a consultation call with our experts.
              </p>
              <button className="btn btn-outline">
                Book Now
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Support Ticket
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Submit a support ticket for technical assistance.
              </p>
              <button className="btn btn-outline">
                Create Ticket
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage