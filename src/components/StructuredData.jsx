import { useEffect } from 'react';

export default function StructuredData({ type, data }) {
  useEffect(() => {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create structured data based on type
    let structuredData = {};

    switch (type) {
      case 'organization':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Olivia Ship',
          alternateName: 'أوليفيا شيب',
          url: window.location.origin,
          logo: `${window.location.origin}/logo.svg`,
          description: 'خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'YE',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['Arabic', 'English'],
          },
          ...data,
        };
        break;

      case 'website':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Olivia Ship',
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/track?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
          ...data,
        };
        break;

      case 'product':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          image: data.image,
          description: data.description,
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency || 'SAR',
            availability: 'https://schema.org/InStock',
          },
        };
        break;

      case 'breadcrumb':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${window.location.origin}${item.url}`,
          })),
        };
        break;

      case 'service':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: 'International Delivery Service',
          provider: {
            '@type': 'Organization',
            name: 'Olivia Ship',
          },
          areaServed: {
            '@type': 'Country',
            name: 'Yemen',
          },
          description: 'خدمة توصيل المنتجات من المتاجر العالمية إلى اليمن',
          ...data,
        };
        break;

      default:
        return;
    }

    // Add structured data to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}
