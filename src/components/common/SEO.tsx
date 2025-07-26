import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  image?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  article?: {
    tags?: string[]
    section?: string
  }
  product?: {
    price?: number
    currency?: string
    availability?: 'in stock' | 'out of stock' | 'preorder'
    brand?: string
    category?: string
  }
  robots?: string
  jsonLd?: object
}

const defaultMeta = {
  title: 'React Fast Training - First Aid Training Yorkshire',
  description: 'Yorkshire\'s premier first aid training provider. Emergency First Aid at Work, EFAW courses from £75. HSE approved & Ofqual regulated training in Leeds, Sheffield, Bradford.',
  keywords: 'first aid training Yorkshire, first aid courses Leeds, first aid courses Sheffield, first aid courses Bradford, EFAW training Yorkshire, emergency first aid at work, HSE approved first aid, Ofqual regulated training',
  image: 'https://www.reactfasttraining.co.uk/og-image.jpg',
  type: 'website' as const,
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  image,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  article,
  product,
  robots = 'index, follow',
  jsonLd,
}) => {
  const siteUrl = 'https://www.reactfasttraining.co.uk'
  const fullTitle = title ? `${title} | React Fast Training` : defaultMeta.title
  const metaDescription = description || defaultMeta.description
  const metaKeywords = keywords || defaultMeta.keywords
  const metaImage = image || defaultMeta.image
  const metaType = type || defaultMeta.type
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : undefined

  // LocalBusiness schema (default for all pages)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: 'React Fast Training',
    alternateName: 'React Fast First Aid Training',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: [
      `${siteUrl}/training-center.jpg`,
      `${siteUrl}/first-aid-course.jpg`,
      `${siteUrl}/team-photo.jpg`
    ],
    description: 'Yorkshire\'s premier first aid training provider offering Emergency First Aid at Work, Paediatric First Aid, and other HSE approved courses.',
    telephone: '+44-1234-567890',
    email: 'info@reactfasttraining.co.uk',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Yorkshire',
      addressCountry: 'GB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 53.7997,
      longitude: -1.5492
    },
    areaServed: [
      {'@type': 'City', 'name': 'Leeds'},
      {'@type': 'City', 'name': 'Sheffield'},
      {'@type': 'City', 'name': 'Bradford'},
      {'@type': 'City', 'name': 'York'},
      {'@type': 'City', 'name': 'Huddersfield'},
      {'@type': 'City', 'name': 'Wakefield'},
      {'@type': 'City', 'name': 'Halifax'},
      {'@type': 'City', 'name': 'Harrogate'}
    ],
    priceRange: '£75-£250',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '16:00'
      }
    ],
    sameAs: [
      'https://www.facebook.com/reactfasttraining',
      'https://www.linkedin.com/company/react-fast-training',
      'https://twitter.com/reactfastuk'
    ],
    founder: {
      '@type': 'Person',
      name: 'Lex Hancock',
      jobTitle: 'Founder & Lead Trainer',
      description: 'Ex-military professional with over 20 years experience in emergency first aid and medical training.'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'First Aid Training Courses',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Emergency First Aid at Work (EFAW)',
            description: '1-day HSE approved course covering emergency first aid skills',
            provider: {'@type': 'Organization', 'name': 'React Fast Training'}
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'First Aid at Work (FAW)',
            description: '3-day comprehensive first aid training course',
            provider: {'@type': 'Organization', 'name': 'React Fast Training'}
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Paediatric First Aid',
            description: 'Specialized first aid training for those working with children',
            provider: {'@type': 'Organization', 'name': 'React Fast Training'}
          }
        }
      ]
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+44-1234-567890',
      contactType: 'customer service',
      email: 'info@reactfasttraining.co.uk',
      availableLanguage: 'English',
      areaServed: 'GB',
      contactOption: ['TollFree', 'HearingImpairedSupported']
    }
  }

  // Website schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name: 'React Fast Training',
    description: 'Yorkshire\'s premier first aid training provider - HSE approved & Ofqual regulated courses',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  // Product schema if product data is provided
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description: metaDescription,
        image: metaImage,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'React Fast Training',
        },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'USD',
          availability: `https://schema.org/${
            product.availability === 'in stock'
              ? 'InStock'
              : product.availability === 'out of stock'
              ? 'OutOfStock'
              : 'PreOrder'
          }`,
        },
        category: product.category,
      }
    : null

  // Article schema if article data is provided
  const articleSchema = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: metaDescription,
        image: metaImage,
        author: {
          '@type': 'Person',
          name: author || 'React Fast Training Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'React Fast Training',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/logo.png`,
          },
        },
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        articleSection: article.section,
        keywords: article.tags?.join(', '),
      }
    : null

  // Combine all schemas
  const allSchemas = [
    organizationSchema,
    websiteSchema,
    productSchema,
    articleSchema,
    jsonLd,
  ].filter(Boolean)

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robots} />
      {author && <meta name="author" content={author} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={metaType} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl || siteUrl} />
      <meta property="og:site_name" content="React Fast Training" />
      <meta property="og:locale" content="en_US" />
      {article && (
        <>
          {article.tags?.map((tag) => (
            <meta property="article:tag" content={tag} key={tag} />
          ))}
          {article.section && <meta property="article:section" content={article.section} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
        </>
      )}
      {product && (
        <>
          {product.price && <meta property="product:price:amount" content={product.price.toString()} />}
          {product.currency && <meta property="product:price:currency" content={product.currency} />}
          {product.availability && <meta property="product:availability" content={product.availability} />}
          {product.brand && <meta property="product:brand" content={product.brand} />}
          {product.category && <meta property="product:category" content={product.category} />}
        </>
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@reactfastuk" />
      <meta name="twitter:creator" content="@reactfastuk" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Alternate Language Tags */}
      <link rel="alternate" hrefLang="en-GB" href={`${siteUrl}${canonical || ''}`} />
      <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${canonical || ''}`} />

      {/* JSON-LD Structured Data */}
      {allSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  )
}

export default SEO