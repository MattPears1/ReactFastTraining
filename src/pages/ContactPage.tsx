import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react'
import ContactForm from '@components/ui/ContactForm'
import SEO from '@components/common/SEO'
import { MapPinAnimation, PhoneRingAnimation } from '@components/ui/ContactAnimations'

const contactInfo = [
  {
    icon: MapPin,
    title: 'South Yorkshire Training',
    details: ['Barnsley', 'Doncaster', 'Rotherham', 'Sheffield'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['07447 485644'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@reactfasttraining.co.uk', 'Quick response times', 'Booking enquiries welcome'],
  },
  {
    icon: Clock,
    title: 'Office Hours',
    details: ['Monday - Friday: 8:00 AM - 6:00 PM', 'Saturday: 10:00 AM - 3:00 PM', 'Sunday: Emergency enquiries only'],
  },
]

const ContactPage: React.FC = () => {
  return (
    <div className="relative">
      <SEO
        title="Contact React Fast Training | First Aid Courses South Yorkshire"
        description="Contact React Fast Training for first aid courses in South Yorkshire. Book professional first aid training from £60. Call 07447 485644 or email lex@reactfasttraining.com."
        keywords="contact first aid training South Yorkshire, book first aid course Barnsley, first aid training Sheffield contact, emergency first aid Rotherham booking"
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Book Your <span className="text-gradient gradient-primary">South Yorkshire</span> First Aid Course
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Contact us today to book your first aid training in South Yorkshire and beyond. 
              Courses available from £75 with flexible scheduling.
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
                    {info.icon === MapPin ? (
                      <MapPinAnimation size={30} />
                    ) : info.icon === Phone ? (
                      <PhoneRingAnimation>
                        <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </PhoneRingAnimation>
                    ) : (
                      <info.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    )}
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

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Send Us a Message
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
              <ContactForm />
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

    </div>
  )
}

export default ContactPage