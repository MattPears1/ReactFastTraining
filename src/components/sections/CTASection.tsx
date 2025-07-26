import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Button from '@components/ui/Button'

interface CTASectionProps {
  title?: string
  description?: string
  primaryButtonText?: string
  secondaryButtonText?: string
  features?: string[]
}

const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to Learn First Aid?",
  description = "Start your first aid training journey with React Fast Training.",
  primaryButtonText = "Book Your Course",
  secondaryButtonText = "Call 07447 485644",
  features = [
    "Ofqual Regulated",
    "HSE Approved",
    "CPD Certified",
  ]
}) => {
  return (
    <section className="section bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <motion.div
          className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              {description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                variant="secondary"
                href="/contact"
                rightIcon={<ArrowRight />}
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                {primaryButtonText}
              </Button>
              <Button
                size="lg"
                variant="outline"
                href="tel:07447485644"
                className="border-white text-white hover:bg-white/10"
              >
                {secondaryButtonText}
              </Button>
            </div>

            {/* Features List */}
            {features && features.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-wrap justify-center gap-6"
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-primary-100"
                  >
                    <CheckCircle className="w-5 h-5 text-primary-200" />
                    <span>{feature}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Service Areas */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-white/20"
          >
            <p className="text-sm text-primary-100 mb-4">
              Available for training across South Yorkshire
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-white/80">
              <span className="font-semibold">Sheffield</span>
              <span className="text-white/40">•</span>
              <span className="font-semibold">Rotherham</span>
              <span className="text-white/40">•</span>
              <span className="font-semibold">Barnsley</span>
              <span className="text-white/40">•</span>
              <span className="font-semibold">Doncaster</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CTASection