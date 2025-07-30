import React from "react";
import { motion } from "framer-motion";
import { Users, Target, Award, Shield, Heart, MapPin } from "lucide-react";
import CTASection from "@components/sections/CTASection";
import SEO from "@components/common/SEO";
import { AnimatedCounter } from "@components/ui/AnimatedCounter";

const values = [
  {
    icon: Heart,
    title: "Life-Saving Focus",
    description:
      "Every course we deliver could save a life. We take this responsibility seriously and ensure the highest quality training.",
  },
  {
    icon: Shield,
    title: "Royal Navy and Policing Background",
    description:
      "Our founder's Royal Navy and policing background brings discipline, clarity, and real-world experience to every course.",
  },
  {
    icon: Users,
    title: "Group Sizes",
    description:
      "We can accommodate up to 12 people per course to ensure everyone gets personal attention and hands-on practice time.",
  },
  {
    icon: Award,
    title: "Fully Accredited",
    description:
      "All our courses are Ofqual regulated and HSE approved, meeting the highest industry standards.",
  },
  {
    icon: Target,
    title: "Practical Focus",
    description:
      "We focus on real-world scenarios and practical skills that can be applied immediately in emergency situations.",
  },
  {
    icon: MapPin,
    title: "Yorkshire Proud",
    description:
      "Born and based in Yorkshire, we understand local businesses and deliver training that fits your needs.",
  },
];

// Real timeline will be added as the business grows

const AboutPage: React.FC = () => {
  return (
    <div className="relative">
      <SEO
        title="About React Fast Training | Yorkshire First Aid Training"
        description="Learn about React Fast Training - Yorkshire's premier first aid training provider. Founded by Lex."
        keywords="about react fast training, first aid trainer Yorkshire, Yorkshire training company"
        canonical="/about"
      />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              About{" "}
              <span className="text-gradient gradient-primary">
                React Fast Training
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4 sm:px-0">
              South Yorkshire's newest first aid training provider.
              Professional, practical, and personal - because every second
              counts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Our Mission
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                To provide South Yorkshire businesses and individuals with the highest
                quality first aid training, delivered by an experienced
                professional who understands that the knowledge of first aid saves lives.
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We believe that everyone should have access to life-saving
                skills. Our mission is to make first aid training accessible,
                affordable, and engaging - because in an emergency, confidence
                and competence make all the difference.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-8 lg:mt-0"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Our Story
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Founded by Lex, React Fast Training is an organisation led by an experienced instructor who brings together the discipline from the Royal Navy and policing services. This background shapes our approach to training: practical, no-nonsense, and focussed on real-world application.
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We're not a faceless corporation - we're a small, personal
                operation that cares deeply about every student who walks
                through our doors. When you train with us, you're learning from
                someone who has faced real emergencies and understands the
                importance of being prepared.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary-50 dark:bg-primary-900/20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <AnimatedCounter
                target={12}
                className="text-primary-600 dark:text-primary-400"
              />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Maximum Group Size
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <AnimatedCounter
                target={8}
                className="text-primary-600 dark:text-primary-400"
              />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Different Courses
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <AnimatedCounter
                target={18}
                suffix="+"
                className="text-primary-600 dark:text-primary-400"
              />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Years Experience
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <AnimatedCounter
                target={100}
                suffix="%"
                className="text-primary-600 dark:text-primary-400"
              />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Practical Focus
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Our Core Values
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              These principles guide everything we do and shape our company
              culture.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <value.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 sm:px-0">
                  {value.description}
                </p>
              </motion.div>
            ))}
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
            <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative">
                  <img
                    src="/images/placeholder-course.jpg"
                    alt="Lead Instructor teaching first aid"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Lex - Founder & Lead Instructor
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Hi, I'm Lex, the founder and lead instructor here at React Fast Training. As an experienced instructor with a background in the Royal Navy and policing services, I bring a unique perspective to our first aid training. Having been first aid qualified since the age of 12, I understand the importance of clear instruction and practical skills. I founded React Fast Training because I saw a need for practical, no-nonsense, first aid training delivered by someone who truly understands applying first aid in real emergencies. Every course I teach is informed by real, first-hand experiences, not just textbook theory.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Royal Navy Experience
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Policing Services
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        First Aid Expert
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Ready to Learn First Aid?"
        description="Join our training courses and gain essential skills. Contact us today."
        primaryButtonText="Contact Us"
        secondaryButtonText="Call 07447 485644"
        features={["Ofqual Regulated", "HSE Approved"]}
      />
    </div>
  );
};

export default AboutPage;
