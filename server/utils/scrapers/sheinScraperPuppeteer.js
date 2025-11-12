// Puppeteer scraper disabled for Railway deployment
// This file is temporarily disabled because Railway doesn't support Chromium/Puppeteer easily

import Settings from '../../models/Settings.js';

/**
 * Shein Scraper باستخدام Puppeteer - معطل مؤقتاً
 * Puppeteer disabled for Railway deployment
 */
export const scrapeSheinPuppeteer = async (url) => {
  throw new Error('Puppeteer scraping temporarily disabled - not configured on Railway. Please use HTML scraping instead.');
};
