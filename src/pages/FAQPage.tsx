import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import { cn } from "@utils/cn";
import CTASection from "@components/sections/CTASection";
import SEO from "@components/common/SEO";
import { AnimatedFAQ } from "@components/ui/AnimatedFAQ";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question:
      "What first aid courses does React Fast Training offer?",
    answer:
      "We offer Emergency First Aid at Work (EFAW), First Aid at Work (FAW), Paediatric First Aid (PFA), Emergency Paediatric First Aid (EPFA), Activity First Aid (AFA), Annual Refreshers, Oxygen Therapy Course, and CPR and AED. All courses are Ofqual regulated and HSE approved.",
    category: "Courses",
  },
  {
    id: "2",
    question: "How much does the Emergency First Aid at Work course cost?",
    answer:
      "Our EFAW course costs £100 per person. This includes all training materials and certification.",
    category: "Pricing",
  },
  {
    id: "4",
    question: "How long is a first aid certificate valid?",
    answer:
      "All courses that offer certificates are valid for three years. After this, you'll need to complete a new course. We recommend annual refresher training to keep skills current.",
    category: "Certification",
  },
  {
    id: "5",
    question: "Do I need any prior experience to attend a first aid course?",
    answer:
      "The majority of our courses require no prior experience or qualifications other than the Oxygen Therapy Course, which the participant is required to have a valid First Aid at Work or Emergency First Aid at Work certificate. Our training is designed for complete beginners and our experienced trainer will guide you through everything step by step.",
    category: "Requirements",
  },
  {
    id: "6",
    question: "How many people are in each training group?",
    answer:
      "We keep our class sizes small with a maximum of 12 participants per course. This ensures everyone gets personal attention and plenty of hands-on practice time with the equipment.",
    category: "Courses",
  },
  {
    id: "7",
    question: "Can you provide training at our workplace?",
    answer:
      "Yes! We offer on-site training anywhere in Yorkshire. This is ideal for businesses as it saves travel time. Contact us for a quote.",
    category: "Business",
  },
  {
    id: "8",
    question: "What happens if I fail the assessment?",
    answer:
      "If you don't pass the first time, we'll work with you to identify areas for improvement and offer a single free reassessment. We want everyone to succeed and gain these vital skills.",
    category: "Certification",
  },
  {
    id: "9",
    question: "Are your courses HSE approved?",
    answer:
      "Yes, all our first aid courses are fully HSE (Health and Safety Executive) approved and meet the requirements of the Health and Safety (First-Aid) Regulations 1981. We're also Ofqual regulated.",
    category: "Accreditation",
  },
  {
    id: "10",
    question: "Do you offer weekend or evening courses?",
    answer:
      "Yes, we offer flexible scheduling including weekend and evening courses to fit around your work commitments.",
    category: "Scheduling",
  },
  {
    id: "11",
    question: "What should I bring to the first aid course?",
    answer:
      "Just bring yourself and wear comfortable clothing as there will be practical exercises. We provide all training materials and equipment. You might want to bring a pen and notepad for personal notes.",
    category: "Requirements",
  },
  {
    id: "13",
    question: "How do I pay for my course booking?",
    answer:
      "Payment can be made via bank transfer. Payment is required at the time of booking to guarantee your place onto the course.",
    category: "Booking",
  },
  {
    id: "14",
    question: "Can I get a refund if I need to cancel?",
    answer:
      "Yes, we offer refunds according to our cancellation policy. Please see our terms and conditions for full details.",
    category: "Booking",
  },
];

const categories = [
  "All",
  "Courses",
  "Pricing",
  "Booking",
  "Locations",
  "Certification",
  "Requirements",
  "Business",
  "Accreditation",
  "Scheduling",
];

const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const filteredFAQs = faqData.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesCategory;
  });

  // Create FAQ structured data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

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
      <section className="relative py-20 sm:py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>

        <div className="container px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <HelpCircle className="w-14 h-14 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 px-4 sm:px-0">
              First Aid Training{" "}
              <span className="text-gradient gradient-primary">FAQs</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4 sm:px-0">
              The majority of our courses require no prior experience or qualifications other than the Oxygen Therapy Course, which the participant is required to have a valid First Aid at Work or Emergency First Aid at Work certificate. Our training is designed for complete beginners and our experienced trainer will guide you through everything step by step.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 sm:py-12">
        <div className="container px-5 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">

            {/* Category Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-3 mb-12 justify-center sm:justify-start"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base min-h-[44px] flex items-center",
                    selectedCategory === category
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                  )}
                >
                  {category}
                </button>
              ))}
            </motion.div>

            {/* FAQ Items */}
            <AnimatedFAQ items={filteredFAQs} />

            {filteredFAQs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No questions found in this category.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
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


      <CTASection
        title="Still Have Questions?"
        description="Get your first aid training questions answered by our expert team."
        primaryButtonText="Contact Us"
        secondaryButtonText="View Courses"
        features={["Personal support", "Yorkshire based", "Quick response"]}
      />
    </div>
  );
};

export default FAQPage;