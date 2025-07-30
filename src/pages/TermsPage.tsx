import React from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, Calendar, CreditCard } from "lucide-react";
import SEO from "@components/common/SEO";

const TermsPage: React.FC = () => {
  return (
    <div>
      <SEO
        title="Terms & Conditions | React Fast Training"
        description="Terms and conditions for React Fast Training first aid courses. Booking terms, cancellation policy, and training requirements."
        keywords="terms and conditions, booking terms, cancellation policy, React Fast Training"
        canonical="/terms"
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
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Please read these terms carefully before booking
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-0">
                Please take time to read. These terms and conditions are between React Fast Training and the Customer.
              </p>
            </div>

            <h2>Guidance For Employers</h2>
            <p>
              The duties of the First Aider can be physically and mentally demanding. It is the employer's responsibility to ensure that delegates are free from any conditions that would affect their ability to learn and to ensure they have the aptitude to cope with an intensive course of study.
            </p>

            <h2>Terms Of Booking</h2>
            <p>
              A binding contract will be formed when React Fast Training accepts a customer's booking.
            </p>
            <p>
              Bookings may be made by email, completing the online enquiry form on our website or by telephone.
            </p>
            <p>
              All bookings will be confirmed via email, with an invoice containing full joining details.
            </p>
            <p>
              If a delegate arrives late for a course, is absent from any element of the sessions or otherwise unfit to complete the course, we reserve the right not to accept them for training. In all such cases, the full cost of the fee remains payable. (To conform with RQF and Health & Safety Executive Requirements, attendance at all sessions is required).
            </p>
            <p>
              There may be rare occasion, due to unforeseen circumstances, where React Fast Training finds it necessary to cancel a course. We will always endeavour to deliver courses as planned, however, if this is not possible we will notify you at the earliest opportunity to offer a transfer to another course or a full refund of fees with be offered.
            </p>

            <h2>Cancellation Policy</h2>
            <p>
              The terms and conditions tell you how we will provide training services to you and how we can make changes if required.
            </p>

            <h3>Change Of Course Date Request</h3>
            <p>The following terms will be applied:</p>
            <ul>
              <li>Up to 20 working days before course start date: 1st request to move date or cancel - No fees apply.</li>
              <li>Up to 10 working days before course start date: 25% of course fee, per delegate.</li>
              <li>Up To 5 working days before course start date: 50% of course fee, per delegate.</li>
              <li>Less than 5 working days before course start date: 100% of course fee, per delegate.</li>
            </ul>

            <h3>Cancellation Request</h3>
            <p>The following terms will be applied:</p>
            <ul>
              <li>Over 20 working days before course start date: 50% of course fee, per delegate.</li>
              <li>Less than 20 working days before course start date: 75% of course, fee per delegate.</li>
              <li>Non-Attendees Of Course: 100% Of Course Fee, per delegate.</li>
            </ul>

            <h2>Terms Of Payment</h2>
            <p>
              All payments must be made within 48-hours upon receipt of invoice.
            </p>
            <p>
              The certificates will be emailed to the person who has made the booking, typically 2-3 working days after the course has completed. If there is any issue with non-receipts of certificates, please contact React Fast Training in a timely manner. If such a request is made over 40 working days from the course date, an additional charge per certificate of £5.00 will apply.
            </p>
            <p>
              React Fast Training reserve the right to change these Terms & Conditions at any time by posting changes on our website. Your continued use of this site after changes are posted constitutes your acceptance of this agreement as modified.
            </p>

            <h2>Dignity at Work and Zero Tolerance Policy</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200 mb-2">
                    In line with business practices, we operate a Dignity at Work and Zero Tolerance policy. Any aggressive or violent behaviour towards our staff or any participants will not be tolerated under any circumstances.
                  </p>
                  <p className="text-red-800 dark:text-red-300">
                    Anyone giving verbal abuse to a member of staff, either in person or over the phone, and/or any participants, will be excluded from the course. In addition, a letter will be sent to the responsible person for the booking advising any such behaviour will not be tolerated, and why the reason why they were not allowed to complete the course.
                  </p>
                </div>
              </div>
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

export default TermsPage;