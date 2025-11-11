import axios from 'axios';
import * as cheerio from 'cheerio';
import Settings from '../../models/Settings.js';
import { scrapeSheinPuppeteer } from './sheinScraperPuppeteer.js';

/**
 * Shein Scraper - مخصص ومحسّن لموقع شين
 * استراتيجية متوازية: جلب الصورة والاسم بسرعة، السعر يحتاج JavaScript
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 * يحول العملة تلقائياً إلى SAR
 */

// دالة لجلب الصورة والاسم بسرعة (من HTML الأساسي - بدون render)
const fetchBasicInfo = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 8000,
      maxRedirects: 5,
    });
    
    const $ = cheerio.load(response.data);
    
    // جلب الصورة من meta tags أولاً (سريع)
    let image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('meta[itemprop="image"]').attr('content');
    
    // إذا لم توجد في meta، نجرب من img tags
    if (!image || image.length < 10) {
      image = $('[class*="product-intro"] img').first().attr('src') ||
              $('[class*="product-intro"] img').first().attr('data-src') ||
              $('[class*="product-image"] img').first().attr('src') ||
              $('[class*="goods-image"] img').first().attr('src') ||
              $('[itemprop="image"] img').first().attr('src') ||
              $('[data-src]').first().attr('data-src') || '';
    }
    
    // تنظيف URL الصورة
    if (image && !image.startsWith('http')) {
      if (image.startsWith('//')) {
        image = 'https:' + image;
      } else if (image.startsWith('/')) {
        image = 'https://ar.shein.com' + image;
      }
    }
    
    // جلب الاسم من meta tags أو title (سريع)
    let name = $('meta[property="og:title"]').attr('content') ||
               $('meta[name="twitter:title"]').attr('content') ||
               $('h1').first().text().trim() ||
               $('title').text().trim();
    
    // تنظيف الاسم
    if (name) {
      name = name.replace(/\s+/g, ' ').trim();
      name = name.replace(/^SHEIN\s*[-–]\s*/i, '').trim();
      name = name.replace(/\s*[-–]\s*SHEIN$/i, '').trim();
    }
    
    return { image: image || '', name: name || '' };
  } catch (error) {
    return { image: '', name: '' };
  }
};

