import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Lock } from 'lucide-react'
import NewsletterForm from '@components/ui/NewsletterForm'

const footerLinks = {
  courses: [
    { label: 'Emergency First Aid at Work', href: '/courses/efaw' },
    { label: 'First Aid at Work', href: '/courses/faw' },
    { label: 'Paediatric First Aid', href: '/courses/paediatric' },
    { label: 'Emergency Paediatric First Aid', href: '/courses/emergency-paediatric' },
    { label: 'First Aid at Work Requalification', href: '/courses/faw-requalification' },
    { label: 'Emergency First Aid at Work Requalification', href: '/courses/efaw-requalification' },
    { label: 'Paediatric First Aid Requalification', href: '/courses/paediatric-requalification' },
    { label: 'Emergency Paediatric First Aid Requalification', href: '/courses/emergency-paediatric-requalification' },
    { label: 'Activity First Aid', href: '/courses/activity-first-aid' },
    { label: 'Activity First Aid Requalification', href: '/courses/activity-first-aid-requalification' },
    { label: 'CPR and AED', href: '/courses/cpr-aed' },
    { label: 'Annual Skills Refresher', href: '/courses/annual-skills-refresher' },
    { label: 'Oxygen Therapy Course', href: '/courses/oxygen-therapy' },
  ],
  support: [
    { label: 'Book a Course', href: '/contact' },
    { label: 'Course Calendar', href: '/calendar' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Downloads', href: '/downloads' },
  ],
  company: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Courses', href: '/courses' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Certifications', href: '/certifications' },
  ],
}

const TikTokIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: TikTokIcon, href: 'https://tiktok.com', label: 'TikTok' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
]

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="footer" className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" role="contentinfo">
      {/* Newsletter Section */}
      <div className="bg-primary-600 dark:bg-primary-700">
        <div className="container py-8 sm:py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-sm sm:text-base text-primary-100 max-w-md mx-auto md:mx-0">
                Get the latest first aid training news and exclusive offers
              </p>
            </div>
            <div className="w-full sm:w-auto max-w-md">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content - Compact Single Row */}
      <div className="container py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/logos/fulllogo_transparent.png" 
                alt="React Fast Training" 
                className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-auto"
              />
            </Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a
              href="tel:07447485644"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>07447 485644</span>
            </a>
            <a
              href="mailto:info@reactfasttraining.co.uk"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>info@reactfasttraining.co.uk</span>
            </a>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>South Yorkshire</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Courses
            </Link>
            <Link to="/booking" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Book Now
            </Link>
            <Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              FAQ
            </Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Contact
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all duration-200"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                © {currentYear} React Fast Training. All rights reserved.
              </p>
              <Link
                to="/admin"
                className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-1"
                aria-label="Admin Portal"
                title="Admin Portal"
              >
                <Lock className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer