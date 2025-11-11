import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ 
  title, 
  description, 
  keywords,
  image,
  type = 'website',
  author = 'Olivia Ship'
}) {
  const location = useLocation();
  const siteUrl = window.location.origin;
  const currentUrl = `${siteUrl}${location.pathname}`;

  // Default values
  const defaultTitle = 'Olivia Ship - أوليفيا شيب | خدمة التوصيل الفاخر إلى اليمن';
  const defaultDescription = 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان.';
  const defaultKeywords = 'أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، شحن دولي إلى اليمن';
  const defaultImage = `${siteUrl}/logo.svg`;

  const pageTitle = title ? `${title} | Olivia Ship` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageImage = image || defaultImage;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('keywords', pageKeywords);
    updateMetaTag('author', author);

    // Open Graph tags
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', pageImage, true);
    updateMetaTag('og:site_name', 'Olivia Ship', true);
    updateMetaTag('og:locale', 'ar_YE', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    updateMetaTag('twitter:image', pageImage);

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('language', 'Arabic');
    updateMetaTag('revisit-after', '7 days');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [pageTitle, pageDescription, pageKeywords, pageImage, currentUrl, type, author]);

  return null; // This component doesn't render anything
}
