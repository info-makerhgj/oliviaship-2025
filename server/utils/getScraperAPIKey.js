import Settings from '../models/Settings.js';

let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get ScraperAPI key from Settings or environment variable
 * Priority: Settings > Environment variable
 */
export const getScraperAPIKey = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
      if (cachedSettings.scraperAPI?.enabled && cachedSettings.scraperAPI?.apiKey) {
        return cachedSettings.scraperAPI.apiKey;
      }
    }

    // Get from Settings
    const settings = await Settings.getSettings();
    
    // Update cache
    cachedSettings = settings;
    cacheTimestamp = now;

    // Check if enabled and has key
    if (settings.scraperAPI?.enabled && settings.scraperAPI?.apiKey) {
      return settings.scraperAPI.apiKey;
    }

    // Fallback to environment variable
    return process.env.SCRAPERAPI_KEY || null;
  } catch (error) {
    console.error('Error getting ScraperAPI key:', error);
    // Fallback to environment variable on error
    return process.env.SCRAPERAPI_KEY || null;
  }
};

/**
 * Clear the cache (useful after settings update)
 */
export const clearScraperAPIKeyCache = () => {
  cachedSettings = null;
  cacheTimestamp = 0;
};






