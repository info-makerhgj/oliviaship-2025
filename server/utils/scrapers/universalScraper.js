import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeAmazon } from './amazonScraper.js';
import { scrapeNoon } from './noonScraper.js';
import { scrapeAliExpress } from './aliexpressScraper.js';
import { scrapeShein } from './sheinScraper.js';
import { scrapeIHerb } from './iherbScraper.js';
import { scrapeNiceOne } from './niceonesaScraper.js';
import { scrapeNamshi } from './namshiScraper.js';
import { scrapeTrendyol } from './trendyolScraper.js';
import { scrapeLocalStore } from './localStoreScraper.js';
import { normalizeUrl } from '../extractUrl.js';
import Settings from '../../models/Settings.js';

export const scrapeProduct = async (url) => {
  try {
    // تنظيف الرابط من النص المختلط (إذا كان موجوداً)
    if (url && typeof url === 'string') {
      try {
        url = normalizeUrl(url) || url;
      } catch (e) {
        // إذا فشل normalizeUrl، استخدم url الأصلي
        console.log(`⚠️ normalizeUrl failed: ${e.message}`);
      }
    }
    
    // Detect store first - check local stores first, then known stores
    const urlLower = url.toLowerCase();
    let store = 'other';
    let localStoreInfo = null;
    
    // Check local stores first (manually added stores)
    try {
      const settings = await Settings.getSettings();
      if (settings.localStores && settings.localStores.length > 0) {
        for (const localStore of settings.localStores) {
          if (localStore.enabled && localStore.domain) {
            const domainLower = localStore.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (urlLower.includes(domainLower)) {
              store = 'local';
              localStoreInfo = localStore;
              console.log(`🏪 Detected local store: ${localStore.name} (${localStore.domain})`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking local stores:', error);
    }
    
    // If not a local store, check known stores
    if (store === 'other') {
      if (urlLower.includes('amazon') || urlLower.includes('amazon.sa') || urlLower.includes('amazon.ae') || urlLower.includes('amzn.eu')) {
        store = 'amazon';
      } else if (urlLower.includes('noon') || urlLower.includes('noon.com')) {
        store = 'noon';
      } else if (urlLower.includes('shein') || urlLower.includes('ar.shein.com') || urlLower.includes('shein.com')) {
        store = 'shein';
      } else if (urlLower.includes('aliexpress') || urlLower.includes('ar.aliexpress.com') || urlLower.includes('aliexpress.com') || urlLower.includes('a.aliexpress.com')) {
        store = 'aliexpress';
      } else if (urlLower.includes('temu') || urlLower.includes('temu.com')) {
        store = 'temu';
      } else if (urlLower.includes('iherb') || urlLower.includes('iherb.com') || urlLower.includes('iherb.co')) {
        store = 'iherb';
      } else if (urlLower.includes('niceonesa') || urlLower.includes('niceonesa.com')) {
        store = 'niceonesa';
      } else if (urlLower.includes('namshi') || urlLower.includes('namshi.com')) {
        store = 'namshi';
      } else if (urlLower.includes('trendyol') || urlLower.includes('trendyol.com') || urlLower.includes('ty.gl')) {
        store = 'trendyol';
      }
    }
    
    // استخدام Amazon Scraper المخصص إذا كان الموقع أمازون
    if (store === 'amazon') {
      console.log('🚀 Using dedicated Amazon scraper');
      return await scrapeAmazon(url);
    }
    
    // استخدام Noon Scraper المخصص إذا كان الموقع نون
    if (store === 'noon') {
      console.log('🚀 Using dedicated Noon scraper');
      return await scrapeNoon(url);
    }
    
    // استخدام AliExpress Scraper المخصص إذا كان الموقع علي إكسبريس
    if (store === 'aliexpress') {
      console.log('🚀 Using dedicated AliExpress scraper');
      return await scrapeAliExpress(url);
    }
    
    // استخدام Shein Scraper المخصص إذا كان الموقع شين
    if (store === 'shein') {
      console.log('🚀 Using dedicated Shein scraper');
      return await scrapeShein(url);
    }
    
    // استخدام iHerb Scraper المخصص إذا كان الموقع iHerb
    if (store === 'iherb') {
      console.log('🚀 Using dedicated iHerb scraper');
      return await scrapeIHerb(url);
    }
    
    // استخدام Nice One Scraper المخصص إذا كان الموقع Nice One
    if (store === 'niceonesa') {
      console.log('🚀 Using dedicated Nice One scraper');
      return await scrapeNiceOne(url);
    }
    
    // استخدام Namshi Scraper المخصص إذا كان الموقع نمشي
    if (store === 'namshi') {
      console.log('🚀 Using dedicated Namshi scraper');
      return await scrapeNamshi(url);
    }
    
    // استخدام Trendyol Scraper المخصص إذا كان الموقع Trendyol
    if (store === 'trendyol') {
      console.log('🚀 Using dedicated Trendyol scraper');
      return await scrapeTrendyol(url);
    }
    
    // استخدام Local Store Scraper للمتاجر المحلية
    if (store === 'local' && localStoreInfo) {
      console.log(`🚀 Using local store scraper for: ${localStoreInfo.name}`);
      return await scrapeLocalStore(url, localStoreInfo.name);
    }
    
    // رفض المتاجر غير المعرفة - فقط المتاجر المعرفة مسموحة
    if (store === 'other') {
      return {
        success: false,
        error: 'المتجر غير مدعوم',
        details: 'هذا المتجر غير معرف في النظام',
        suggestion: 'يرجى استخدام رابط من متجر معرف (Amazon, Noon, Shein, AliExpress, Temu, iHerb, NiceOne, Namshi, Trendyol) أو إضافة المتجر يدوياً من الإعدادات > المتاجر > المتاجر المحلية',
      };
    }
    
    // باقي المواقع تستخدم النظام العام (المتاجر المعرفة فقط)
    let html;

    // Try with ScraperAPI first if available
    if (process.env.SCRAPERAPI_KEY) {
      try {
        const urlObj = new URL(url);
        const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
        
        const response = await axios.get('http://api.scraperapi.com', {
          params: {
            api_key: process.env.SCRAPERAPI_KEY,
            url: cleanUrl,
            render: true,
          },
          timeout: 20000,
        });
        html = response.data;
        
        if (html && html.length > 100) {
          console.log(`✅ ScraperAPI success: ${url.substring(0, 60)}...`);
        }
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
      }
    }

    // Fallback to direct request
    if (!html) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 15000,
        });
        html = response.data;
      } catch (error) {
        console.log(`⚠️ Direct request failed: ${error.message}`);
      }
    }

    // Check if we have HTML before processing
    if (!html || typeof html !== 'string') {
      throw new Error('فشل في جلب محتوى الصفحة. يرجى المحاولة مرة أخرى.');
    }

    const $ = cheerio.load(html);
    // Extract title (for non-Amazon stores)
    let title = '';
    if (store === 'noon') {
      title = $('h1').first().text().trim() ||
              $('[data-product-title]').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();
    } else if (store === 'shein') {
      title = $('.product-intro__head-name').text().trim() ||
              $('[class*="product-intro__head-name"]').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('h1').first().text().trim() ||
              $('title').text().trim();
    } else if (store === 'aliexpress') {
      title = $('h1[data-pl="product-title"]').text().trim() ||
              $('.product-title-text').text().trim() ||
              $('[itemprop="name"]').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('h1').first().text().trim() ||
              $('title').text().trim();
    } else if (store === 'temu') {
      title = $('h1').first().text().trim() ||
              $('[class*="goods-title"]').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();
    } else {
      title = $('h1').first().text().trim() || 
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();
    }
    
    // Extract price (for non-Amazon stores)
    let priceText = '';
    let price = 0;
    
    if (store === 'noon') {
      priceText = $('[data-price]').attr('data-price') ||
                  $('.priceNow').text().trim() ||
                  $('.sellingPrice').text().trim();
    } else if (store === 'shein') {
      priceText = $('.price__current').text().trim() ||
                  $('.product-intro__head-price').text().trim() ||
                  $('[data-price]').attr('data-price') ||
                  $('[class*="price"]').filter((i, el) => {
                    const text = $(el).text().trim();
                    return /[\d.,]+/.test(text) && text.length < 50;
                  }).first().text().trim();
    } else if (store === 'aliexpress') {
      priceText = $('[itemprop="price"]').attr('content') ||
                  $('[itemprop="price"]').text().trim() ||
                  $('.price-current').text().trim() ||
                  $('.notranslate.price-current').text().trim() ||
                  $('.price').filter((i, el) => {
                    const text = $(el).text().trim();
                    return /[\d.,]+/.test(text) && text.length < 50;
                  }).first().text().trim();
    } else if (store === 'temu') {
      priceText = $('[data-price]').attr('data-price') ||
                  $('.goods-price').text().trim() ||
                  $('.current-price').text().trim() ||
                  $('[class*="price"]').filter((i, el) => {
                    const text = $(el).text().trim();
                    return /[\d.,]+/.test(text) && text.length < 50;
                  }).first().text().trim();
    } else {
      priceText = $('[class*="price"]').first().text().trim() ||
                  $('[id*="price"]').first().text().trim();
    }
    
    // Try JSON-LD first
    if (price === 0) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers)) {
                if (jsonData.offers[0] && jsonData.offers[0].price) {
                  price = parseFloat(jsonData.offers[0].price);
                  break;
                }
              } else if (jsonData.offers.price) {
                price = parseFloat(jsonData.offers.price);
                break;
              }
            }
            if (jsonData.price) {
              price = parseFloat(jsonData.price);
              break;
            }
          } catch (e) {
            // Continue to next script
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    // Extract from price text
    if (price === 0 && priceText) {
      let cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
      const arabicToEnglish = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
      };
      cleanPrice = cleanPrice.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
      const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0]);
      }
    }
    
    // Try meta tags
    if (price === 0) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        price = parseFloat(metaPrice);
      }
    }
    
    // Extract image (for non-Amazon stores)
    let image = '';
    if (store === 'noon') {
      image = $('[data-product-image]').attr('data-product-image') ||
              $('meta[property="og:image"]').attr('content');
    } else if (store === 'shein') {
      image = $('.product-intro__head-image img').first().attr('src') ||
              $('.product-intro__head-image img').first().attr('data-src') ||
              $('meta[property="og:image"]').attr('content');
    } else if (store === 'aliexpress') {
      image = $('.images-view-item img').first().attr('src') ||
              $('[itemprop="image"]').attr('content') ||
              $('meta[property="og:image"]').attr('content');
    } else if (store === 'temu') {
      image = $('[class*="goods-image"] img').first().attr('src') ||
              $('meta[property="og:image"]').attr('content');
    } else {
      image = $('meta[property="og:image"]').attr('content') ||
              $('img').first().attr('src');
    }
    
    // Clean image URL
    if (image && !image.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        if (image.startsWith('//')) {
          image = urlObj.protocol + image;
        } else if (image.startsWith('/')) {
          image = urlObj.origin + image;
        }
      } catch (e) {
        // Keep original
      }
    }

    return {
      success: true,
      product: {
        name: title || 'منتج بدون اسم',
        price: price || 0,
        currency: 'SAR',
        image: image || '',
        store: store,
        url: url,
      },
    };
  } catch (error) {
    console.error('Scraping error:', {
      message: error.message,
      code: error.code,
      url: url,
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بموقع المتجر. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم المتجر. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};
