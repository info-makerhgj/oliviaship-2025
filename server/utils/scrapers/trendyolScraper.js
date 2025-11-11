import axios from 'axios';
import * as cheerio from 'cheerio';
import { getScraperAPIKey } from '../getScraperAPIKey.js';

/**
 * Trendyol Scraper - مخصص ومحسّن لموقع Trendyol
 * نفس نظام Noon و Amazon: بسيط وسريع وفعّال
 */
export const scrapeTrendyol = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    // اكتشاف اللغة من URL لتحديد country code المناسب
    let isArabicVersion = cleanUrl.includes('/ar/') || cleanUrl.includes('/ar-');
    let workingUrl = cleanUrl;
    
    // للنسخة العربية: تحويل الرابط إلى النسخة التركية (تعمل بشكل أفضل)
    if (isArabicVersion) {
      // تحويل /ar/ إلى /tr/ أو إزالة /ar/ للحصول على نسخة تعمل
      workingUrl = cleanUrl.replace('/ar/', '/tr/').replace('/ar-', '/tr-');
      if (workingUrl === cleanUrl) {
        // إذا لم ينجح التحويل، جرب بدون /ar/
        workingUrl = cleanUrl.replace('/ar/', '/').replace('/ar-', '/');
      }
      console.log(`🌍 Detected Arabic version, trying Turkish version instead...`);
      console.log(`   Original: ${cleanUrl.substring(0, 80)}...`);
      console.log(`   Working: ${workingUrl.substring(0, 80)}...`);
      isArabicVersion = false; // نتعامل معها كنسخة تركية
    }
    
    const countryCode = 'TR'; // استخدام TR لجميع النسخ لأنه يعمل بشكل أفضل
    
    console.log(`🌍 Using country_code=TR`);
    
    let html = '';
    
    // Trendyol محمي بشدة - نستخدم ScraperAPI أولاً إذا كان متاحاً
    // Trendyol يحتاج cookies/headers للوصول للمنتج (ليس صفحة اختيار البلد)
    const scraperAPIKey = await getScraperAPIKey();
    if (scraperAPIKey) {
      try {
        console.log(`🔍 Trying ScraperAPI first for Trendyol (protected site) with country_code=${countryCode}...`);
        
        // Trendyol يتطلب cookies/headers للوصول المباشر
        // للنسخة العربية: نستخدم SA (السعودية) أو AE (الإمارات)
        // للنسخة التركية: نستخدم TR
        // استخدام wait أطول مع render للسماح لـ JavaScript باختيار البلد
        // استخدام workingUrl (النسخة التركية) بدلاً من cleanUrl للنسخة العربية
        const scraperUrl = `http://api.scraperapi.com?api_key=${scraperAPIKey}&url=${encodeURIComponent(workingUrl)}&render=true&wait=12000&country_code=${countryCode}&premium=true&session_number=1`;
        
        const response = await axios.get(scraperUrl, {
          timeout: 120000, // timeout أطول لـ render (120 ثانية)
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
          },
        });
        html = response.data;
        
        // التحقق من أن الصفحة ليست صفحة اختيار البلد
        if (html && html.length > 100) {
          const isCountrySelection = html.includes('Welcome to Trendyol') || 
                                     html.includes('Please select your country') ||
                                     html.includes('country-selection') ||
                                     html.includes('country-select-container');
          
          if (isCountrySelection) {
            console.log(`⚠️ ScraperAPI returned country selection page with ${countryCode}, trying different approach...`);
            html = ''; // إعادة تعيين لتجربة طريقة أخرى
          } else {
            // التحقق من أن الصفحة تحتوي على بيانات المنتج
            const hasProductData = html.includes('product') || html.includes('price') || html.includes('data-testid');
            if (hasProductData) {
              console.log(`✅ ScraperAPI (with render) used for Trendyol (${html.length} chars)`);
            } else {
              console.log(`⚠️ ScraperAPI returned HTML but no product data detected`);
              html = '';
            }
          }
        } else {
          console.log(`⚠️ ScraperAPI returned empty HTML`);
          html = ''; // إعادة تعيين لتجربة الطرق الأخرى
        }
      } catch (error) {
        console.log(`⚠️ ScraperAPI (with render) failed: ${error.message}`);
        if (error.response) {
          console.log(`⚠️ ScraperAPI status: ${error.response.status}`);
          if (error.response.status === 403 || error.response.status === 401) {
            console.log(`⚠️ ScraperAPI authentication issue - check API key`);
          }
        }
        html = ''; // إعادة تعيين
      }
      
      // محاولة أخرى مع إعدادات مختلفة
      if (!html || html.length < 100) {
        // بعد التحويل إلى النسخة التركية، نجرب US فقط
        const fallbackCountries = ['US'];
        
        for (const fallbackCountry of fallbackCountries) {
          try {
            console.log(`🔄 Trying ScraperAPI with country_code=${fallbackCountry} and longer wait time (15s)...`);
            // محاولة مع wait أطول (15 ثانية) للسماح لـ JavaScript باختيار البلد تلقائياً
            // استخدام workingUrl (النسخة التركية) للنسخة العربية
            const scraperUrl2 = `http://api.scraperapi.com?api_key=${scraperAPIKey}&url=${encodeURIComponent(workingUrl)}&render=true&wait=15000&country_code=${fallbackCountry}&premium=true&session_number=1`;
            const retryResponse = await axios.get(scraperUrl2, {
              timeout: 150000, // 150 ثانية
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
              },
            });
            html = retryResponse.data;
            
            const isCountrySelection = html && (html.includes('Welcome to Trendyol') || 
                                               html.includes('Please select your country') ||
                                               html.includes('country-selection') ||
                                               html.includes('country-select-container'));
            
            if (html && html.length > 100 && !isCountrySelection) {
              // التحقق من وجود بيانات المنتج
              const hasProductData = html.includes('product') || html.includes('price') || html.includes('data-testid') || html.includes('h1');
              if (hasProductData) {
                console.log(`✅ ScraperAPI (with ${fallbackCountry}) used for Trendyol (${html.length} chars)`);
                break; // نجح، توقف عن المحاولات
              } else {
                console.log(`⚠️ ScraperAPI (with ${fallbackCountry}) returned HTML but no product data`);
                html = '';
              }
            } else {
              console.log(`⚠️ ScraperAPI (with ${fallbackCountry}) returned country selection page or empty`);
              html = '';
            }
          } catch (retryError) {
            console.log(`⚠️ ScraperAPI retry with ${fallbackCountry} failed: ${retryError.message}`);
            if (retryError.response) {
              console.log(`   Status: ${retryError.response.status}`);
            }
            html = '';
          }
        }
      }
    }
    
    // محاولة جلب مباشر مع cookies محاكية (لاختيار البلد تلقائياً)
    if (!html || html.length < 100) {
      try {
        console.log(`🔍 Trying direct request with cookies for Trendyol...`);
        
        // إضافة cookies محاكية لاختيار البلد (تركيا بعد التحويل)
        const cookies = 'countryCode=TR; selectedCountry=TR; locale=tr-TR';
        
        const response = await axios.get(workingUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.trendyol.com/',
            'Cookie': cookies,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 20000,
          maxRedirects: 5,
        });
        html = response.data;
        
        if (html && html.length > 100) {
          const isCountrySelection = html.includes('Welcome to Trendyol') || 
                                     html.includes('Please select your country');
          
          if (!isCountrySelection) {
            console.log(`✅ Direct request with cookies succeeded for Trendyol (${html.length} chars)`);
          } else {
            console.log(`⚠️ Direct request still returned country selection page`);
            html = '';
          }
        }
      } catch (error) {
        console.log(`⚠️ Direct request failed: ${error.message}`);
        if (error.response) {
          console.log(`⚠️ Direct request status: ${error.response.status}`);
          if (error.response.status === 403) {
            console.log(`⚠️ Trendyol blocked direct request (403) - ScraperAPI recommended`);
          }
        }
      }
    }

    // التحقق من أن الصفحة ليست صفحة اختيار البلد
    if (html && html.length > 100) {
      const isCountrySelection = html.includes('Welcome to Trendyol') || 
                                 html.includes('Please select your country') ||
                                 html.includes('country-selection') ||
                                 html.includes('country-select-container');
      
      if (isCountrySelection) {
        console.log(`⚠️ Trendyol returned country selection page - this is a known issue`);
        throw new Error('Trendyol يتطلب اختيار البلد أولاً. المشكلة: ScraperAPI يجلب صفحة اختيار البلد بدلاً من صفحة المنتج. يرجى المحاولة من خلال المتصفح أو استخدام طريقة أخرى.');
      }
    }
    
    if (!html || typeof html !== 'string' || html.length < 100) {
      // رسالة خطأ واضحة مع إرشادات
      if (!scraperAPIKey) {
        throw new Error('Trendyol محمي ولا يمكن جلب المنتجات مباشرة. يرجى إضافة ScraperAPI key من صفحة الإعدادات');
      } else {
        throw new Error('فشل في جلب محتوى الصفحة من Trendyol. قد يكون الموقع محمياً أو الرابط غير صحيح');
      }
    }

    const $ = cheerio.load(html);
    
    // Debug: طباعة معلومات HTML للتحليل
    console.log(`📄 HTML loaded: ${html.length} characters`);
    console.log(`📄 Title tag: ${$('title').text().substring(0, 100)}`);
    
    // ========== جلب الاسم (Name) - أولوية عالية ==========
    let name = '';
    
    // محاولات متعددة بترتيب الأولوية لـ Trendyol
    const nameSelectors = [
      'h1[class*="product-name"]',
      'h1[class*="ProductName"]',
      'h1[class*="product-title"]',
      'h1[class*="ProductTitle"]',
      '.product-name h1',
      '.product-title h1',
      'h1',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title',
    ];
    
    for (const selector of nameSelectors) {
      if (selector.includes('meta')) {
        name = $(selector).attr('content')?.trim();
      } else {
        name = $(selector).first().text().trim();
      }
      
      if (name && name.length > 5) {
        // تنظيف الاسم من أي نصوص إضافية
        name = name.replace(/\s+/g, ' ').trim();
        // إزالة "Trendyol" من البداية إذا كان موجوداً
        name = name.replace(/^Trendyol\s*[-–]\s*/i, '').trim();
        // إزالة "تسوق" من البداية
        name = name.replace(/^تسوق\s+/i, '').trim();
        // إزالة "في السعودية" من النهاية
        name = name.replace(/\s+في\s+السعودية.*$/i, '').trim();
        name = name.replace(/\s+أونلاين.*$/i, '').trim();
        // إزالة "Buy" من البداية
        name = name.replace(/^buy\s+/i, '').trim();
        if (name.length > 5) break;
      }
    }
    
    // البحث في JSON-LD (Trendyol يستخدم JSON-LD)
    if (!name || name.length < 5) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            // محاولات مختلفة
            if (jsonData.name) {
              name = jsonData.name;
            } else if (jsonData['@graph']) {
              const product = jsonData['@graph'].find(item => item['@type'] === 'Product');
              if (product && product.name) {
                name = product.name;
              }
            } else if (Array.isArray(jsonData)) {
              const product = jsonData.find(item => item['@type'] === 'Product');
              if (product && product.name) {
                name = product.name;
              }
            }
            
            if (name && name.length > 5) break;
          } catch (e) {
            // continue
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    // ========== جلب السعر (Price) - أولوية عالية ==========
    let price = 0;
    let priceText = '';
    
    // Debug: البحث عن أي عناصر قد تحتوي على السعر
    console.log(`🔍 Searching for price elements...`);
    const priceElementsCount = $('[class*="price"], [id*="price"], [data-testid*="price"]').length;
    console.log(`🔍 Found ${priceElementsCount} potential price elements`);
    
    // محاولات متعددة بترتيب الأولوية لـ Trendyol
    const priceSelectors = [
      '[data-testid="sale-price"]',           // Trendyol الرئيسي - السعر المرئي
      '[data-testid="price-section"]',
      '[data-testid="price"]',
      '[data-testid="product-price"]',
      '[data-testid="price-current"]',
      '[data-testid="price-now"]',
      '[data-testid="selling-price"]',
      '.p-sale-price-wrapper',
      '.p-price-section',
      '.p-sale-price',
      '.pr-new-br',
      '.pr-bx-w',
      '[itemprop="price"]',
      '[itemprop="lowPrice"]',
      '[class*="price-now"]',
      '[class*="current-price"]',
      '[class*="sale-price"]',
      '[class*="selling-price"]',
      '[class*="prc-dsc"]',
      '[class*="pr-bx"]',
      '[id*="price"]',
      '[id*="Price"]',
    ];
    
    // البحث في جميع العناصر التي تحتوي على "SAR" أو "ريال" (مثل Noon)
    if (price === 0) {
      $('*').each((i, el) => {
        const text = $(el).text().trim();
        // تجنب النصوص التي تحتوي على "كوبون" أو "تأخر"
        if (text.toLowerCase().includes('كوبون') || 
            text.toLowerCase().includes('coupon') ||
            text.toLowerCase().includes('تأخر') ||
            text.toLowerCase().includes('delay')) {
          return;
        }
        
        if (text.includes('SAR') || text.includes('ريال') || text.includes('ر.س')) {
          // استخراج السعر: 34,43 SAR -> 34.43 أو 93,83 SAR -> 93.83 أو 265 SAR -> 265
          // البحث عن نمط: رقم + فاصلة + رقمين + SAR أو رقم + SAR
          const priceMatch = text.match(/(\d+)[,\.](\d+)\s*(SAR|ريال|ر\.س)/) || 
                           text.match(/(\d+)\s*(SAR|ريال|ر\.س)/);
          if (priceMatch) {
            let priceStr = '';
            if (priceMatch[1] && priceMatch[2]) {
              // 34,43 SAR -> 34.43
              priceStr = priceMatch[1] + '.' + priceMatch[2];
            } else if (priceMatch[1]) {
              // 265 SAR -> 265
              priceStr = priceMatch[1];
            }
            
            if (priceStr) {
              const foundPrice = parseFloat(priceStr);
              // نطاق منطقي: 5-100000 (يشمل 34.43)
              if (!isNaN(foundPrice) && foundPrice >= 5 && foundPrice < 100000) {
                price = foundPrice;
                console.log(`✅ Price from text search (first pass): ${price} SAR`);
                return false; // break
              }
            }
          }
        }
      });
    }
    
    for (const selector of priceSelectors) {
      if (price > 0) break; // إذا وجدنا سعر، نتوقف
      
      const priceElements = $(selector);
      priceElements.each((i, el) => {
        if (price > 0) return; // إذا وجدنا سعر، نتوقف
        
        // محاولة data attribute أولاً
        priceText = $(el).attr('content') ||
                     $(el).attr('data-price') ||
                     $(el).attr('data-value') ||
                     $(el).attr('value') ||
                     $(el).data('price') ||
                     $(el).data('value') ||
                     $(el).text().trim();
        
        if (priceText) {
          // تجنب النصوص التي تحتوي على "كوبون" أو "تأخر"
          if (priceText.toLowerCase().includes('كوبون') || 
              priceText.toLowerCase().includes('coupon') ||
              priceText.toLowerCase().includes('تأخر') ||
              priceText.toLowerCase().includes('delay')) {
            return;
          }
          
          // البحث عن نمط السعر مع SAR أو بدون
          // 34,43 SAR أو 34.43 SAR أو 34,43 أو 34.43
          const priceMatch = priceText.match(/(\d+)[,\.](\d{1,2})\s*(SAR|ريال|ر\.س)?/i) ||
                           priceText.match(/(\d+)\s*(SAR|ريال|ر\.س)/i);
          
          if (priceMatch) {
            let priceStr = '';
            if (priceMatch[1] && priceMatch[2] && priceMatch[2].length <= 2) {
              // 34,43 -> 34.43
              priceStr = priceMatch[1] + '.' + priceMatch[2];
            } else if (priceMatch[1]) {
              // 265 -> 265
              priceStr = priceMatch[1];
            }
            
            if (priceStr) {
              const extractedPrice = parseFloat(priceStr);
              if (!isNaN(extractedPrice) && extractedPrice >= 5 && extractedPrice < 100000) {
                price = extractedPrice;
                console.log(`✅ Price from selector ${selector}: ${price} SAR`);
                return false; // break
              }
            }
          }
          
          // إذا لم نجد، نحاول تنظيف النص والبحث عن أي رقم
          let cleanPrice = priceText.toString().replace(/[^\d.,]/g, '').trim();
          
          // معالجة الفاصلة: 34,43 -> 34.43 أو 265,00 -> 265.00
          if (cleanPrice.includes(',')) {
            const parts = cleanPrice.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
              // فاصلة عشرية: 34,43 -> 34.43
              cleanPrice = parts[0] + '.' + parts[1];
            } else {
              // فاصل آلاف: 1,265 -> 1265
              cleanPrice = cleanPrice.replace(/,/g, '');
            }
          } else {
            cleanPrice = cleanPrice.replace(/,/g, '');
          }
          
          const priceMatch2 = cleanPrice.match(/[\d]+\.?\d*/);
          if (priceMatch2) {
            const extractedPrice = parseFloat(priceMatch2[0]);
            if (extractedPrice > 0 && extractedPrice >= 5 && extractedPrice < 100000) {
              price = extractedPrice;
              console.log(`✅ Price from selector ${selector} (cleaned): ${price} SAR`);
              return false; // break
            }
          }
        }
      });
      
      if (price > 0) break;
    }
    
    // البحث في JSON-LD
    if (price === 0) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            // محاولات مختلفة
            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers) && jsonData.offers[0]?.price) {
                price = parseFloat(jsonData.offers[0].price);
              } else if (jsonData.offers.price) {
                price = parseFloat(jsonData.offers.price);
              } else if (jsonData.offers.lowPrice) {
                price = parseFloat(jsonData.offers.lowPrice);
              }
            }
            
            if (jsonData.price) {
              price = parseFloat(jsonData.price);
            }
            
            // البحث في @graph
            if (price === 0 && jsonData['@graph']) {
              const product = jsonData['@graph'].find(item => item['@type'] === 'Product');
              if (product && product.offers) {
                if (Array.isArray(product.offers) && product.offers[0]?.price) {
                  price = parseFloat(product.offers[0].price);
                } else if (product.offers.price) {
                  price = parseFloat(product.offers.price);
                } else if (product.offers.lowPrice) {
                  price = parseFloat(product.offers.lowPrice);
                }
              }
            }
            
            if (price > 0) break;
          } catch (e) {
            // continue
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    // محاولة من Meta tags
    if (price === 0) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        const metaPriceNum = parseFloat(metaPrice);
        if (metaPriceNum > 0 && metaPriceNum >= 5 && metaPriceNum < 100000) {
          price = metaPriceNum;
          console.log(`✅ Price from meta tag: ${price}`);
        }
      }
    }
    
    // محاولة استخراج من JavaScript/JSON في scripts (Trendyol يستخدم Next.js)
    if (price === 0) {
      try {
        const scripts = $('script').toArray();
        for (const script of scripts) {
          const scriptText = $(script).html() || $(script).text() || '';
          
          // البحث عن window.__NEXT_DATA__ أو __NEXT_DATA__
          if (scriptText.includes('__NEXT_DATA__') || scriptText.includes('productPrice') || scriptText.includes('price')) {
            try {
              // محاولة استخراج JSON من script
              const jsonMatch = scriptText.match(/__NEXT_DATA__\s*=\s*({.+?});/s) ||
                               scriptText.match(/window\.__NEXT_DATA__\s*=\s*({.+?});/s) ||
                               scriptText.match(/({[\s\S]*"price"[\s\S]*?})/);
              
              if (jsonMatch && jsonMatch[1]) {
                try {
                  const jsonData = JSON.parse(jsonMatch[1]);
                  // البحث في JSON عن السعر
                  const findPriceInObject = (obj, path = '') => {
                    if (!obj || typeof obj !== 'object') return null;
                    
                    for (const key in obj) {
                      const currentPath = path ? `${path}.${key}` : key;
                      const value = obj[key];
                      
                      // إذا وجدنا price
                      if (key.toLowerCase().includes('price') && typeof value === 'number' && value > 0) {
                        return value;
                      }
                      
                      // إذا وجدنا salePrice أو currentPrice
                      if ((key.toLowerCase().includes('saleprice') || 
                           key.toLowerCase().includes('currentprice') ||
                           key.toLowerCase().includes('sellingprice')) && 
                          typeof value === 'number' && value > 0) {
                        return value;
                      }
                      
                      // إذا كان offers وبه price
                      if (key === 'offers' && value) {
                        if (Array.isArray(value) && value[0]?.price) {
                          return parseFloat(value[0].price);
                        } else if (value.price) {
                          return parseFloat(value.price);
                        }
                      }
                      
                      // البحث بشكل عميق
                      if (typeof value === 'object' && value !== null) {
                        const found = findPriceInObject(value, currentPath);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  
                  const foundPrice = findPriceInObject(jsonData);
                  if (foundPrice && foundPrice >= 5 && foundPrice < 100000) {
                    price = foundPrice;
                    console.log(`✅ Price from JavaScript JSON: ${price}`);
                    break;
                  }
                } catch (e) {
                  // continue
                }
              }
              
              // البحث المباشر عن أنماط السعر في النص
              const pricePatterns = [
                /"price"\s*:\s*(\d+\.?\d*)/i,
                /"salePrice"\s*:\s*(\d+\.?\d*)/i,
                /"currentPrice"\s*:\s*(\d+\.?\d*)/i,
                /"sellingPrice"\s*:\s*(\d+\.?\d*)/i,
                /price["']?\s*:\s*(\d+\.?\d*)/i,
              ];
              
              for (const pattern of pricePatterns) {
                const match = scriptText.match(pattern);
                if (match && match[1]) {
                  const foundPrice = parseFloat(match[1]);
                  if (!isNaN(foundPrice) && foundPrice >= 5 && foundPrice < 100000) {
                    price = foundPrice;
                    console.log(`✅ Price from JavaScript pattern: ${price}`);
                    break;
                  }
                }
              }
              
              if (price > 0) break;
            } catch (e) {
              // continue
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    // محاولة أخيرة: البحث في جميع النصوص عن أي رقم معقول (5-10000)
    if (price === 0) {
      const allText = $('body').text();
      const allScriptsText = $('script').toArray().map(s => $(s).html() || '').join(' ');
      const combinedText = allText + ' ' + allScriptsText;
      
      // Debug: البحث عن "34" أو "43" أو "SAR" في النص
      if (combinedText.includes('34') || combinedText.includes('SAR')) {
        console.log(`🔍 Found '34' or 'SAR' in text, searching for prices...`);
        // البحث المباشر عن "34,43" أو "34.43"
        const allDecimals = [...combinedText.matchAll(/(\d+)[,\.](\d{1,2})/g)];
        console.log(`🔍 Found ${allDecimals.length} decimal numbers. First 5:`, allDecimals.slice(0, 5).map(m => m[0]));
        
        // البحث عن "34" و "43" بالقرب من بعضهما
        const pattern34_43 = /34[^\d]{0,5}43/;
        if (pattern34_43.test(combinedText)) {
          console.log(`🔍 Found "34" and "43" near each other!`);
        }
      }
      
      // البحث عن أرقام مع SAR أو ريال - نمط محسّن للتعامل مع 34,43
      // نحاول أنماط أكثر مرونة: نبحث عن أي رقم عشرية بالقرب من SAR
      const pricePatterns = [
        // نمط مباشر: رقم,رقم SAR
        /(\d+)[,\.](\d{1,2})\s*(SAR|ريال|ر\.س)/gi,  // 34,43 SAR أو 34.43 SAR
        // نمط عكس: SAR رقم,رقم
        /(SAR|ريال|ر\.س)\s*(\d+)[,\.](\d{1,2})/gi,  // SAR 34,43 (عكس الترتيب)
        // نمط بسيط: رقم SAR
        /(\d+)\s*(SAR|ريال|ر\.س)/gi,                  // 265 SAR
        // نمط مرن: رقم,رقم مع مسافات قبل SAR (حتى 100 حرف)
        /(\d+)[,\.](\d{1,2})(?:[\s\S]{0,100}?)(SAR|ريال|ر\.س)/gi,
        // نمط مرن: SAR مع مسافات قبل رقم,رقم (حتى 100 حرف)
        /(SAR|ريال|ر\.س)(?:[\s\S]{0,100}?)(\d+)[,\.](\d{1,2})/gi,
      ];
      
      // أيضاً: البحث عن أي رقم في نطاق 5-10000 بالقرب من SAR (حتى 200 حرف)
      const flexiblePattern = /(\d+)[,\.](\d{1,2})(?:[^\d]{0,200}?)(SAR|ريال|ر\.س)/gi;
      const allFlexibleMatches = [...combinedText.matchAll(flexiblePattern)];
      console.log(`🔍 Flexible pattern found ${allFlexibleMatches.length} matches`);
      
      const validPrices = [];
      
      // معالجة flexiblePattern matches أيضاً
      for (const match of allFlexibleMatches) {
        const context = match[0] + (match.input?.substring(Math.max(0, match.index - 30), match.index + 30) || '');
        if (context.toLowerCase().includes('كوبون') || 
            context.toLowerCase().includes('coupon') ||
            context.toLowerCase().includes('تأخر') ||
            context.toLowerCase().includes('delay')) {
          continue;
        }
        
        if (match[1] && match[2] && match[2].length <= 2) {
          const priceStr = match[1] + '.' + match[2];
          const foundPrice = parseFloat(priceStr);
          if (!isNaN(foundPrice) && foundPrice >= 5 && foundPrice <= 10000) {
            validPrices.push(foundPrice);
            console.log(`🔍 Found candidate price from flexible: ${foundPrice} SAR`);
          }
        }
      }
      
      for (const pattern of pricePatterns) {
        const allPriceMatches = [...combinedText.matchAll(pattern)];
        
        for (const match of allPriceMatches) {
          // تجنب النصوص التي تحتوي على "كوبون" أو "تأخر" في السياق
          const context = match[0] + (match.input?.substring(Math.max(0, match.index - 30), match.index + 30) || '');
          if (context.toLowerCase().includes('كوبون') || 
              context.toLowerCase().includes('coupon') ||
              context.toLowerCase().includes('تأخر') ||
              context.toLowerCase().includes('delay')) {
            continue;
          }
          
          let priceStr = '';
          // معالجة الأنماط المختلفة
          if (match[1] === 'SAR' || match[1] === 'ريال' || match[1] === 'ر.س') {
            // SAR 34,43
            if (match[2] && match[3] && match[3].length <= 2) {
              priceStr = match[2] + '.' + match[3];
            } else if (match[2]) {
              priceStr = match[2];
            }
          } else if (match[1] && match[2] && match[2].length <= 2) {
            // 34,43 SAR -> 34.43
            priceStr = match[1] + '.' + match[2];
          } else if (match[1]) {
            // 265 SAR -> 265
            priceStr = match[1];
          }
          
          if (priceStr) {
            const foundPrice = parseFloat(priceStr);
            // نطاق منطقي لـ Trendyol: 5-10000 SAR (يشمل 34.43)
            if (!isNaN(foundPrice) && foundPrice >= 5 && foundPrice <= 10000) {
              validPrices.push(foundPrice);
              console.log(`🔍 Found candidate price: ${foundPrice} SAR from: "${match[0]}"`);
            }
          }
        }
      }
      
      if (validPrices.length > 0) {
        // نأخذ السعر الأصغر (عادة هو السعر الحالي)
        validPrices.sort((a, b) => a - b);
        price = validPrices[0];
        console.log(`✅ Price from text search: ${price} SAR (found ${validPrices.length} prices, selected smallest)`);
      } else {
        console.log(`⚠️ No valid prices found in text search. HTML length: ${html.length}`);
        
        // محاولة أخيرة: البحث عن أرقام في عناصر محددة (product price sections)
        const priceContainers = $('[class*="price"], [id*="price"], [class*="Price"], [id*="Price"]');
        const candidatePrices = [];
        
        priceContainers.each((i, el) => {
          const text = $(el).text().trim();
          // البحث عن أي رقم في النطاق المعقول
          const numbers = text.match(/(\d+)[,\.](\d{1,2})/g) || text.match(/(\d+)/g);
          if (numbers) {
            for (const numStr of numbers) {
              let cleanNum = numStr.replace(/[,\.]/g, '');
              if (numStr.includes(',') && numStr.split(',')[1].length <= 2) {
                cleanNum = numStr.replace(',', '.');
              }
              const num = parseFloat(cleanNum);
              if (!isNaN(num) && num >= 5 && num <= 10000) {
                // تجنب إذا كان في سياق كوبون أو خصم
                if (!text.toLowerCase().includes('كوبون') && 
                    !text.toLowerCase().includes('coupon') &&
                    !text.toLowerCase().includes('خصم') &&
                    !text.toLowerCase().includes('discount')) {
                  candidatePrices.push(num);
                }
              }
            }
          }
        });
        
        if (candidatePrices.length > 0) {
          candidatePrices.sort((a, b) => a - b);
          price = candidatePrices[0];
          console.log(`✅ Price from price containers: ${price} SAR (found ${candidatePrices.length} candidates)`);
        }
      }
    }
    
    // تنظيف السعر - إزالة الهامش الصغير
    if (price > 0) {
      // إذا كان السعر ينتهي بـ .01 أو .1 أو قريب منها، نقربه لرقم صحيح
      const decimal = price % 1;
      if (decimal > 0 && decimal < 0.02) {
        // إذا كان الرقم العشري أقل من 0.02 (مثل .01)، نجعل السعر صحيح
        price = Math.floor(price);
      } else {
        // خلاف ذلك، نقرب لرقمين عشريين فقط
        price = Math.round(price * 100) / 100;
        // إذا كان الرقم العشري صغير جداً (مثل .0001)، نجعل السعر صحيح
        if (price % 1 < 0.01) {
          price = Math.round(price);
        }
      }
    }
    
    // ========== جلب الصورة (Image) - استخدام النظام البسيط ==========
    let image = '';
    
    // النظام البسيط والسريع (مثل Noon)
    image = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('img[itemprop="image"]').attr('src') ||
            $('[data-testid="product-image"]').attr('src');
    
    // Clean image URL (نفس الكود)
    if (image && !image.startsWith('http')) {
      try {
        if (image.startsWith('//')) {
          image = 'https:' + image;
        } else if (image.startsWith('/')) {
          image = urlObj.origin + image;
        }
      } catch (e) {
        // Keep original
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Trendyol scraper completed in ${duration}ms`);
    
    // التحقق من البيانات الأساسية
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'لم يتم العثور على اسم المنتج',
        details: 'الرجاء التأكد من صحة الرابط',
      };
    }
    
    if (!price || price === 0) {
      return {
        success: false,
        error: 'لم يتم العثور على سعر المنتج',
        details: 'المنتج قد يكون غير متاح أو الرابط غير صحيح',
        suggestion: 'يرجى التحقق من رابط المنتج',
      };
    }
    
    // إرجاع النتيجة
    return {
      success: true,
      product: {
        name: name,
        price: price || 0,
        currency: 'SAR',
        image: image || '',
        store: 'trendyol',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'trendyol-scraper',
      },
    };
    
  } catch (error) {
    console.error('❌ Trendyol scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من Trendyol';
    let suggestion = null;
    
    if (error.message && error.message.includes('ScraperAPI key')) {
      errorMessage = 'Trendyol محمي ولا يمكن جلب المنتجات مباشرة';
      suggestion = 'يرجى إضافة ScraperAPI key من صفحة الإعدادات (الإعدادات > متقدم) أو من https://www.scraperapi.com/';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بـ Trendyol. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج من Trendyol';
        const scraperAPIKey = await getScraperAPIKey();
        if (!scraperAPIKey) {
          suggestion = 'يرجى إضافة ScraperAPI key من صفحة الإعدادات (الإعدادات > متقدم) للمساعدة في جلب المنتجات من Trendyol';
        } else {
          suggestion = 'يرجى التحقق من صحة الرابط أو المحاولة مرة أخرى لاحقاً';
        }
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم Trendyol. يرجى المحاولة لاحقاً.';
      }
    } else if (error.message && error.message.includes('فشل في جلب محتوى الصفحة')) {
      const scraperAPIKey = await getScraperAPIKey();
      if (!scraperAPIKey) {
        errorMessage = 'Trendyol محمي ولا يمكن جلب المنتجات مباشرة';
        suggestion = 'يرجى إضافة ScraperAPI key من صفحة الإعدادات (الإعدادات > متقدم) أو من https://www.scraperapi.com/';
      } else {
        errorMessage = 'فشل في جلب محتوى الصفحة من Trendyol';
        suggestion = 'يرجى التحقق من صحة ScraperAPI key أو الرابط';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
      suggestion: suggestion,
    };
  }
};
