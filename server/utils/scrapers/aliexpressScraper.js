import axios from 'axios';
import * as cheerio from 'cheerio';
import Settings from '../../models/Settings.js';

/**
 * AliExpress Scraper - مخصص ومحسّن لموقع علي إكسبريس
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 * يحول العملة تلقائياً إلى SAR
 */
export const scrapeAliExpress = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    let urlObj = new URL(url);
    let finalUrl = url;
    let html = '';
    let price = 0;
    let detectedCurrency = 'USD';
    
    // التحقق من الروابط القصيرة (a.aliexpress.com) - رفضها مباشرة مع رسالة واضحة
    // هذه الروابط عادة ما تكون من تطبيق AliExpress ولا تعمل بشكل صحيح
    if (urlObj.hostname === 'a.aliexpress.com' || urlObj.hostname.includes('a.aliexpress')) {
      return {
        success: false,
        error: 'الرابط المنسوخ من تطبيق AliExpress غير مدعوم',
        details: 'الرجاء استخدام رابط المنتج من متصفح الويب بدلاً من التطبيق',
        suggestion: 'افتح موقع AliExpress في المتصفح وانسخ رابط المنتج من شريط العنوان',
      };
    }
    
    // معالجة الروابط القصيرة (a.aliexpress.com) - تتبع redirect للحصول على الرابط الطويل (للمستقبل)
    if (false && (urlObj.hostname === 'a.aliexpress.com' || urlObj.hostname.includes('a.aliexpress'))) {
      try {
        console.log(`🔄 Following redirect for short link: ${url}`);
        
        // نهج محسّن: نستخدم axios مع maxRedirects ونتتبع redirects يدوياً إذا لزم الأمر
        let redirectUrl = url;
        let redirectCount = 0;
        const maxRedirects = 10;
        
        // محاولة تتبع redirects تلقائياً
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.aliexpress.com/',
          },
          timeout: 20000,
          maxRedirects: maxRedirects,
          validateStatus: (status) => status < 400 || status === 301 || status === 302 || status === 307 || status === 308,
        });
        
        // الحصول على الرابط النهائي بعد redirect
        // axios يقوم بتتبع redirects تلقائياً في response.request.path
        finalUrl = response.request.res?.responseUrl || 
                   response.request.responseURL ||
                   response.request.path ||
                   response.config?.url ||
                   url;
        
        // إذا كان response يحتوي على location header، نستخدمه
        if (response.headers?.location) {
          const location = response.headers.location;
          if (location.startsWith('http')) {
            finalUrl = location;
          } else if (location.startsWith('/')) {
            finalUrl = 'https://ar.aliexpress.com' + location;
          } else {
            finalUrl = 'https://ar.aliexpress.com/' + location;
          }
        }
        
        // محاولة استخراج الرابط من HTML إذا كان موجوداً (مثل meta refresh أو script redirect)
        if (response.data && typeof response.data === 'string') {
          // البحث عن redirect في meta refresh
          const metaRefreshMatch = response.data.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"]*url=([^"']+)/i);
          if (metaRefreshMatch && metaRefreshMatch[1]) {
            finalUrl = metaRefreshMatch[1].trim();
            if (!finalUrl.startsWith('http')) {
              finalUrl = 'https://ar.aliexpress.com' + (finalUrl.startsWith('/') ? '' : '/') + finalUrl;
            }
          }
          
          // البحث عن redirect في JavaScript
          const jsRedirectMatch = response.data.match(/window\.location\s*=\s*["']([^"']+)["']/i);
          if (jsRedirectMatch && jsRedirectMatch[1]) {
            const jsUrl = jsRedirectMatch[1].trim();
            if (jsUrl.startsWith('http')) {
              finalUrl = jsUrl;
            } else {
              finalUrl = 'https://ar.aliexpress.com' + (jsUrl.startsWith('/') ? '' : '/') + jsUrl;
            }
          }
          
          // استخدام HTML من redirect إذا كان كافياً
          if (response.data.length > 1000) {
            html = response.data;
            console.log(`✅ Using HTML from redirect (${html.length} chars)`);
            
            // محاولة استخراج السعر من HTML مباشرة قبل الانتظار
            try {
              const $redirect = cheerio.load(html);
              
              // البحث السريع عن السعر في HTML من redirect
              const redirectPriceSelectors = [
                '[data-pl="product-price"]',
                '.notranslate.price-current',
                '.price-current',
                '[itemprop="price"]',
                '[data-role="price"]',
              ];
              
              for (const selector of redirectPriceSelectors) {
                const priceText = $redirect(selector).first().text().trim() || 
                                 $redirect(selector).first().attr('content') ||
                                 $redirect(selector).first().attr('data-price') || '';
                if (priceText) {
                  const cleanPrice = priceText.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
                  const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
                  if (priceMatch) {
                    const foundPrice = parseFloat(priceMatch[0]);
                    const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
                    const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                    if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                      price = foundPrice;
                      console.log(`✅ Price found in redirect HTML: ${price}`);
                      break;
                    }
                  }
                }
              }
              
              // البحث في scripts داخل HTML من redirect
              if (price === 0) {
                const scripts = $redirect('script');
                for (let i = 0; i < scripts.length && i < 20; i++) {
                  const scriptText = $redirect(scripts[i]).html();
                  if (scriptText && scriptText.length > 100) {
                    // البحث عن window.runParams
                    const runParamsMatch = scriptText.match(/window\.runParams\s*=\s*(\{[\s\S]{0,50000}\});/i);
                    if (runParamsMatch && runParamsMatch[1]) {
                      try {
                        const runParams = JSON.parse(runParamsMatch[1]);
                        const findPrice = (obj, depth = 0) => {
                          if (depth > 10) return null;
                          if (typeof obj !== 'object' || obj === null) return null;
                          for (const key in obj) {
                            const value = obj[key];
                            if ((key.toLowerCase().includes('price') || key === 'skuPrice') && typeof value === 'number') {
                              const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10];
                              const isExcluded = excludedPrices.some(ex => Math.abs(value - ex) < 0.01);
                              if (value > 0.5 && value < 100000 && !isExcluded) {
                                return value;
                              }
                            }
                            if (typeof value === 'object') {
                              const found = findPrice(value, depth + 1);
                              if (found) return found;
                            }
                          }
                          return null;
                        };
                        const foundPrice = findPrice(runParams);
                        if (foundPrice) {
                          price = foundPrice;
                          console.log(`✅ Price found in runParams from redirect HTML: ${price}`);
                          break;
                        }
                      } catch (e) {
                        // continue
                      }
                    }
                    
                    // البحث عن patterns بسيطة
                    const pricePatterns = [
                      /"price"\s*:\s*"?([\d.]+)"?/i,
                      /"skuPrice"\s*:\s*"?([\d.]+)"?/i,
                      /window\.runParams\.skuPrice\s*=\s*([\d.]+)/i,
                    ];
                    for (const pattern of pricePatterns) {
                      const match = scriptText.match(pattern);
                      if (match && match[1]) {
                        const foundPrice = parseFloat(match[1]);
                        const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10];
                        const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                        if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                          price = foundPrice;
                          console.log(`✅ Price found in script pattern from redirect: ${price}`);
                          break;
                        }
                      }
                    }
                    if (price > 0) break;
                  }
                }
              }
            } catch (e) {
              console.log(`⚠️ Error extracting price from redirect HTML: ${e.message}`);
            }
          }
        }
        
        // تحديث urlObj للرابط النهائي
        try {
          urlObj = new URL(finalUrl);
        } catch (e) {
          console.log(`⚠️ Failed to parse final URL: ${finalUrl}, trying to fix...`);
          // محاولة إصلاح الرابط
          if (!finalUrl.startsWith('http')) {
            finalUrl = 'https://ar.aliexpress.com' + (finalUrl.startsWith('/') ? '' : '/') + finalUrl;
            try {
              urlObj = new URL(finalUrl);
            } catch (e2) {
              console.log(`⚠️ Still failed, using original URL`);
              urlObj = new URL(url);
              finalUrl = url;
            }
          }
        }
        
        console.log(`✅ Redirect completed: ${finalUrl.substring(0, 120)}...`);
        
        // استخراج السعر من الرابط النهائي مباشرة (من pdp_npi إذا كان موجود) - أولوية أولى
        try {
          const urlParams = new URLSearchParams(urlObj.search);
          const pdpNpi = urlParams.get('pdp_npi');
          if (pdpNpi) {
            const decoded = decodeURIComponent(pdpNpi);
            console.log(`🔍 Found pdp_npi in redirected URL: ${decoded.substring(0, 100)}...`);
            
            // الصيغة: 6@dis!SAR!47.72!13.77!!88.34!25.50
            // أو: 6@dis!USD!12.99!9.99!!...
            const parts = decoded.split('!');
            if (parts.length >= 3) {
              detectedCurrency = parts[1] || 'USD';
              const basePrice = parts[2];
              const salePrice = parts[3];
              
              // نستخدم سعر العرض إذا كان موجود، وإلا السعر الأساسي
              if (salePrice && salePrice !== '' && !isNaN(parseFloat(salePrice))) {
                price = parseFloat(salePrice);
                console.log(`✅ Price extracted from pdp_npi (sale price): ${price} ${detectedCurrency}`);
              } else if (basePrice && !isNaN(parseFloat(basePrice))) {
                price = parseFloat(basePrice);
                console.log(`✅ Price extracted from pdp_npi (base price): ${price} ${detectedCurrency}`);
              }
            }
          } else {
            console.log(`⚠️ No pdp_npi found in redirected URL`);
            // إذا لم نجد pdp_npi لكن حصلنا على السعر من HTML، نستخدمه
            if (price > 0) {
              console.log(`✅ Using price extracted from redirect HTML: ${price}`);
            }
          }
        } catch (e) {
          console.log(`⚠️ Error extracting price from pdp_npi: ${e.message}`);
        }
        
        // تحديث url للاستخدام في باقي الكود
        url = finalUrl;
        
      } catch (error) {
        console.log(`⚠️ Redirect failed: ${error.message}`);
        // في حالة الفشل، نستمر بالرابط الأصلي
      }
    }
    
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    // محاولة 1: جلب مباشر مع headers محسّنة لعلي إكسبريس (فقط إذا لم نحصل على HTML من redirect)
    if (!html || html.length < 100) {
      try {
        const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.aliexpress.com/',
          'Cache-Control': 'no-cache',
        },
        timeout: 10000, // 10 ثواني فقط
        maxRedirects: 5,
      });
      html = response.data;
      } catch (error) {
        console.log(`⚠️ Direct request failed: ${error.message}`);
      }
    }

    // محاولة 2: ScraperAPI فقط إذا لم نحصل على السعر من pdp_npi أو فشل الجلب المباشر
    const hasPdpNpiInUrl = urlObj.search.includes('pdp_npi');
    
    // إذا لم نحصل على السعر من pdp_npi أو من redirect HTML، نستخدم ScraperAPI مع render
    if (price === 0 && process.env.SCRAPERAPI_KEY) {
      try {
        if (!hasPdpNpiInUrl) {
          console.log(`🔄 Using ScraperAPI render for non-pdp_npi link (price requires JavaScript)`);
          
          // استخدام Promise.race لتجنب timeout طويل
          const scraperPromise = axios.get('http://api.scraperapi.com', {
            params: {
              api_key: process.env.SCRAPERAPI_KEY,
              url: cleanUrl,
              render: true,
              wait: 3000, // انتظار 3 ثواني
            },
            timeout: 25000, // timeout أقصر (25 ثانية)
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('ScraperAPI timeout')), 25000)
          );
          
          const response = await Promise.race([scraperPromise, timeoutPromise]);
          html = response.data;
          console.log(`✅ ScraperAPI render used for non-pdp_npi link (${html.length} chars)`);
        } else if (!html || html.length < 100) {
          // للروابط التي تحتوي على pdp_npi، نستخدم بدون render (أسرع)
          console.log(`🔄 Using ScraperAPI (without render) for pdp_npi link`);
          const response = await axios.get('http://api.scraperapi.com', {
            params: {
              api_key: process.env.SCRAPERAPI_KEY,
              url: cleanUrl,
              render: false,
            },
            timeout: 15000,
          });
          html = response.data;
          console.log(`✅ ScraperAPI used for AliExpress (without render)`);
        }
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
        // إذا فشل render، نحاول بدون render كـ fallback
        if (!html || html.length < 100) {
          try {
            const response = await axios.get('http://api.scraperapi.com', {
              params: {
                api_key: process.env.SCRAPERAPI_KEY,
                url: cleanUrl,
                render: false,
              },
              timeout: 15000,
            });
            html = response.data;
            console.log(`✅ ScraperAPI used without render as fallback`);
          } catch (e) {
            console.log(`⚠️ ScraperAPI fallback also failed: ${e.message}`);
          }
        }
      }
    }
    
    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // ========== جلب الاسم (Name) - أولوية عالية ==========
    let name = '';
    
    // محاولات متعددة بترتيب الأولوية لعلي إكسبريس
    const nameSelectors = [
      'h1[data-pl="product-title"]',           // علي إكسبريس الرئيسي
      '.product-title-text',                    // علي إكسبريس بديل
      '[itemprop="name"]',                      // Schema.org
      'h1.product-title',                      // علي إكسبريس class
      'h1[class*="product-title"]',            // علي إكسبريس عام
      'meta[property="og:title"]',            // Meta tag
      'meta[name="twitter:title"]',            // Twitter meta
      'title',                                  // العنوان العام
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
        // إزالة "AliExpress" من البداية إذا كان موجوداً
        name = name.replace(/^AliExpress\s*[-–]\s*/i, '').trim();
        break;
      }
    }
    
    // البحث في JSON-LD (علي إكسبريس يستخدم JSON-LD)
    if (!name || name.length < 5) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
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
    // إذا لم نحصل على السعر من redirect، نبحث في HTML
    let priceText = '';
    
    // محاولة 1: استخراج السعر من URL (علي إكسبريس يضع السعر في pdp_npi parameter)
    // فقط إذا لم نحصل عليه من redirect
    try {
      const urlParams = new URLSearchParams(urlObj.search);
      const pdpNpi = urlParams.get('pdp_npi');
      if (pdpNpi) {
        const decoded = decodeURIComponent(pdpNpi);
        // الصيغة: 6@dis!SAR!47.72!13.77!!88.34!25.50
        // أو: 6@dis!USD!12.99!9.99!!...
        const parts = decoded.split('!');
        if (parts.length >= 3) {
          // parts[1] = العملة (SAR, USD, etc.)
          // parts[2] = السعر الأساسي
          // parts[3] = سعر العرض (إن وجد)
          detectedCurrency = parts[1] || 'USD';
          const basePrice = parts[2];
          const salePrice = parts[3];
          
          // نستخدم سعر العرض إذا كان موجود، وإلا السعر الأساسي
          if (salePrice && salePrice !== '' && !isNaN(parseFloat(salePrice))) {
            price = parseFloat(salePrice);
          } else if (basePrice && !isNaN(parseFloat(basePrice))) {
            price = parseFloat(basePrice);
          }
          
          if (price > 0) {
            console.log(`✅ Price extracted from URL: ${price} ${detectedCurrency}`);
          }
        }
      }
    } catch (e) {
      // ignore
    }
    
    // محاولات متعددة بترتيب الأولوية لعلي إكسبريس
    // للروابط بدون pdp_npi، نبحث بشكل أكثر شمولاً
    const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
    
    const priceSelectors = [
      // علي إكسبريس selectors محددة
      '[data-pl="product-price"]',               // علي إكسبريس data attribute
      '.notranslate.price-current',              // علي إكسبريس بديل
      '.price-current',                          // علي إكسبريس سعر
      '[class*="price-current"]',                // علي إكسبريس class
      '.product-price-value',                    // علي إكسبريس price value
      '.price-current .price',                  // علي إكسبريس nested price
      '[data-role="price"]',                     // علي إكسبريس data role
      '.sku-price',                              // علي إكسبريس SKU price
      '[itemprop="price"]',                     // Schema.org price
      '[itemprop="price"] .notranslate',        // Schema.org price with notranslate
      '.price',                                  // علي إكسبريس عام
      '[data-spm-anchor-id] .price',            // علي إكسبريس price container
      // البحث في spans و divs التي تحتوي على سعر
      'span[class*="price"]',                    // أي span يحتوي على price
      'div[class*="price"]',                     // أي div يحتوي على price
      // selectors إضافية للروابط بدون pdp_npi
      '[data-product-id] .price',               // سعر داخل product container
      '.product-price',                         // product price
      '.product-price-current',                 // product price current
      '[class*="notranslate"][class*="price"]', // notranslate price
    ];
    
    for (const selector of priceSelectors) {
      try {
        // محاولة content attribute أولاً (Schema.org)
        priceText = $(selector).first().attr('content') ||
                     $(selector).first().attr('data-price') ||
                     $(selector).first().attr('data-role') ||
                     $(selector).first().attr('data-amount') ||
                     $(selector).first().text().trim();
        
        if (priceText) {
          // تنظيف السعر
          let cleanPrice = priceText.toString().replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
          
          // تحويل الأرقام العربية إلى إنجليزية
          const arabicToEnglish = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
          };
          cleanPrice = cleanPrice.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
          
          const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[0]);
            const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
            
            // التأكد أن السعر منطقي وغير مستبعد
            if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
              price = foundPrice;
              console.log(`✅ Price found via selector "${selector}": ${price}`);
              break;
            }
          }
        }
      } catch (e) {
        // continue to next selector
      }
    }
    
    // البحث في جميع العناصر التي تحتوي على class="price" أو id="price"
    if (price === 0) {
      const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
      
      $('[class*="price"], [id*="price"], [data-price]').each((i, el) => {
        // محاولة data attributes أولاً
        const dataPrice = $(el).attr('data-price') || $(el).attr('data-amount') || $(el).attr('content');
        if (dataPrice) {
          const foundPrice = parseFloat(dataPrice.toString().replace(/[^\d.,]/g, '').replace(/,/g, ''));
          const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
          if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
            price = foundPrice;
            console.log(`✅ Price found in data attribute: ${price}`);
            return false; // break
          }
        }
        
        // ثم البحث في النص
        const text = $(el).text().trim();
        if (text) {
          const priceMatch = text.match(/([\d,]+\.?\d*)/);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
            if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
              price = foundPrice;
              console.log(`✅ Price found in text: ${price}`);
              return false; // break
            }
          }
        }
      });
    }
    
    // البحث في جميع العناصر التي تحتوي على "USD" أو "SAR" أو "ريال"
    if (price === 0) {
      const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
      
      // نركز على العناصر الأكثر احتمالاً (div, span, p, strong)
      $('div, span, p, strong, b, em').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 50 && (text.includes('USD') || text.includes('SAR') || text.includes('ريال') || text.includes('$'))) {
          // البحث عن سعر في النص
          const priceMatch = text.match(/([\d,]+\.?\d*)\s*(?:USD|SAR|ريال|\$|دولار)/i);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
            if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
              price = foundPrice;
              console.log(`✅ Price found with currency: ${price}`);
              return false; // break
            }
          }
        }
      });
    }
    
    // البحث في JSON-LD
    if (price === 0) {
      const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
      
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            // محاولات مختلفة
            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers) && jsonData.offers[0]?.price) {
                const foundPrice = parseFloat(jsonData.offers[0].price);
                const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                  price = foundPrice;
                  if (jsonData.offers[0].priceCurrency) {
                    detectedCurrency = jsonData.offers[0].priceCurrency;
                  }
                }
              } else if (jsonData.offers.price) {
                const foundPrice = parseFloat(jsonData.offers.price);
                const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                  price = foundPrice;
                  if (jsonData.offers.priceCurrency) {
                    detectedCurrency = jsonData.offers.priceCurrency;
                  }
                }
              } else if (jsonData.offers.lowPrice) {
                const foundPrice = parseFloat(jsonData.offers.lowPrice);
                const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                  price = foundPrice;
                }
              }
            }
            
            if (price === 0 && jsonData.price) {
              const foundPrice = parseFloat(jsonData.price);
              const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
              if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                price = foundPrice;
                if (jsonData.priceCurrency) {
                  detectedCurrency = jsonData.priceCurrency;
                }
              }
            }
            
            // البحث في @graph
            if (price === 0 && jsonData['@graph']) {
              const product = jsonData['@graph'].find(item => item['@type'] === 'Product');
              if (product && product.offers) {
                if (Array.isArray(product.offers) && product.offers[0]?.price) {
                  const foundPrice = parseFloat(product.offers[0].price);
                  const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                  if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                    price = foundPrice;
                    if (product.offers[0].priceCurrency) {
                      detectedCurrency = product.offers[0].priceCurrency;
                    }
                  }
                } else if (product.offers.price) {
                  const foundPrice = parseFloat(product.offers.price);
                  const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                  if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                    price = foundPrice;
                    if (product.offers.priceCurrency) {
                      detectedCurrency = product.offers.priceCurrency;
                    }
                  }
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
    
    // البحث في scripts (علي إكسبريس يحمل السعر في scripts)
    // للروابط بدون pdp_npi، نبحث بشكل أكثر شمولاً
    if (price === 0) {
      const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
      
      try {
        const scripts = $('script');
        for (let i = 0; i < scripts.length; i++) {
          const scriptText = $(scripts[i]).html();
          if (scriptText && scriptText.length > 50) {
            // البحث عن price في JSON (أنماط مختلفة)
            const pricePatterns = [
              // JSON patterns - أكثر تحديداً
              /"price"\s*:\s*"?([\d.]+)"?/i,
              /"priceValue"\s*:\s*"?([\d.]+)"?/i,
              /"currentPrice"\s*:\s*"?([\d.]+)"?/i,
              /"salePrice"\s*:\s*"?([\d.]+)"?/i,
              /"skuPrice"\s*:\s*"?([\d.]+)"?/i,
              /"priceAmount"\s*:\s*"?([\d.]+)"?/i,
              /"lowPrice"\s*:\s*"?([\d.]+)"?/i,
              /"highPrice"\s*:\s*"?([\d.]+)"?/i,
              /price["']?\s*[:=]\s*["']?([\d.]+)/i,
              // AliExpress specific patterns
              /window\.runParams\.skuPrice\s*=\s*([\d.]+)/i,
              /window\.runParams\.price\s*=\s*([\d.]+)/i,
              /runParams\.skuPrice\s*=\s*([\d.]+)/i,
              /runParams\.price\s*=\s*([\d.]+)/i,
              /skuPrice["']?\s*[:=]\s*["']?([\d.]+)/i,
            ];
            
            for (const pattern of pricePatterns) {
              const priceMatch = scriptText.match(pattern);
              if (priceMatch && priceMatch[1]) {
                const foundPrice = parseFloat(priceMatch[1]);
                const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                  price = foundPrice;
                  console.log(`✅ Price found in script pattern: ${price}`);
                  break;
                }
              }
            }
            
            if (price > 0) break;
            
            // البحث في JSON objects الكبيرة (علي إكسبريس يحمل بيانات المنتج في JSON كبير)
            // نمط أكثر شمولاً للبحث عن window.runParams
            try {
              // البحث عن window.runParams أو window.g_config أو data
              const patterns = [
                /window\.runParams\s*=\s*(\{[\s\S]{0,10000}\});/i,
                /window\.g_config\s*=\s*(\{[\s\S]{0,10000}\});/i,
                /window\.data\s*=\s*(\{[\s\S]{0,10000}\});/i,
                /runParams\s*=\s*(\{[\s\S]{0,10000}\});/i,
              ];
              
              const jsonStrings = [];
              for (const pattern of patterns) {
                const match = scriptText.match(pattern);
                if (match && match[1]) {
                  jsonStrings.push(match[1]);
                }
              }
              
              // البحث عن أي JSON objects كبيرة تحتوي على price
              const largeJsonMatches = scriptText.match(/\{[^{}]{0,2000}"price"[^{}]{0,2000}\}/g);
              if (largeJsonMatches) {
                jsonStrings.push(...largeJsonMatches.slice(0, 10)); // أول 10
              }
              
              // البحث عن JSON arrays تحتوي على price
              const arrayMatches = scriptText.match(/\[[^\]]{0,1000}"price"[^\]]{0,1000}\]/g);
              if (arrayMatches) {
                jsonStrings.push(...arrayMatches.slice(0, 5));
              }
              
              for (const jsonStr of jsonStrings) {
                try {
                  const jsonData = JSON.parse(jsonStr);
                  
                  // البحث بشكل متكرر في الكائن
                  const findPrice = (obj, depth = 0, path = '') => {
                    if (depth > 8) return null; // حد أقصى للعمق
                    if (typeof obj !== 'object' || obj === null) return null;
                    
                    for (const key in obj) {
                      const value = obj[key];
                      
                      // إذا كان المفتاح يحتوي على price
                      if (key.toLowerCase().includes('price') && typeof value === 'number') {
                        const isExcluded = excludedPrices.some(ex => Math.abs(value - ex) < 0.01);
                        if (value > 0.5 && value < 100000 && !isExcluded) {
                          console.log(`✅ Price found in JSON at ${path}.${key}: ${value}`);
                          return value;
                        }
                      }
                      
                      // إذا كانت القيمة رقم و المفتاح يشير لسعر
                      if (typeof value === 'number' && (key === 'price' || key === 'skuPrice' || key === 'salePrice' || key === 'currentPrice')) {
                        const isExcluded = excludedPrices.some(ex => Math.abs(value - ex) < 0.01);
                        if (value > 0.5 && value < 100000 && !isExcluded) {
                          console.log(`✅ Price found in JSON at ${path}.${key}: ${value}`);
                          return value;
                        }
                      }
                      
                      // البحث بشكل متكرر
                      if (typeof value === 'object') {
                        const found = findPrice(value, depth + 1, path ? `${path}.${key}` : key);
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
    
    // محاولة من Meta tags
    if (price === 0) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        price = parseFloat(metaPrice);
      }
    }
    
    // محاولة نهائية: البحث في جميع النصوص التي تحتوي على أرقام و $ أو USD أو SAR
    // للروابط التي لا تحتوي على pdp_npi، نبحث بشكل أكثر دقة لتجنب الأسعار الثابتة
    if (price === 0) {
      // قائمة الأسعار الثابتة/الخاطئة الشائعة التي يجب تجنبها
      const excludedPrices = [1, 2, 2.41, 3, 3.5, 4, 5, 10, 0.01, 0.1, 0.5];
      
      // البحث في جميع النصوص
      const allText = $.text();
      const pricePatterns = [
        /([\d,]+\.?\d*)\s*(?:USD|SAR|ريال|\$|دولار)/i,
        /\$\s*([\d,]+\.?\d*)/i,
        /(?:USD|SAR)\s*([\d,]+\.?\d*)/i,
        /([\d,]+\.?\d*)\s*(?:USD|SAR)/i,
      ];
      
      const foundPrices = [];
      for (const pattern of pricePatterns) {
        const matches = allText.match(new RegExp(pattern.source, 'gi'));
        if (matches) {
          for (const match of matches) {
            const priceMatch = match.match(/([\d,]+\.?\d*)/);
            if (priceMatch) {
              const foundPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
              // نتجنب الأسعار الثابتة/الخاطئة
              const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
              
              // نأخذ فقط الأسعار المنطقية (أكثر من 0.5 وأقل من 100000)
              // ونتجنب الأسعار الثابتة
              if (foundPrice > 0.5 && foundPrice < 100000 && !isExcluded) {
                foundPrices.push(foundPrice);
              }
            }
          }
        }
      }
      
      // نأخذ أكبر سعر منطقي (عادة السعر الأساسي)
      // لكن نتجنب الأسعار التي تبدو ثابتة (مثل 2.41)
      if (foundPrices.length > 0) {
        foundPrices.sort((a, b) => b - a); // ترتيب تنازلي
        
        // نأخذ أكبر سعر، لكن نتأكد أنه ليس من الأسعار الثابتة
        for (const foundPrice of foundPrices) {
          const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
          if (!isExcluded) {
            price = foundPrice;
            break;
          }
        }
        
        // إذا لم نجد سعر غير مستبعد، نأخذ الأكبر
        if (price === 0 && foundPrices.length > 0) {
          price = foundPrices[0];
        }
      }
    }
    
    
    
    // تنظيف السعر - إزالة أي هامش صغير
    if (price > 0) {
      const decimal = price % 1;
      if (decimal > 0 && decimal < 0.02) {
        price = Math.floor(price);
      } else {
        price = Math.round(price * 100) / 100;
        if (price % 1 < 0.01) {
          price = Math.round(price);
        }
      }
    }
    
    // ========== جلب الصورة (Image) - استخدام النظام البسيط ==========
    let image = '';
    
    // النظام البسيط - نفس الطريقة القديمة
    image = $('.images-view-item img').first().attr('src') ||
            $('[itemprop="image"]').attr('content') ||
            $('meta[property="og:image"]').attr('content');
    
    // إذا لم نجد، نبحث في data attributes
    if (!image || image.length < 10) {
      image = $('.images-view-item img').first().attr('data-src') ||
              $('.images-view-item img').first().attr('data-oss-lazy') ||
              $('[data-image-index] img').first().attr('src');
    }
    
    // Clean image URL
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
    
    // إزالة query parameters من الصورة للحصول على صورة عالية الجودة
    if (image && image.includes('?')) {
      // علي إكسبريس يستخدم query parameters للتعديل، نحتفظ بها
      // لكن نزيل أي parameters غير ضرورية
      const urlParts = image.split('?');
      if (urlParts[0]) {
        // نحتفظ بالـ URL الأساسي
        image = urlParts[0];
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`⚡ AliExpress scraper completed in ${duration}ms`);
    
    // التحقق من البيانات الأساسية
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'لم يتم العثور على اسم المنتج',
        details: 'الرجاء التأكد من صحة الرابط',
      };
    }
    
    // استخدام العملة المكتشفة من URL أو افتراض USD
    let finalCurrency = detectedCurrency || 'USD';
    let finalPrice = price || 0;
    
    // تحويل العملة تلقائياً إلى SAR (لأن السلة تتعامل بالريال السعودي فقط)
    if (finalPrice > 0 && finalCurrency !== 'SAR') {
      try {
        // محاولة الحصول على إعدادات قاعدة البيانات مع timeout قصير
        const settingsPromise = Settings.getSettings();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const settings = await Promise.race([settingsPromise, timeoutPromise]);
        const currencyRates = settings.pricing?.currencyRates || {};
        
        // الحصول على سعر الصرف
        const sourceRate = currencyRates[finalCurrency] || currencyRates.USD || 250; // USD to YER
        const sarRate = currencyRates.SAR || 67; // SAR to YER
        
        // التحويل: USD -> YER -> SAR
        // أو مباشرة: USD -> SAR (SAR/USD)
        if (finalCurrency === 'USD') {
          // USD to SAR: نستخدم معدل مباشر
          // 1 USD = ~3.75 SAR (تقريباً)
          const usdToSar = sarRate / (currencyRates.USD || 250);
          finalPrice = finalPrice * usdToSar;
          console.log(`✅ Converted ${price} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR`);
        } else {
          // عملات أخرى: عبر YER
          const priceInYER = finalPrice * sourceRate;
          finalPrice = priceInYER / sarRate;
          console.log(`✅ Converted ${price} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR`);
        }
        
        finalCurrency = 'SAR';
      } catch (e) {
        // في حالة الفشل (timeout أو خطأ)، نستخدم معدل افتراضي
        console.log(`⚠️ Using default exchange rate (DB timeout or error)`);
        if (finalCurrency === 'USD') {
          // معدل افتراضي: 1 USD = 3.75 SAR (تقريبي)
          finalPrice = finalPrice * 3.75;
          finalCurrency = 'SAR';
          console.log(`✅ Converted ${price} USD to ${finalPrice.toFixed(2)} SAR (default rate)`);
        } else {
          // لعملات أخرى، نحاول تحويل بسيط
          finalPrice = finalPrice * 3.75; // معدل تقريبي
          finalCurrency = 'SAR';
          console.log(`✅ Converted ${price} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR (default rate)`);
        }
      }
    }
    
    // تقريب السعر
    if (finalPrice > 0) {
      finalPrice = Math.round(finalPrice * 100) / 100;
    }
    
    // إرجاع النتيجة
    return {
      success: true,
      product: {
        name: name,
        price: finalPrice || 0,
        currency: finalCurrency, // دائماً SAR
        image: image || '',
        store: 'aliexpress',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'aliexpress-scraper',
        originalCurrency: detectedCurrency || 'USD',
        originalPrice: price || 0,
      },
    };
    
  } catch (error) {
    console.error('❌ AliExpress scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من علي إكسبريس';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بعلي إكسبريس. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم علي إكسبريس. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};

