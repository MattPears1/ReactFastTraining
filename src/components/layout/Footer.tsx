import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'
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
    { label: 'About Us', href: '/about' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Certifications', href: '/certifications' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
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

      {/* Main Footer Content */}
      <div className="container py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 mb-6 sm:mb-0 text-center lg:text-left">
            <Link to="/" className="inline-block mb-4 w-full">
              <img 
                src="/images/logos/fulllogo_transparent.png" 
                alt="React Fast Training" 
                className="h-16 w-auto mx-auto"
              />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center mx-auto">
              South Yorkshire's premier first aid training provider. Professional courses delivered by an experienced instructor with military and emergency services background.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6 text-center lg:text-left">
              <a
                href="tel:07447485644"
                className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors justify-center lg:justify-start"
              >
                <Phone className="w-5 h-5" />
                <span>07447 485644</span>
              </a>
              <a
                href="mailto:info@reactfasttraining.co.uk"
                className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors justify-center lg:justify-start"
              >
                <Mail className="w-5 h-5" />
                <span>info@reactfasttraining.co.uk</span>
              </a>
              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400 justify-center lg:justify-start">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Training venues across<br />Yorkshire</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 sm:p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all duration-200 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg">
              Courses
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.courses.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg">
              Company
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg">
              Support
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              © {currentYear} React Fast Training. All rights reserved.
            </p>
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