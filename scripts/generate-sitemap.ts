import fs from 'fs'
import path from 'path'

interface SitemapEntry {
  url: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  lastmod?: string
}

const baseUrl = 'https://www.lexbusiness.com'
const today = new Date().toISOString().split('T')[0]

const routes: SitemapEntry[] = [
  // Main pages
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.9 },
  { url: '/faq', changefreq: 'weekly', priority: 0.7 },
  { url: '/products', changefreq: 'weekly', priority: 0.9 },
  { url: '/services', changefreq: 'weekly', priority: 0.9 },
  
  // Product pages
  { url: '/products/categories', changefreq: 'weekly', priority: 0.7 },
  { url: '/products/new', changefreq: 'daily', priority: 0.8 },
  { url: '/products/best-sellers', changefreq: 'weekly', priority: 0.8 },
  
  // Service pages
  { url: '/services/consulting', changefreq: 'monthly', priority: 0.7 },
  { url: '/services/support', changefreq: 'monthly', priority: 0.7 },
  { url: '/services/training', changefreq: 'monthly', priority: 0.7 },
  { url: '/services/custom', changefreq: 'monthly', priority: 0.7 },
  
  // Auth pages (lower priority)
  { url: '/login', changefreq: 'yearly', priority: 0.4 },
  { url: '/register', changefreq: 'yearly', priority: 0.4 },
  
  // User pages
  { url: '/profile', changefreq: 'monthly', priority: 0.5 },
  { url: '/search', changefreq: 'monthly', priority: 0.6 },
  
  // Demo pages
  { url: '/design-2025', changefreq: 'monthly', priority: 0.5 },
  { url: '/notifications', changefreq: 'monthly', priority: 0.4 },
  { url: '/social-media', changefreq: 'monthly', priority: 0.4 },
  
  // Legal pages
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/cookies', changefreq: 'yearly', priority: 0.3 },
  
  // Error pages (excluded from sitemap by convention)
  // { url: '/404', changefreq: 'never', priority: 0.1 },
  // { url: '/500', changefreq: 'never', priority: 0.1 },
  // { url: '/403', changefreq: 'never', priority: 0.1 },
  // { url: '/maintenance', changefreq: 'never', priority: 0.1 },
  // { url: '/offline', changefreq: 'never', priority: 0.1 },
]

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  const publicPath = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true })
  }

  fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemap)
  console.log('✅ Sitemap generated successfully!')
}

generateSitemap()