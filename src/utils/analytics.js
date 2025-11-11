// Google Analytics Helper Functions

// Initialize Google Analytics
export const initGA = (measurementId) => {
  if (!measurementId || typeof window === 'undefined') return;

  // Check if already initialized
  if (window.GA_MEASUREMENT_ID === measurementId) {
    console.log('✅ Google Analytics already initialized');
    return;
  }

  // Store measurement ID globally
  window.GA_MEASUREMENT_ID = measurementId;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  });

  console.log('✅ Google Analytics initialized with ID:', measurementId);
};

// Track page view
export const trackPageView = (url) => {
  if (typeof window.gtag !== 'undefined' && window.GA_MEASUREMENT_ID) {
    window.gtag('config', window.GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track event
export const trackEvent = (action, category, label, value) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track custom events
export const analytics = {
  // E-commerce events
  addToCart: (product) => {
    trackEvent('add_to_cart', 'ecommerce', product.name, product.price);
  },

  removeFromCart: (product) => {
    trackEvent('remove_from_cart', 'ecommerce', product.name, product.price);
  },

  beginCheckout: (value) => {
    trackEvent('begin_checkout', 'ecommerce', 'Checkout Started', value);
  },

  purchase: (orderId, value) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        value: value,
        currency: 'SAR',
      });
    }
  },

  // User events
  signUp: (method) => {
    trackEvent('sign_up', 'user', method);
  },

  login: (method) => {
    trackEvent('login', 'user', method);
  },

  // Product events
  viewProduct: (productName) => {
    trackEvent('view_item', 'product', productName);
  },

  searchProduct: (searchTerm) => {
    trackEvent('search', 'product', searchTerm);
  },

  // Engagement events
  clickButton: (buttonName) => {
    trackEvent('click', 'engagement', buttonName);
  },

  shareContent: (contentType, contentId) => {
    trackEvent('share', 'engagement', `${contentType}: ${contentId}`);
  },

  // Conversion events
  applyCoupon: (couponCode) => {
    trackEvent('apply_coupon', 'conversion', couponCode);
  },

  contactSubmit: () => {
    trackEvent('contact_submit', 'conversion', 'Contact Form');
  },
};

export default analytics;
