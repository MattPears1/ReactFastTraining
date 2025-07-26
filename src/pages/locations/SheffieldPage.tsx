import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Car } from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

export default function SheffieldPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://reactfasttraining.co.uk/locations/sheffield#location",
    "name": "React Fast Training Sheffield",
    "parentOrganization": {
      "@id": "https://reactfasttraining.co.uk/#organization"
    },
    "description": "First aid training courses in Sheffield. Emergency First Aid at Work, EFAW courses from £75. HSE approved training venue in Sheffield city centre.",
    "url": "https://reactfasttraining.co.uk/locations/sheffield",
    "telephone": "+44-114-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Training venue provided upon booking",
      "addressLocality": "Sheffield",
      "addressRegion": "South Yorkshire",
      "postalCode": "S1",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 53.3811,
      "longitude": -1.4701
    },
    "areaServed": [
      "Sheffield City Centre",
      "Ecclesall",
      "Hillsborough",
      "Crookes",
      "Nether Edge",
      "Fulwood",
      "Dore",
      "Rotherham"
    ],
    "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-16:00"
  }

  return (
    <>
      <Helmet>
        <title>First Aid Training Sheffield | EFAW Courses | React Fast Training</title>
        <meta name="description" content="First aid training courses in Sheffield from £75. Emergency First Aid at Work (EFAW), HSE approved courses. City centre location near train station. Book today!" />
        <meta name="keywords" content="first aid training Sheffield, first aid courses Sheffield, EFAW Sheffield, emergency first aid Sheffield, HSE approved first aid Sheffield, first aid near me Sheffield" />
        <link rel="canonical" href="https://reactfasttraining.co.uk/locations/sheffield" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              First Aid Training in Sheffield
            </h1>
            <p className="text-xl opacity-90">
              HSE Approved Emergency First Aid Courses from £75
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                Professional First Aid Training in Sheffield City Centre
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Easy access from all areas of Sheffield and South Yorkshire
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Sheffield Training Venue
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our Sheffield venue is perfectly positioned for easy access from all parts of the Steel City.
                  Full venue details provided upon booking.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 10 minutes walk from Sheffield Station</li>
                  <li>• Near Supertram stops</li>
                  <li>• Q-Park and NCP parking nearby</li>
                  <li>• Fully accessible training facilities</li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Areas We Serve
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Serving Sheffield and surrounding South Yorkshire areas:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>• Sheffield Centre</div>
                  <div>• Ecclesall</div>
                  <div>• Hillsborough</div>
                  <div>• Crookes</div>
                  <div>• Nether Edge</div>
                  <div>• Fulwood</div>
                  <div>• Dore & Totley</div>
                  <div>• Rotherham</div>
                </div>
              </Card>
            </div>

            <Card className="mb-12 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Next Available Courses in Sheffield</h3>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Emergency First Aid</div>
                    <div className="font-bold">Wed 14th August</div>
                    <div className="text-blue-600">£75 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">First Aid at Work</div>
                    <div className="font-bold">26-28 August</div>
                    <div className="text-blue-600">£195 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mental Health First Aid</div>
                    <div className="font-bold">Fri 30th August</div>
                    <div className="text-blue-600">£125 per person</div>
                  </div>
                </div>
                <Link to="/contact?location=sheffield">
                  <Button size="lg" className="px-8">
                    Book Your Sheffield Course
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-bold mb-4">Popular Courses in Sheffield</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/courses/efaw" className="text-blue-600 hover:text-blue-700 font-medium">
                      Emergency First Aid at Work (1 day)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Essential skills for workplace emergencies. HSE compliant.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/faw" className="text-blue-600 hover:text-blue-700 font-medium">
                      First Aid at Work (3 days)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete first aid qualification for appointed persons.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/mental-health" className="text-blue-600 hover:text-blue-700 font-medium">
                      Mental Health First Aid
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supporting workplace mental health and wellbeing.
                    </p>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Why Choose React Fast Sheffield?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Central Sheffield location with great transport links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Expert trainers including ex-NHS paramedics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Maximum 12 learners per course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Practical, hands-on training approach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Certificates issued on completion</span>
                  </li>
                </ul>
              </div>
            </div>

            <Card className="bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Book Your Sheffield First Aid Course Today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join hundreds of Sheffield businesses who trust React Fast Training for their 
                first aid training needs. Courses available throughout the year.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact?location=sheffield" className="flex-1">
                  <Button variant="primary" className="w-full">
                    Book Online
                  </Button>
                </Link>
                <a href="tel:+441141234567" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 0114 123 4567
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