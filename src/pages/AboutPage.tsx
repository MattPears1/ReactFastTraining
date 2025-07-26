import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Award, Shield, Heart, MapPin } from 'lucide-react'
import CTASection from '@components/sections/CTASection'
import SEO from '@components/common/SEO'

const values = [
  {
    icon: Heart,
    title: 'Life-Saving Focus',
    description: 'Every course we deliver could save a life. We take this responsibility seriously and ensure the highest quality training.',
  },
  {
    icon: Shield,
    title: 'Military Precision',
    description: 'Our founder\'s Navy and policing background brings discipline, clarity, and real-world experience to every course.',
  },
  {
    icon: Users,
    title: 'Small Groups',
    description: 'We keep class sizes small to ensure everyone gets personal attention and hands-on practice time.',
  },
  {
    icon: Award,
    title: 'Fully Accredited',
    description: 'All our courses are Ofqual regulated and HSE approved, meeting the highest industry standards.',
  },
  {
    icon: Target,
    title: 'Practical Focus',
    description: 'We focus on real-world scenarios and practical skills that can be applied immediately in emergency situations.',
  },
  {
    icon: MapPin,
    title: 'Yorkshire Proud',
    description: 'Born and based in Yorkshire, we understand local businesses and deliver training that fits your needs.',
  },
]

const milestones = [
  { year: '2004', title: 'Founded', description: 'Started delivering first aid training in Yorkshire' },
  { year: '2008', title: 'Ofqual Registration', description: 'Achieved full Ofqual regulation status' },
  { year: '2012', title: '1000th Student', description: 'Celebrated training our 1000th student' },
  { year: '2016', title: 'Expanded Courses', description: 'Added mental health and paediatric first aid' },
  { year: '2020', title: 'COVID Response', description: 'Adapted training for pandemic safety requirements' },
  { year: '2024', title: '5000+ Trained', description: 'Over 5000 lives potentially saved through our training' },
]

const AboutPage: React.FC = () => {
  return (
    <div>
      <SEO
        title="About React Fast Training | Yorkshire First Aid Training"
        description="Learn about React Fast Training - Yorkshire's premier first aid training provider. Founded by Lex, with extensive military and emergency services experience."
        keywords="about react fast training, first aid trainer Yorkshire, military background, emergency services experience, Yorkshire training company"
        canonical="/about"
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
              About <span className="text-gradient gradient-primary">React Fast Training</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Yorkshire's trusted first aid training provider since 2004. 
              Professional, practical, and personal - because every second counts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To provide Yorkshire businesses and individuals with the highest quality first aid training, 
                delivered by experienced professionals who understand that knowledge saves lives.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We believe that everyone should have access to life-saving skills. Our mission is to make 
                first aid training accessible, affordable, and engaging - because in an emergency, 
                confidence and competence make all the difference.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Story
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Founded by Lex, React Fast Training brings together extensive experience from high-risk 
                environments including military service and law enforcement. This unique background shapes 
                our approach to training - practical, no-nonsense, and focused on real-world application.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We're not a faceless corporation - we're a small, personal operation that cares deeply about 
                every student who walks through our doors. When you train with us, you're learning from someone 
                who has faced real emergencies and understands the importance of being prepared.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              These principles guide everything we do and shape our company culture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From humble beginnings to industry leadership, here's our story.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700 transform md:-translate-x-1/2" />

              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ml-16 md:ml-0">
                      <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary-600 dark:bg-primary-400 rounded-full transform md:-translate-x-1/2 z-10" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Your Instructor
            </h2>
            <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Lex - Founder & Lead Instructor
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                With extensive experience in high-risk environments including military service in the Royal Navy 
                and law enforcement, Lex brings a unique perspective to first aid training. This real-world 
                background means you're learning from someone who has actually used these skills in critical situations.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                "I founded React Fast Training because I saw a need for practical, no-nonsense first aid training 
                delivered by people who truly understand emergencies. Every course I teach is informed by real 
                experiences, not just textbook theory."
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300">Military Veteran</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300">Police Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300">20+ Years Experience</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-primary-600 dark:bg-primary-700 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Years Training', value: '20+' },
              { label: 'Students Trained', value: '5000+' },
              { label: 'Lives Potentially Saved', value: '1000+' },
              { label: 'Course Pass Rate', value: '98%' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to Save Lives?"
        description="Join thousands of Yorkshire professionals who've trained with us. Book your course today."
        primaryButtonText="Book Your Course"
        secondaryButtonText="Download Course Guide"
      />
    </div>
  )
}

export default AboutPage