const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const pages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'products', path: '/products' },
  { name: 'contact', path: '/contact' },
  { name: 'faq', path: '/faq' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: '403', path: '/403' },
  { name: '500', path: '/500' },
  { name: 'maintenance', path: '/maintenance' },
  { name: '404', path: '/nonexistent' },
  { name: 'design-demo', path: '/design-demo' },
];

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  for (const pageInfo of pages) {
    const page = await browser.newPage();
    
    // Desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`http://localhost:3000${pageInfo.path}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(screenshotsDir, `${pageInfo.name}-desktop.png`),
      fullPage: true
    });
    console.log(`✓ Screenshot saved: ${pageInfo.name}-desktop.png`);
    
    // Mobile viewport
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(screenshotsDir, `${pageInfo.name}-mobile.png`),
      fullPage: true
    });
    console.log(`✓ Screenshot saved: ${pageInfo.name}-mobile.png`);
    
    await page.close();
  }
  
  await browser.close();
  console.log('\n✨ All screenshots taken successfully!');
}

takeScreenshots().catch(console.error);