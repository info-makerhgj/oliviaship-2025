/**
 * Image Optimization Utilities
 * تحسين تحميل الصور للسرعة
 */

// Lazy load images
export const lazyLoadImage = (imageElement) => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    imageObserver.observe(imageElement);
  } else {
    // Fallback for older browsers
    imageElement.src = imageElement.dataset.src;
  }
};

// Preload critical images
export const preloadImage = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

// Get optimized image URL (for future CDN integration)
export const getOptimizedImageUrl = (url, width = 800, quality = 80) => {
  // يمكن إضافة CDN هنا لاحقاً
  return url;
};
