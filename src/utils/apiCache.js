/**
 * API Caching Layer
 * تسريع API calls بالكاش
 */

// In-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cached API call
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function that returns a promise
 * @param {number} ttl - Time to live in milliseconds
 */
export const cachedAPI = async (key, fetcher, ttl = CACHE_DURATION) => {
  // Check cache first
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached.data;
  }

  console.log(`⏳ Cache MISS: ${key} - Fetching...`);
  
  try {
    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    // If fetch fails and we have stale cache, return it
    if (cached) {
      console.warn(`⚠️ Using stale cache for: ${key}`);
      return cached.data;
    }
    throw error;
  }
};

/**
 * Clear specific cache key
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
    console.log(`🗑️ Cleared cache: ${key}`);
  } else {
    cache.clear();
    console.log(`🗑️ Cleared all cache`);
  }
};

/**
 * Clear cache by pattern
 */
export const clearCachePattern = (pattern) => {
  const regex = new RegExp(pattern);
  let count = 0;
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }
  
  console.log(`🗑️ Cleared ${count} cache entries matching: ${pattern}`);
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  const stats = {
    size: cache.size,
    keys: Array.from(cache.keys()),
    totalSize: 0
  };
  
  for (const [key, value] of cache.entries()) {
    const size = JSON.stringify(value.data).length;
    stats.totalSize += size;
  }
  
  return stats;
};

/**
 * Preload cache (for critical data)
 */
export const preloadCache = async (key, fetcher, ttl) => {
  try {
    await cachedAPI(key, fetcher, ttl);
    console.log(`✅ Preloaded cache: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to preload cache: ${key}`, error);
  }
};

/**
 * Auto-refresh cache in background
 */
export const autoRefreshCache = (key, fetcher, interval = 5 * 60 * 1000) => {
  const refresh = async () => {
    try {
      const data = await fetcher();
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      console.log(`🔄 Auto-refreshed cache: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to auto-refresh cache: ${key}`, error);
    }
  };

  // Initial load
  refresh();
  
  // Set interval
  const intervalId = setInterval(refresh, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

// Export cache instance for advanced usage
export { cache };
