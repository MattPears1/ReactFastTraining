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
  title: 'Lex Business - Professional Solutions',
  description: 'Professional business solutions for the modern world. Discover innovative products and services that transform your business.',
  keywords: 'business solutions, professional services, enterprise software, consulting, digital transformation',
  image: 'https://www.lexbusiness.com/og-image.jpg',
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
  const siteUrl = 'https://www.lexbusiness.com'
  const fullTitle = title ? `${title} | Lex Business` : defaultMeta.title
  const metaDescription = description || defaultMeta.description
  const metaKeywords = keywords || defaultMeta.keywords
  const metaImage = image || defaultMeta.image
  const metaType = type || defaultMeta.type
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : undefined

  // Organization schema (default for all pages)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lex Business',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Professional business solutions for the modern world',
    sameAs: [
      'https://twitter.com/lexbusiness',
      'https://facebook.com/lexbusiness',
      'https://linkedin.com/company/lexbusiness',
      'https://instagram.com/lexbusiness',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'customer service',
      email: 'support@lexbusiness.com',
      availableLanguage: ['English', 'Spanish', 'French'],
    },
  }

  // Website schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name: 'Lex Business',
    description: 'Professional business solutions for the modern world',
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
          name: product.brand || 'Lex Business',
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
          name: author || 'Lex Business Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Lex Business',
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
      <meta property="og:site_name" content="Lex Business" />
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
      <meta name="twitter:site" content="@lexbusiness" />
      <meta name="twitter:creator" content="@lexbusiness" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Alternate Language Tags */}
      <link rel="alternate" hrefLang="en" href={`${siteUrl}/en${canonical || ''}`} />
      <link rel="alternate" hrefLang="es" href={`${siteUrl}/es${canonical || ''}`} />
      <link rel="alternate" hrefLang="fr" href={`${siteUrl}/fr${canonical || ''}`} />
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