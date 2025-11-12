/**
 * API Optimization Utilities
 * تحسين استدعاءات API للسرعة
 */

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cachedFetch = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

// Clear cache
export const clearCache = () => {
  cache.clear();
};

// Debounce function for search/filter
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
