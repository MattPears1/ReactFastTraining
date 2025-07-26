import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Car } from 'lucide-react'
import Hero from '@components/ui/Hero'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

export default function LeedsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://reactfasttraining.co.uk/locations/leeds#location",
    "name": "React Fast Training Leeds",
    "parentOrganization": {
      "@id": "https://reactfasttraining.co.uk/#organization"
    },
    "description": "First aid training courses in Leeds. Emergency First Aid at Work, EFAW courses from £75. HSE approved training venue in Leeds city centre.",
    "url": "https://reactfasttraining.co.uk/locations/leeds",
    "telephone": "+44-113-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Training venue provided upon booking",
      "addressLocality": "Leeds",
      "addressRegion": "West Yorkshire",
      "postalCode": "LS1",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 53.8008,
      "longitude": -1.5491
    },
    "areaServed": [
      "Leeds City Centre",
      "Headingley", 
      "Chapel Allerton",
      "Roundhay",
      "Horsforth",
      "Pudsey",
      "Morley",
      "Garforth"
    ],
    "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-16:00"
  }

  return (
    <>
      <Helmet>
        <title>First Aid Training Leeds | EFAW Courses | React Fast Training</title>
        <meta name="description" content="First aid training courses in Leeds from £75. Emergency First Aid at Work (EFAW), HSE approved courses. City centre location with easy parking. Book today!" />
        <meta name="keywords" content="first aid training Leeds, first aid courses Leeds, EFAW Leeds, emergency first aid Leeds, HSE approved first aid Leeds, first aid near me Leeds" />
        <link rel="canonical" href="https://reactfasttraining.co.uk/locations/leeds" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Hero
        title="First Aid Training in Leeds"
        subtitle="HSE Approved Emergency First Aid Courses from £75"
        backgroundImage="/images/locations/leeds-hero.jpg"
        height="medium"
      />

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                Professional First Aid Training in Leeds City Centre
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Convenient location with excellent transport links and parking nearby
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Leeds Training Venue
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our Leeds training venue is centrally located with easy access from all parts of the city.
                  Full venue details provided upon booking.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 5 minutes walk from Leeds Station</li>
                  <li>• Multiple car parks within 2 minutes walk</li>
                  <li>• Accessible by all major bus routes</li>
                  <li>• Ground floor, wheelchair accessible venue</li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Areas We Serve
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We welcome delegates from across Leeds and surrounding areas:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>• Leeds City Centre</div>
                  <div>• Headingley</div>
                  <div>• Chapel Allerton</div>
                  <div>• Roundhay</div>
                  <div>• Horsforth</div>
                  <div>• Pudsey</div>
                  <div>• Morley</div>
                  <div>• Garforth</div>
                </div>
              </Card>
            </div>

            <Card className="mb-12 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Next Available Courses in Leeds</h3>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Emergency First Aid</div>
                    <div className="font-bold">Mon 12th August</div>
                    <div className="text-blue-600">£75 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">First Aid at Work</div>
                    <div className="font-bold">19-21 August</div>
                    <div className="text-blue-600">£195 per person</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Paediatric First Aid</div>
                    <div className="font-bold">Sat 24th August</div>
                    <div className="text-blue-600">£85 per person</div>
                  </div>
                </div>
                <Link to="/contact?location=leeds">
                  <Button size="lg" className="px-8">
                    Book Your Leeds Course
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-bold mb-4">Popular Courses in Leeds</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/courses/efaw" className="text-blue-600 hover:text-blue-700 font-medium">
                      Emergency First Aid at Work (1 day)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Perfect for low-risk workplaces. HSE approved certification.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/faw" className="text-blue-600 hover:text-blue-700 font-medium">
                      First Aid at Work (3 days)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Comprehensive training for appointed workplace first aiders.
                    </p>
                  </li>
                  <li>
                    <Link to="/courses/paediatric" className="text-blue-600 hover:text-blue-700 font-medium">
                      Paediatric First Aid (2 days)
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Essential for childcare professionals and parents.
                    </p>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Why Choose React Fast Leeds?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Central Leeds location with excellent transport links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Experienced trainers with real-world emergency experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Small class sizes for personalized attention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Free parking validation available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Same-day certificate issue</span>
                  </li>
                </ul>
              </div>
            </div>

            <Card className="bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Book Your Leeds First Aid Course Today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Don't wait until it's too late. Get the skills you need to save lives.
                Our Leeds courses fill up quickly, so book your place today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact?location=leeds" className="flex-1">
                  <Button variant="primary" className="w-full">
                    Book Online
                  </Button>
                </Link>
                <a href="tel:+441131234567" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 0113 123 4567
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