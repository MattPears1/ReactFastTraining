import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import SEO from "@components/common/SEO";

const PrivacyPage: React.FC = () => {
  return (
    <div>
      <SEO
        title="Privacy Policy | React Fast Training"
        description="React Fast Training's privacy policy. Learn how we collect, use, and protect your personal data in accordance with UK GDPR."
        keywords="privacy policy, data protection, GDPR, React Fast Training"
        canonical="/privacy"
      />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute inset-0 bg-dot-pattern opacity-5" />
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your privacy is important to us
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            <h2>Introduction</h2>
            <p>
              React Fast Training ("we", "our", or "us") is committed to protecting your personal data and respecting your privacy. This Privacy Policy (The/This Policy) outlines how we collect, use, store and protect any personal information you provide through our website (www.reactfasttraining.co.uk).
            </p>
            <p>
              This Policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>

            <h2>What Information We Collect</h2>
            <p>We may collect and process the following types of personal data:</p>
            <ul>
              <li>Contact details: Name, email address, phone number</li>
              <li>Booking information: Course type, preferred dates, location</li>
              <li>Payment details: Where applicable (handled via secure third-party processor)</li>
              <li>Website usage: IP address, browser type, time zone, cookies, and analytics data</li>
              <li>Communication history: Emails, messages, course queries or feedback</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Respond to your enquiries or booking requests</li>
              <li>Process and manage course bookings and communications</li>
              <li>Issue certificates of attendance or completion</li>
              <li>Maintain internal records and compliance with training regulations</li>
              <li>Send important course updates, reminders or feedback requests</li>
              <li>Improve our website and customer experience</li>
            </ul>
            <p>We do not sell, rent or trade your personal information.</p>

            <h2>Legal Basis for Processing</h2>
            <p>We process your data under the following lawful bases:</p>
            <ul>
              <li>Contractual necessity: To deliver the training services you have requested</li>
              <li>Legal obligation: To meet regulatory or certification requirements</li>
              <li>Legitimate interests: To communicate with customers and improve our services</li>
              <li>Consent: For email marketing (you can opt out at any time)</li>
            </ul>

            <h2>How We Store and Protect Your Data</h2>
            <p>
              Your data is securely stored using encrypted systems and is only accessible by authorised personnel. We take appropriate steps to prevent unauthorised access, loss or misuse.
            </p>
            <p>
              We retain your personal data only for as long as necessary to fulfil the purpose it was collected for, including any legal, accounting, or reporting requirements.
            </p>

            <h2>Sharing Your Information</h2>
            <p>We may share your data with:</p>
            <ul>
              <li>Certification bodies (e.g., awarding organisations if your course includes accreditation)</li>
              <li>Trusted third-party processors (e.g., secure payment providers or email platforms)</li>
              <li>Legal or regulatory authorities when required by law</li>
            </ul>
            <p>We will never share your data for marketing purposes without your explicit consent.</p>

            <h2>Your Rights</h2>
            <p>Under UK data protection law, you have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccuracies in your data</li>
              <li>Request erasure ('right to be forgotten')</li>
              <li>Object to or restrict certain types of processing</li>
              <li>Withdraw consent at any time (for marketing)</li>
              <li>Complain to the Information Commissioner's Office (ICO)</li>
            </ul>
            <p>To exercise any of these rights, please contact us at: www.reactfasttraining.co.uk</p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update This Policy from time to time. The latest version will always be posted on our website. Please check back regularly to stay informed.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions about This Policy or how we handle your data, please contact:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <p className="mb-2"><strong>React Fast Training</strong></p>
              <p className="mb-1">Email: <a href="mailto:info@reactfasttraining.co.uk" className="text-primary-600 hover:text-primary-700">info@reactfasttraining.co.uk</a></p>
              <p>Website: <a href="https://www.reactfasttraining.co.uk" className="text-primary-600 hover:text-primary-700">www.reactfasttraining.co.uk</a></p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;