// دالة لجلب السعر (مثل Shein to Shopify - استخدام render مع بحث عميق في JSON)
const fetchPrice = async (url, apiKey) => {
  if (!apiKey) {
    return { price: 0, currency: 'SAR' };
  }
  
  try {
    // استخدام ScraperAPI مع render (مثل browser extension)
    const response = await axios.get('http://api.scraperapi.com', {
      params: {
        api_key: apiKey,
        url: url,
        render: true,
        wait: 3000, // انتظار 3 ثواني للسماح لـ JavaScript بالتحميل الكامل
      },
      timeout: 12000, // 12 ثانية فقط (أسرع)
    });
    
    if (response.data && response.data.length > 100000) {
      const $ = cheerio.load(response.data);
      let price = 0;
      
      // 1. البحث في CSS selectors أولاً
      const priceSelectors = [
        '.price__current', '.price__current-value', '.product-intro__head-price',
        '[data-price]', '[class*="price-current"]', '[itemprop="price"]',
      ];
      
      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim() || 
                         $(selector).first().attr('data-price') ||
                         $(selector).first().attr('content');
        if (priceText) {
          const cleanPrice = priceText.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
          const foundPrice = parseFloat(cleanPrice.match(/[\d]+\.?\d*/)?.[0]);
          if (foundPrice > 1 && foundPrice < 50000) {
            price = foundPrice;
            console.log(`✅ Price found via selector: ${price}`);
            return { price: price, currency: 'SAR' };
          }
        }
      }
      
      // 2. البحث العميق في JSON objects (مثل ما تفعله browser extensions)
      const scripts = $('script');
      console.log(`🔍 Deep searching in ${scripts.length} scripts for JSON objects...`);
      
      // البحث عن JSON objects كبيرة (window.productData, window.__INITIAL_STATE__, etc.)
      const jsonPatterns = [
        /window\.productData\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /window\.g_config\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /window\.goodsInfo\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /goodsInfo\s*=\s*(\{[\s\S]{0,200000}\});/i,
        /gbCommonInfo\s*=\s*(\{[\s\S]{0,200000}\});/i,
      ];
      
      for (let i = 0; i < scripts.length; i++) {
        const scriptText = $(scripts[i]).html();
        if (!scriptText || scriptText.length < 1000) continue;
        
        // البحث عن JSON objects كبيرة
        for (const pattern of jsonPatterns) {
          const match = scriptText.match(pattern);
          if (match && match[1]) {
            try {
              const jsonData = JSON.parse(match[1]);
              
              // البحث العميق في JSON (recursive search)
              const findPriceInObject = (obj, depth = 0, maxDepth = 20) => {
                if (depth > maxDepth || typeof obj !== 'object' || obj === null) return null;
                
                // البحث عن مفاتيح price
                for (const key in obj) {
                  const value = obj[key];
                  
                  // إذا كان المفتاح يحتوي على price وكان الرقم منطقي
                  if (key.toLowerCase().includes('price') && typeof value === 'number' && value > 1 && value < 50000) {
                    return value;
                  }
                  
                  // مفاتيح محددة لشين
                  if (typeof value === 'number' && (
                    key === 'price' || key === 'currentPrice' || key === 'salePrice' ||
                    key === 'finalPrice' || key === 'goodsPrice' || key === 'retailPrice'
                  ) && value > 1 && value < 50000) {
                    return value;
                  }
                  
                  // البحث في objects فرعية
                  if (typeof value === 'object' && value !== null) {
                    const found = findPriceInObject(value, depth + 1, maxDepth);
                    if (found) return found;
                  }
                  
                  // البحث في arrays
                  if (Array.isArray(value) && value.length > 0) {
                    for (let j = 0; j < Math.min(value.length, 20); j++) {
                      if (typeof value[j] === 'object') {
                        const found = findPriceInObject(value[j], depth + 1, maxDepth);
                        if (found) return found;
                      }
                    }
                  }
                }
                return null;
              };
              
              const foundPrice = findPriceInObject(jsonData);
              if (foundPrice) {
                price = foundPrice;
                console.log(`✅ Price found in JSON object (script ${i}): ${price}`);
                return { price: price, currency: 'SAR' };
              }
            } catch (e) {
              // continue
            }
          }
        }
        
        // البحث السريع في patterns بسيطة (fallback)
        if (price === 0) {
          const simplePatterns = [
            /"price"\s*:\s*"?([\d.]+)"?/i,
            /"currentPrice"\s*:\s*"?([\d.]+)"?/i,
            /"goodsPrice"\s*:\s*"?([\d.]+)"?/i,
          ];
          
          for (const pattern of simplePatterns) {
            const priceMatch = scriptText.match(pattern);
            if (priceMatch && priceMatch[1]) {
              const foundPrice = parseFloat(priceMatch[1]);
              if (foundPrice > 1 && foundPrice < 50000) {
                price = foundPrice;
                console.log(`✅ Price found via simple pattern (script ${i}): ${price}`);
                return { price: price, currency: 'SAR' };
              }
            }
          }
        }
      }
      
      // 3. البحث في النصوص
      if (price === 0) {
        const allText = $.text();
        const pricePattern = /([\d,]+\.?\d*)\s*(?:SAR|ريال|ر\.س)/i;
        const match = allText.match(pricePattern);
        if (match && match[1]) {
          const foundPrice = parseFloat(match[1].replace(/,/g, ''));
          if (foundPrice > 1 && foundPrice < 50000) {
            price = foundPrice;
            console.log(`✅ Price found in text: ${price}`);
            return { price: price, currency: 'SAR' };
          }
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ Price fetch failed: ${error.message}`);
  }
  
  return { price: 0, currency: 'SAR' };
};

export const scrapeShein = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL ومعالجة الروابط القصيرة أولاً
    let urlObj;
    let finalUrl = url;
    let price = 0;
    let detectedCurrency = 'SAR';
    
    try {
      urlObj = new URL(url);
    } catch (e) {
      return {
        success: false,
        error: 'رابط غير صحيح',
        details: 'الرجاء التأكد من صحة الرابط',
      };
    }
    
    // استخراج product ID من URL
    let productIdMatch = url.match(/p-(\d+)/);
    let productId = productIdMatch ? productIdMatch[1] : null;
    
    // معالجة الروابط القصيرة (api-shein.shein.com) - أولوية أولى
    if (urlObj.hostname.includes('api-shein.shein.com') || urlObj.hostname.includes('api-shein') || 
        urlObj.hostname.includes('sharejump') || url.includes('sharejump')) {
      console.log(`🔄 Detected short link, resolving redirect first...`);
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 15000,
          maxRedirects: 15,
          validateStatus: (status) => status < 400,
        });
        
        // استخراج الرابط النهائي من response
        finalUrl = response.request.res?.responseUrl || 
                   response.request.responseURL || 
                   response.config?.url || 
                   url;
        
        // إذا كان response يحتوي على redirect في location header
        if (response.headers.location) {
          finalUrl = response.headers.location;
          // إذا كان relative URL، نجعلها absolute
          if (!finalUrl.startsWith('http')) {
            finalUrl = new URL(finalUrl, urlObj.origin).href;
          }
        }
        
        // محاولة استخراج الرابط من HTML إذا كان موجوداً
        if (response.data && typeof response.data === 'string') {
          const htmlMatch = response.data.match(/https?:\/\/[^\s"']*shein\.com[^\s"']*/i);
          if (htmlMatch) {
            finalUrl = htmlMatch[0];
          }
        }
        
        urlObj = new URL(finalUrl);
        
        // استخراج product ID من URL الجديد
        productIdMatch = finalUrl.match(/p-(\d+)/);
        if (productIdMatch) {
          productId = productIdMatch[1];
        }
        
        console.log(`✅ Redirect resolved: ${finalUrl.substring(0, 80)}...`);
      } catch (error) {
        console.log(`⚠️ Redirect failed: ${error.message}, using original URL`);
        // continue with original URL
      }
    }
    
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    // استخدام HTML scraping كطريقة أولى (أسرع وأقل اكتشافاً من Puppeteer)
    // Puppeteer يسبب reCAPTCHA، لذلك نستخدمه فقط كـ fallback
    console.log(`🚀 Using HTML scraping for Shein (faster, less detection)`);
    
    try {
      // جلب HTML مباشرة
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // استخراج البيانات
      let name = $('meta[property="og:title"]').attr('content') ||
                 $('title').text().trim() || '';
      
      // تنظيف الاسم
      if (name) {
        name = name.replace(/^SHEIN\s*[-–]\s*/i, '').trim();
        name = name.replace(/\s*[-–]\s*SHEIN$/i, '').trim();
        name = name.replace(/\s*\|.*$/i, '').trim();
      }
      
      let image = $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('[itemprop="image"]').attr('content') || '';
      
      // البحث عن السعر في scripts
      const scripts = $('script');
      for (let i = 0; i < scripts.length; i++) {
        const scriptText = $(scripts[i]).html();
        if (!scriptText || scriptText.length < 100) continue;
        
        // البحث عن JSON patterns
        const jsonPatterns = [
          /window\.productData\s*=\s*(\{[\s\S]{0,100000}\});/i,
          /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]{0,100000}\});/i,
          /window\.goodsInfo\s*=\s*(\{[\s\S]{0,100000}\});/i,
        ];
        
        for (const pattern of jsonPatterns) {
          const match = scriptText.match(pattern);
          if (match && match[1]) {
            try {
              const jsonData = JSON.parse(match[1]);
              const findPrice = (obj, depth = 0) => {
                if (depth > 20 || typeof obj !== 'object' || obj === null) return null;
                for (const key in obj) {
                  const value = obj[key];
                  if (key.toLowerCase().includes('price') && typeof value === 'number' && value >= 5 && value <= 500) {
                    return value;
                  }
                  if (typeof value === 'object' && value !== null) {
                    const found = findPrice(value, depth + 1);
                    if (found) return found;
                  }
                }
                return null;
              };
              const foundPrice = findPrice(jsonData);
              if (foundPrice) {
                price = foundPrice;
                break;
              }
            } catch (e) {
              // continue
            }
          }
        }
        if (price > 0) break;
      }
      
      // إذا لم يتم العثور على السعر، استخدام ScraperAPI
      if (price === 0 && process.env.SCRAPERAPI_KEY) {
        console.log(`🔄 Trying ScraperAPI for price...`);
        try {
          const scraperApiUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(cleanUrl)}&render=true&wait=3000`;
          const apiResponse = await axios.get(scraperApiUrl, { timeout: 20000 });
          const apiHtml = apiResponse.data;
          const $api = cheerio.load(apiHtml);
          
          // البحث عن السعر في HTML من ScraperAPI
          const priceText = $api('#productMainPriceId, #productPriceId, .productPrice_main').first().text().trim();
          const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
          }
        } catch (e) {
          console.log(`⚠️ ScraperAPI failed: ${e.message}`);
        }
      }
      
      // تحويل العملة إلى SAR
      let finalPrice = price;
      if (price > 0) {
        try {
          const settings = await Settings.getSettings();
          const currencyRates = settings.pricing?.currencyRates || {};
          const sarRate = currencyRates.SAR || 67;
          const usdRate = currencyRates.USD || 250;
          
          if (detectedCurrency === 'USD') {
            const usdToSar = sarRate / usdRate;
            finalPrice = price * usdToSar;
          }
          finalPrice = Math.round(finalPrice * 100) / 100;
        } catch (e) {
          // use default
        }
      }
      
      const duration = Date.now() - startTime;
      
      if (!name || name.length < 3) {
        return {
          success: false,
          error: 'لم يتم العثور على اسم المنتج',
          details: 'الرجاء التأكد من صحة الرابط',
        };
      }
      
      if (finalPrice === 0) {
        return {
          success: false,
          error: 'لم يتم العثور على سعر المنتج',
          product: {
            name: name,
            price: 0,
            currency: 'SAR',
            image: image || '',
            store: 'shein',
            url: finalUrl,
          },
          metadata: {
            duration: duration,
            source: 'shein-html-scraper',
          },
        };
      }
      
      return {
        success: true,
        product: {
          name: name,
          price: finalPrice,
          currency: 'SAR',
          image: image || '',
          store: 'shein',
          url: finalUrl,
        },
        metadata: {
          duration: duration,
          source: 'shein-html-scraper',
        },
      };
      
    } catch (htmlError) {
      console.log(`⚠️ HTML scraping failed: ${htmlError.message}`);
      console.log(`🔄 Falling back to Puppeteer...`);
      
      // Fallback to Puppeteer only if HTML scraping fails
      try {
        const result = await scrapeSheinPuppeteer(cleanUrl);
        return result;
      } catch (puppeteerError) {
        console.log(`⚠️ Puppeteer also failed: ${puppeteerError.message}`);
        
        // آخر محاولة: استخدام API endpoints مباشرة
        if (productId) {
          const apiEndpoints = [
            `https://ar.shein.com/api/productInfo/productDetail/get?goods_id=${productId}`,
            `https://ar.shein.com/product/get_goods_detail_static_data?goods_id=${productId}`,
            `https://ar.shein.com/api/productInfo/quickView/get?goods_id=${productId}`,
          ];
          
          for (const apiUrl of apiEndpoints) {
            try {
              console.log(`🔍 Trying API: ${apiUrl.substring(apiUrl.indexOf('/api') || apiUrl.indexOf('/product'))}...`);
              const apiResponse = await axios.get(apiUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'application/json',
                  'Referer': cleanUrl,
                },
                timeout: 8000,
              });
              
              if (apiResponse.data) {
                const data = apiResponse.data;
                const productInfo = data.info || data.data || data.goodsInfo || data;
                
                let foundPrice = productInfo.goodsPrice || productInfo.salePrice || productInfo.retailPrice || 
                               productInfo.price || productInfo.currentPrice || productInfo.finalPrice;
                
                if (foundPrice) {
                  const apiPrice = parseFloat(foundPrice);
                  if (apiPrice > 1 && apiPrice < 50000) {
                    console.log(`✅ Price found via API: ${apiPrice}`);
                    
                    return {
                      success: true,
                      product: {
                        name: productInfo.goodsName || productInfo.goods_title || productInfo.title || 'منتج من Shein',
                        price: apiPrice,
                        currency: 'SAR',
                        image: productInfo.goodsImg || productInfo.mainImg || productInfo.image || '',
                        store: 'shein',
                        url: finalUrl,
                      },
                      metadata: {
                        duration: Date.now() - startTime,
                        source: 'shein-api-direct',
                      },
                    };
                  }
                }
              }
            } catch (apiError) {
              // continue to next endpoint
              continue;
            }
          }
        }
        
        return {
          success: false,
          error: 'فشل في جلب بيانات المنتج من شين',
          details: htmlError.message || puppeteerError.message,
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Shein scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    return {
      success: false,
      error: 'فشل في جلب بيانات المنتج من شين',
      details: error.message,
    };
  }
};
