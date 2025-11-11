import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your website URL
const SITE_URL = 'https://oliviaship.com'; // غير هذا لرابط موقعك

// Static pages
const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/about', priority: 0.8, changefreq: 'monthly' },
  { url: '/contact', priority: 0.8, changefreq: 'monthly' },
  { url: '/cart', priority: 0.9, changefreq: 'daily' },
  { url: '/track', priority: 0.9, changefreq: 'daily' },
  { url: '/order', priority: 0.9, changefreq: 'daily' },
  { url: '/terms', priority: 0.5, changefreq: 'yearly' },
  { url: '/privacy', priority: 0.5, changefreq: 'yearly' },
  { url: '/cookies', priority: 0.5, changefreq: 'yearly' },
  { url: '/points', priority: 0.7, changefreq: 'weekly' },
  { url: '/login', priority: 0.6, changefreq: 'monthly' },
  { url: '/register', priority: 0.6, changefreq: 'monthly' },
];

// Generate sitemap XML
function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// Generate robots.txt
function generateRobotsTxt() {
  return `# Robots.txt for Olivia Ship
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /agent/
Disallow: /pos/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// Write files
try {
  const publicDir = path.join(__dirname, 'public');
  
  // Generate and write sitemap.xml
  const sitemap = generateSitemap();
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml generated successfully!');
  
  // Generate and write robots.txt
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
  console.log('✅ robots.txt generated successfully!');
  
  console.log('\n📝 Files created in /public directory:');
  console.log('   - sitemap.xml');
  console.log('   - robots.txt');
  console.log('\n💡 Don\'t forget to update SITE_URL in generate-sitemap.js with your actual domain!');
} catch (error) {
  console.error('❌ Error generating files:', error);
}
