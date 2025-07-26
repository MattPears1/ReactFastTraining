import React from 'react'
import { motion } from 'framer-motion'
import { Linkedin, Twitter, Mail } from 'lucide-react'

const teamMembers = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: 'https://i.pravatar.cc/300?img=1',
    bio: 'Visionary leader with 20+ years of experience in technology and business transformation.',
    social: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      email: 'sarah@lexbusiness.com',
    },
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://i.pravatar.cc/300?img=3',
    bio: 'Tech innovator passionate about building scalable solutions that solve real-world problems.',
    social: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      email: 'michael@lexbusiness.com',
    },
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Product',
    image: 'https://i.pravatar.cc/300?img=5',
    bio: 'Product strategist focused on creating user-centric solutions that drive business value.',
    social: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      email: 'emily@lexbusiness.com',
    },
  },
  {
    name: 'David Kim',
    role: 'Head of Engineering',
    image: 'https://i.pravatar.cc/300?img=7',
    bio: 'Engineering leader dedicated to building high-performance teams and robust architectures.',
    social: {
      linkedin: 'https://linkedin.com',
      email: 'david@lexbusiness.com',
    },
  },
  {
    name: 'Lisa Thompson',
    role: 'Head of Marketing',
    image: 'https://i.pravatar.cc/300?img=9',
    bio: 'Marketing expert with a passion for storytelling and building meaningful brand connections.',
    social: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      email: 'lisa@lexbusiness.com',
    },
  },
  {
    name: 'James Wilson',
    role: 'Head of Sales',
    image: 'https://i.pravatar.cc/300?img=11',
    bio: 'Sales leader focused on building lasting partnerships and driving customer success.',
    social: {
      linkedin: 'https://linkedin.com',
      email: 'james@lexbusiness.com',
    },
  },
]

const TeamSection: React.FC = () => {
  return (
    <section className="section bg-gray-50 dark:bg-gray-800">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Meet Our Leadership Team
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Passionate professionals dedicated to your success. Our diverse team brings together 
            expertise from various industries to deliver exceptional results.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={`${member.name} - ${member.role} at Lex Business`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Social Links Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        aria-label={`${member.name} Twitter`}
                      >
                        <Twitter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </a>
                    )}
                    <a
                      href={`mailto:${member.social.email}`}
                      className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label={`Email ${member.name}`}
                    >
                      <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </a>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {member.bio}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join Team CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-primary-100 dark:bg-primary-900/30 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Join Our Growing Team
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're always looking for talented individuals who share our passion for innovation 
              and excellence. Explore exciting career opportunities with us.
            </p>
            <a
              href="/careers"
              className="inline-flex items-center gap-2 btn btn-primary"
            >
              View Open Positions
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TeamSection