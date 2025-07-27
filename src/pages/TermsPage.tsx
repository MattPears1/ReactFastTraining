import React from 'react'
import { Link } from 'react-router-dom'
import SEO from '@components/common/SEO'

const TermsPage: React.FC = () => {
  return (
    <>
      <SEO 
        title="Terms & Conditions - React Fast Training"
        description="Read our terms and conditions for first aid training services in Yorkshire. Clear, transparent terms for all our courses and services."
        keywords="terms conditions, first aid training terms, training terms Yorkshire"
      />
      
      <div className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Terms & Conditions
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Last updated: January 27, 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p>
                  These Terms and Conditions ("Terms") govern your use of React Fast Training's services, 
                  website, and training courses. By booking a course or using our services, you agree to 
                  be bound by these Terms.
                </p>
                <p>
                  React Fast Training is operated by Lex, trading as React Fast Training, providing 
                  first aid training services across Yorkshire, United Kingdom.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Company", "we", "us", or "our"</strong> refers to React Fast Training</li>
                  <li><strong>"Customer", "you", or "your"</strong> refers to the individual or organization booking training</li>
                  <li><strong>"Delegate"</strong> refers to the individual attending the training course</li>
                  <li><strong>"Training"</strong> refers to any first aid training course provided by us</li>
                  <li><strong>"Public Training"</strong> refers to courses at our designated venues</li>
                  <li><strong>"In-House Training"</strong> refers to courses delivered at your premises</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Course Booking and Payment</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Booking Confirmation</h3>
                <p>
                  A booking is confirmed only when we have received full payment or a purchase order 
                  from recognized organizations. We will send a confirmation email with course details 
                  upon successful booking.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.2 Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All prices are quoted in GBP and include VAT where applicable</li>
                  <li>Full payment is required at the time of booking for public courses</li>
                  <li>For in-house training, payment is due within 30 days of invoice date</li>
                  <li>We accept payment by credit/debit card or bank transfer</li>
                  <li>Group discounts of 10% apply automatically for 5 or more delegates</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">3.3 Late Payment</h3>
                <p>
                  If payment is not received by the due date, we reserve the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel the booking without notice</li>
                  <li>Charge interest at 4% above the Bank of England base rate</li>
                  <li>Refuse future bookings until outstanding amounts are paid</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Cancellation and Refund Policy</h2>
                
                <h3 className="text-xl font-semibold mb-3">4.1 Cancellation by Customer</h3>
                <p>Cancellations must be made in writing via email to bookings@reactfasttraining.co.uk</p>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4">
                  <h4 className="font-semibold mb-2">Public Course Cancellation Charges:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>More than 30 days before course: Full refund minus £10 admin fee</li>
                    <li>15-30 days before course: 50% refund</li>
                    <li>7-14 days before course: 25% refund</li>
                    <li>Less than 7 days before course: No refund</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4">
                  <h4 className="font-semibold mb-2">In-House Training Cancellation Charges:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>More than 45 days before course: Full refund minus £50 admin fee</li>
                    <li>30-45 days before course: 50% charge</li>
                    <li>15-29 days before course: 75% charge</li>
                    <li>Less than 15 days before course: 100% charge</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3">4.2 Cancellation by React Fast Training</h3>
                <p>
                  We reserve the right to cancel or postpone training due to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Insufficient delegate numbers</li>
                  <li>Trainer illness or unavailability</li>
                  <li>Venue issues or force majeure events</li>
                </ul>
                <p>
                  In such cases, we will offer alternative dates or a full refund. We are not liable 
                  for any consequential losses such as travel or accommodation costs.
                </p>

                <h3 className="text-xl font-semibold mb-3">4.3 Delegate Substitution</h3>
                <p>
                  You may substitute delegates at any time before the course starts at no extra charge. 
                  Please notify us of any changes via email.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Course Attendance and Certification</h2>
                
                <h3 className="text-xl font-semibold mb-3">5.1 Attendance Requirements</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Delegates must attend the full duration of the course to receive certification</li>
                  <li>Late arrival of more than 15 minutes may result in refusal of entry</li>
                  <li>Delegates must be at least 16 years old unless otherwise specified</li>
                  <li>Delegates must have sufficient English language skills to understand the training</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">5.2 Assessment and Certification</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All courses include practical and theoretical assessment</li>
                  <li>Certificates are issued only upon successful completion of assessments</li>
                  <li>First Aid at Work certificates are valid for 3 years</li>
                  <li>Emergency First Aid at Work certificates are valid for 3 years</li>
                  <li>Annual refresher training is recommended to maintain skills</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">5.3 Requalification Requirements</h3>
                <p>
                  For requalification courses, delegates must provide proof of their current valid 
                  certificate. Expired certificates may require attendance on a full course rather 
                  than requalification.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Special Requirements and Accessibility</h2>
                
                <p>
                  We are committed to making our training accessible to all. Please inform us of any:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Dietary requirements or allergies</li>
                  <li>Physical disabilities or mobility issues</li>
                  <li>Learning difficulties or special educational needs</li>
                  <li>Medical conditions that may affect participation</li>
                </ul>
                <p>
                  We will make reasonable adjustments where possible, but some physical participation 
                  is required for practical assessments.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Health and Safety</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>Delegates must follow all health and safety instructions during training</li>
                  <li>Appropriate clothing should be worn for practical sessions</li>
                  <li>We are not liable for personal injury unless caused by our negligence</li>
                  <li>Delegates participate in practical activities at their own risk</li>
                  <li>Any pre-existing medical conditions should be disclosed before training</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>All training materials remain our intellectual property</li>
                  <li>Materials may not be reproduced or distributed without permission</li>
                  <li>Photography and recording during training is prohibited without consent</li>
                  <li>Certificates may not be copied or altered</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Data Protection and Privacy</h2>
                
                <p>
                  We process personal data in accordance with UK GDPR and data protection laws. 
                  For full details, please see our <Link to="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We collect only necessary information for training delivery</li>
                  <li>Data is stored securely and retained only as required by law</li>
                  <li>We do not share personal data with third parties for marketing</li>
                  <li>You have rights to access, correct, or delete your personal data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Liability and Insurance</h2>
                
                <h3 className="text-xl font-semibold mb-3">10.1 Our Liability</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We maintain professional indemnity and public liability insurance</li>
                  <li>Our liability is limited to the course fee paid</li>
                  <li>We are not liable for indirect or consequential losses</li>
                  <li>Nothing limits our liability for death or personal injury from negligence</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">10.2 Your Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ensure delegates are fit to attend training</li>
                  <li>Provide accurate information when booking</li>
                  <li>Maintain appropriate insurance for your employees</li>
                  <li>Comply with workplace first aid regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">11. Complaints and Disputes</h2>
                
                <p>
                  We aim to resolve any complaints quickly and fairly:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Initial complaints should be raised with the trainer</li>
                  <li>Formal complaints should be sent to info@reactfasttraining.co.uk</li>
                  <li>We will acknowledge complaints within 2 working days</li>
                  <li>We aim to resolve complaints within 10 working days</li>
                </ol>
                <p>
                  These Terms are governed by English law and disputes are subject to the exclusive 
                  jurisdiction of English courts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">12. Quality Standards and Accreditation</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>Our courses meet Health and Safety Executive (HSE) standards</li>
                  <li>We follow Ofqual regulated qualification requirements</li>
                  <li>All trainers hold valid teaching and assessor qualifications</li>
                  <li>We maintain quality assurance through regular audits</li>
                  <li>Course content is regularly updated to reflect best practice</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
                
                <p>
                  We may update these Terms from time to time. The latest version will always be 
                  available on our website. Continued use of our services after changes constitutes 
                  acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                  <p className="font-semibold mb-2">React Fast Training</p>
                  <p>Email: info@reactfasttraining.co.uk</p>
                  <p>Phone: 07447 485644</p>
                  <p>Website: www.reactfasttraining.co.uk</p>
                  <p className="mt-4">
                    For booking enquiries: bookings@reactfasttraining.co.uk<br />
                    For course content questions: lex@reactfasttraining.co.uk
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  By booking a course with React Fast Training, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms and Conditions.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TermsPage