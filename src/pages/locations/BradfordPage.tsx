import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Car } from 'lucide-react'
import Hero from '@components/ui/Hero'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

export default function BradfordPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://reactfasttraining.co.uk/locations/bradford#location",
    "name": "React Fast Training Bradford",
    "parentOrganization": {
      "@id": "https://reactfasttraining.co.uk/#organization"
    },
    "description": "First aid training courses in Bradford. Emergency First Aid at Work, EFAW courses from £75. HSE approved training venue in Bradford city centre.",
    "url": "https://reactfasttraining.co.uk/locations/bradford",
    "telephone": "+44-1274-123456",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Training venue provided upon booking",
      "addressLocality": "Bradford",
      "addressRegion": "West Yorkshire",
      "postalCode": "BD1",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 53.7960,
      "longitude": -1.7594
    },
    "areaServed": [
      "Bradford City Centre",
      "Shipley",
      "Bingley",
      "Keighley",
      "Ilkley",
      "Baildon",
      "Saltaire",
      "Clayton"
    ],
    "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-16:00"
  }

  return (
    <>
      <Helmet>
        <title>First Aid Training Bradford | EFAW Courses | React Fast Training</title>
        <meta name="description" content="First aid training courses in Bradford from £75. Emergency First Aid at Work (EFAW), HSE approved courses. Central location with free parking. Book today!" />
        <meta name="keywords" content="first aid training Bradford, first aid courses Bradford, EFAW Bradford, emergency first aid Bradford, HSE approved first aid Bradford, first aid near me Bradford" />
        <link rel="canonical" href="https://reactfasttraining.co.uk/locations/bradford" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Hero
        title="First Aid Training in Bradford"
        subtitle="HSE Approved Emergency First Aid Courses from £75"
        backgroundImage="/images/locations/bradford-hero.jpg"
        height="medium"
      />

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                Professional First Aid Training in Bradford
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Convenient city centre location serving Bradford and West Yorkshire
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Bradford Training Venue
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our Bradford training facility offers excellent accessibility for all delegates.
                  Full venue details provided upon booking.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Close to Bradford Interchange</li>
                  <li>• Free on-site parking available</li>
                  <li>• Near city centre bus routes</li>
                  <li>• Modern, comfortable training rooms</li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Areas We Serve
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Welcoming participants from across Bradford district:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>• Bradford Centre</div>
                  <div>• Shipley</div>
                  <div>• Bingley</div>
                  <div>• Keighley</div>
                  <div>• Ilkley</div>
                  <div>• Baildon</div>
                  <div>• Saltaire</div>
                  <div>• Clayton</div>
                </div>
              </Card>
            </div>

            <Card className="mb-12 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Next Available Courses in Bradford</h3>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Emergency First Aid</div>
                    <div className="font-bold">Tue 13th August</div>
                    <div className="text-blue-600">£75 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Paediatric First Aid</div>
                    <div className="font-bold">17-18 August</div>
                    <div className="text-blue-600">£120 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">First Aid at Work</div>
                    <div className="font-bold">2-4 September</div>
                    <div className="text-blue-600">£195 per person</div>
                  </div>
                </div>
                <Link to="/contact?location=bradford">
                  <Button size="lg" className="px-8">
                    Book Your Bradford Course
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-bold mb-4">Popular Courses in Bradford</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/courses/efaw" className="text-blue-600 hover:text-blue-700 font-medium">
                      Emergency First Aid at Work (1 day)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ideal for small businesses and low-risk environments.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/paediatric" className="text-blue-600 hover:text-blue-700 font-medium">
                      Paediatric First Aid (2 days)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      EYFS compliant training for childcare professionals.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/faw" className="text-blue-600 hover:text-blue-700 font-medium">
                      First Aid at Work Requalification
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      2-day refresher course for existing first aiders.
                    </p>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Why Choose React Fast Bradford?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Free parking for all course delegates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Trainers with military and police backgrounds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Practical, scenario-based training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Group booking discounts available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>On-site training options for businesses</span>
                  </li>
                </ul>
              </div>
            </div>

            <Card className="bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Book Your Bradford First Aid Course Today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get certified by Yorkshire's trusted first aid training provider. 
                Competitive prices, expert trainers, and convenient Bradford location.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact?location=bradford" className="flex-1">
                  <Button variant="primary" className="w-full">
                    Book Online
                  </Button>
                </Link>
                <a href="tel:+441274123456" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 01274 123456
                  </Button>
                </a>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Office hours: Monday-Friday 8am-6pm, Saturday 9am-4pm
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}