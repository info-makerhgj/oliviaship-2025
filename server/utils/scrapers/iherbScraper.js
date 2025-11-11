import axios from 'axios';
import * as cheerio from 'cheerio';
import Settings from '../../models/Settings.js';

/**
 * iHerb Scraper - مخصص ومحسّن لموقع iHerb
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 * يحول العملة تلقائياً إلى SAR
 */
export const scrapeIHerb = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    let urlObj = new URL(url);
    let finalUrl = url;
    let html = '';
    let price = 0;
    let detectedCurrency = 'USD';
    
    // معالجة الروابط القصيرة (iherb.co فقط، وليس sa.iherb.com أو www.iherb.com)
    // الروابط القصيرة: iherb.co/KH6bDZCy (من التطبيق)
    // الروابط الطويلة: sa.iherb.com/pr/... أو www.iherb.com/pr/... (من المتصفح)
    const isShortLink = urlObj.hostname === 'iherb.co' || 
                       (urlObj.hostname.includes('iherb.co') && !urlObj.hostname.includes('sa.iherb') && !urlObj.hostname.includes('www.iherb'));
    
    if (isShortLink) {
      // رفض الروابط القصيرة من التطبيق - مثل ما فعلنا مع AliExpress
      // هذه الروابط عادة ما تكون من تطبيق iHerb ولا تعمل بشكل صحيح
      return {
        success: false,
        error: 'الرابط المنسوخ من تطبيق iHerb غير مدعوم',
        details: 'الرجاء استخدام رابط المنتج من متصفح الويب بدلاً من التطبيق',
        suggestion: 'افتح موقع iHerb في المتصفح وانسخ رابط المنتج من شريط العنوان',
      };
    }
    
    // الكود التالي للروابط الطويلة فقط (من المتصفح)
    if (false) { // تم إلغاء هذا الكود - نحن نرفض الروابط القصيرة
      console.log(`🔄 Short iHerb link detected, resolving redirects...`);
      
      // استراتيجية: تتبع redirects يدوياً للحصول على productId ثم بناء رابط المنتج
      let currentUrl = url;
      let productId = null;
      let finalProductUrl = null;
      
      // تتبع redirects يدوياً (حتى 5 redirects)
      for (let i = 0; i < 5; i++) {
        try {
          const response = await axios.get(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            maxRedirects: 0, // لا تتبع تلقائياً
            validateStatus: () => true, // قبول جميع الـ status codes
            timeout: 8000,
          });
          
          // إذا كان redirect (301, 302, 307, 308)
          if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
            const location = response.headers.location;
            if (location) {
              currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
              console.log(`   Redirect ${i + 1}: ${currentUrl.substring(0, 100)}...`);
              
              // استخراج productId من URL
              const productIdMatch = currentUrl.match(/productId=(\d+)/i) || 
                                    currentUrl.match(/\/pr\/[^\/]+\/(\d+)/i) ||
                                    currentUrl.match(/\/(\d+)(?:\?|$)/);
              
              if (productIdMatch && productIdMatch[1]) {
                productId = productIdMatch[1];
                console.log(`   ✅ Product ID extracted: ${productId}`);
                
                // إذا كان الرابط يحتوي على /pr/ فهو رابط المنتج الكامل
                if (currentUrl.includes('/pr/')) {
                  finalProductUrl = currentUrl;
                  // تنظيف الرابط من query parameters غير الضرورية
                  try {
                    const urlObj2 = new URL(currentUrl);
                    finalProductUrl = urlObj2.origin + urlObj2.pathname;
                    console.log(`   ✅ Final product URL: ${finalProductUrl.substring(0, 100)}...`);
                    break;
                  } catch (e) {
                    finalProductUrl = currentUrl;
                    break;
                  }
                }
              }
              continue;
            }
          }
          
          // إذا وصلنا لـ 200 OK
          if (response.status === 200 && response.data) {
            // محاولة استخراج productId من HTML
            const htmlData = response.data;
            const productIdMatch = htmlData.match(/productId['"\\s:=]+(\d+)/i);
            if (productIdMatch) {
              productId = productIdMatch[1];
              console.log(`   ✅ Product ID from HTML: ${productId}`);
            }
            
            // محاولة استخراج رابط المنتج من HTML
            const urlMatch = htmlData.match(/https?:\/\/[^\s"']*iherb\.com\/pr\/[^\s"']*/i);
            if (urlMatch) {
              finalProductUrl = urlMatch[0].split('?')[0].split('#')[0]; // تنظيف من query params
              console.log(`   ✅ Product URL from HTML: ${finalProductUrl.substring(0, 100)}...`);
              break;
            }
          }
          
          // إذا كان 403، توقف (موقع محمي)
          if (response.status === 403 || response.status === 401) {
            console.log(`   ⚠️ Site protected (${response.status}), but we have productId: ${productId}`);
            break;
          }
          
          break;
        } catch (error) {
          console.log(`   ⚠️ Redirect step ${i + 1} failed: ${error.message}`);
          break;
        }
      }
      
      // إذا حصلنا على productId أو finalProductUrl، نستخدمه
      if (finalProductUrl) {
        finalUrl = finalProductUrl;
        try {
          urlObj = new URL(finalUrl);
          url = finalUrl;
          console.log(`✅ Using resolved product URL: ${finalUrl.substring(0, 100)}...`);
        } catch (e) {
          console.log(`⚠️ Failed to parse final URL`);
        }
      } else if (productId) {
        // إذا لم نحصل على رابط كامل لكن حصلنا على productId، نحاول بناء رابط بسيط
        // لكن هذا قد لا يعمل دائماً، لذا نستخدم ScraperAPI
        console.log(`✅ Have productId: ${productId}, will use with ScraperAPI`);
      }
      
      // الآن نستخدم ScraperAPI للرابط النهائي (أو الأصلي إذا لم نحصل على رابط نهائي)
      const urlToScrape = finalUrl || url;
      
      if (process.env.SCRAPERAPI_KEY) {
        try {
          console.log(`🔄 Using ScraperAPI for resolved URL...`);
          const apiResponse = await axios.get('http://api.scraperapi.com', {
            params: {
              api_key: process.env.SCRAPERAPI_KEY,
              url: urlToScrape,
              render: false, // بدون render أسرع (لأننا حصلنا على رابط المنتج)
            },
            timeout: 15000,
            maxRedirects: 5,
          });
          
          if (apiResponse.data && typeof apiResponse.data === 'string' && apiResponse.data.length > 1000) {
            html = apiResponse.data;
            console.log(`✅ Got HTML from ScraperAPI (${html.length} chars)`);
            
            // تحديث finalUrl من ScraperAPI response
            const apiFinalUrl = apiResponse.request.res?.responseURL || 
                               apiResponse.request.responseURL ||
                               urlToScrape;
            if (apiFinalUrl && apiFinalUrl.includes('iherb.com')) {
              finalUrl = apiFinalUrl.split('?')[0].split('#')[0]; // تنظيف
              try {
                urlObj = new URL(finalUrl);
                url = finalUrl;
              } catch (e) {
                // ignore
              }
            }
          } else {
            throw new Error('ScraperAPI returned empty HTML');
          }
        } catch (apiError) {
          console.log(`⚠️ ScraperAPI failed: ${apiError.message}`);
          // إذا فشل ScraperAPI بدون render، نحاول مع render
          if (!html || html.length < 100) {
            try {
              console.log(`🔄 Trying ScraperAPI with render...`);
              const apiResponse2 = await axios.get('http://api.scraperapi.com', {
                params: {
                  api_key: process.env.SCRAPERAPI_KEY,
                  url: urlToScrape,
                  render: true,
                  wait: 2000,
                },
                timeout: 25000,
              });
              if (apiResponse2.data && typeof apiResponse2.data === 'string' && apiResponse2.data.length > 1000) {
                html = apiResponse2.data;
                console.log(`✅ Got HTML from ScraperAPI with render (${html.length} chars)`);
              }
            } catch (renderError) {
              console.log(`⚠️ ScraperAPI with render also failed: ${renderError.message}`);
              throw new Error('فشل في جلب بيانات المنتج من الرابط القصير. يرجى استخدام رابط المنتج الكامل من المتصفح.');
            }
          }
        }
      } else {
        // إذا لم يكن ScraperAPI متوفر لكن حصلنا على رابط المنتج، نستمر في العمل
        if (finalProductUrl || productId) {
          console.log(`⚠️ No ScraperAPI key, but we have product URL. Will try direct request...`);
          // سنحاول axios في الكود التالي
        } else {
          throw new Error('الرابط القصير من iHerb يحتاج ScraperAPI. يرجى إضافة SCRAPERAPI_KEY في ملف .env أو استخدام رابط المنتج الكامل من المتصفح.');
        }
      }
    }
    
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    // iHerb محمي بـ Cloudflare، لذلك نستخدم ScraperAPI مباشرة إذا كان متوفراً (أسرع وأكثر موثوقية)
    // إذا لم يكن ScraperAPI متوفر، نحاول axios كـ fallback
    if (process.env.SCRAPERAPI_KEY) {
      // استخدام ScraperAPI مباشرة (أسرع وأكثر موثوقية مع الحماية)
      try {
        console.log(`🚀 Using ScraperAPI for iHerb (fast & reliable)...`);
        const response = await axios.get('http://api.scraperapi.com', {
          params: {
            api_key: process.env.SCRAPERAPI_KEY,
            url: cleanUrl,
            render: false, // بدون render أسرع (الموقع لا يحتاج JavaScript للسعر الأساسي)
          },
          timeout: 12000, // timeout أقصر (12 ثانية)
        });
        html = response.data;
        console.log(`✅ ScraperAPI successful (${html.length} chars)`);
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
        // إذا فشل ScraperAPI، نحاول axios كـ fallback
        if (!html || html.length < 100) {
          try {
            console.log(`🔄 Trying direct request as fallback...`);
            const response = await axios.get(cleanUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.iherb.com/',
              },
              timeout: 8000,
              maxRedirects: 3,
            });
            html = response.data;
            console.log(`✅ Direct request successful (${html.length} chars)`);
          } catch (directError) {
            console.log(`⚠️ Direct request also failed: ${directError.message}`);
          }
        }
      }
    } else {
      // إذا لم يكن ScraperAPI متوفر، نحاول axios مباشرة
      try {
        console.log(`🚀 Fetching iHerb product page directly (no ScraperAPI)...`);
        const response = await axios.get(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.iherb.com/',
          },
          timeout: 8000,
          maxRedirects: 3,
        });
        html = response.data;
        console.log(`✅ Direct fetch successful (${html.length} chars)`);
      } catch (error) {
        console.log(`⚠️ Direct request failed: ${error.message}`);
        // إذا كان 403، الموقع محمي - نحتاج ScraperAPI
        if (error.response && error.response.status === 403) {
          throw new Error('الموقع محمي. يرجى إضافة SCRAPERAPI_KEY في ملف .env أو استخدام رابط المنتج من متصفح آخر.');
        }
      }
    }
    
    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // ========== جلب الاسم (Name) ==========
    let name = '';
    
    const nameSelectors = [
      'h1[itemprop="name"]',
      'h1.product-title',
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
        // تنظيف الاسم
        name = name.replace(/\s+/g, ' ').trim();
        name = name.replace(/^iHerb\s*[-–]\s*/i, '').trim();
        break;
      }
    }
    
    // ========== جلب السعر (Price) - أولوية للبحث عن السعر الحالي (المخفض) ==========
    let priceText = '';
    let foundPrices = []; // لتخزين جميع الأسعار التي نجدها
    let excludedPrices = [0.01, 0.1, 0.5, 1, 2, 3, 4, 5, 10]; // أسعار غير منطقية
    
    // أولوية 0: البحث عن السعر مع العملة (SAR) مباشرة في النص (الأكثر دقة)
    // هذا مهم جداً لأن iHerb يعرض السعر بالريال السعودي في بعض البلدان
    const pageTextForPrice = $.text();
    const htmlForPrice = $.html();
    
    // البحث عن السعر في سياق معين (Special, price, current) وتجاهل "You save", "save"
    // نبحث عن السعر الذي يظهر مع كلمات مثل "Special", "price", "current" ونتجنب "save", "You save"
    const priceWithCurrencyPatterns = [
      /(\d+\.?\d{1,2})\s*ر\.س/i,           // 34.06 ر.س (يجب أن يكون decimal)
      /(\d+\.?\d{1,2})\s*SAR/i,             // 34.06 SAR
      /(\d+\.?\d{1,2})\s*ريال/i,            // 34.06 ريال
      /(\d+\.?\d{1,2})\s*SR/i,              // 34.06 SR
      /ر\.س\s*(\d+\.?\d{1,2})/i,            // ر.س 34.06
      /SAR\s*(\d+\.?\d{1,2})/i,             // SAR 34.06
    ];
    
    // البحث عن جميع الأسعار مع SAR في النص
    const sarPrices = [];
    const sarPricesWithContext = []; // الأسعار مع سياق (Special, price, current)
    
    for (const pattern of priceWithCurrencyPatterns) {
      const matches = pageTextForPrice.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const foundPrice = parseFloat(match[1] || match[0]);
        const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
        if (foundPrice > 5 && foundPrice < 10000 && !isExcluded) {
          // البحث عن السياق حول السعر (في النص أو HTML)
          const matchIndex = match.index || 0;
          const contextBefore = pageTextForPrice.substring(Math.max(0, matchIndex - 50), matchIndex).toLowerCase();
          const contextAfter = pageTextForPrice.substring(matchIndex + match[0].length, Math.min(pageTextForPrice.length, matchIndex + match[0].length + 50)).toLowerCase();
          const context = contextBefore + ' ' + contextAfter;
          
          // تجاهل الأسعار التي تظهر مع "save", "you save", "you save:", "discount"
          const isSaveContext = /you\s+save|save\s*:|discount|خصم|توفير/i.test(context);
          
          // تفضيل الأسعار التي تظهر مع "special", "price", "current", "% off"
          const isPriceContext = /special|price|current|%?\s*off|خصم/i.test(context);
          
          if (!isSaveContext) {
            if (isPriceContext) {
              // سعر مع سياق جيد (Special, price, off)
              sarPricesWithContext.push(foundPrice);
            }
            sarPrices.push(foundPrice);
          }
        }
      }
    }
    
    // إزالة الأسعار المكررة
    const uniqueSarPrices = [...new Set(sarPrices)];
    const uniqueSarPricesWithContext = [...new Set(sarPricesWithContext)];
    
    // إذا وجدنا أسعار مع سياق جيد (Special, price, off)، نستخدمها
    if (uniqueSarPricesWithContext.length > 0) {
      uniqueSarPricesWithContext.sort((a, b) => a - b);
      price = uniqueSarPricesWithContext[0]; // أصغر سعر مع سياق جيد
      console.log(`✅ Using SAR price with good context (Special/price/off): ${price} ${detectedCurrency}`);
      detectedCurrency = 'SAR';
    } else if (uniqueSarPrices.length > 0) {
      // إذا لم نجد أسعار مع سياق جيد، نستخدم أصغر سعر (السعر المخفض)
      uniqueSarPrices.sort((a, b) => a - b);
      
      // نأخذ أصغر سعر منطقي (عادة السعر الحالي/المخفض)
      // لكن نتجنب الأسعار الصغيرة جداً (مثل 8.52 من "You save")
      // إذا كان هناك سعران والفرق كبير، نأخذ السعر الأكبر (السعر الفعلي) وليس السعر الصغير (You save)
      const validPrices = uniqueSarPrices.filter(p => {
        // إذا كان هناك سعر أكبر بكثير، نتجاهل السعر الصغير جداً (من "You save")
        if (uniqueSarPrices.length >= 2) {
          const maxPrice = Math.max(...uniqueSarPrices);
          const minPrice = Math.min(...uniqueSarPrices);
          const priceDiff = maxPrice - minPrice;
          
          // إذا كان الفرق كبير (مثل 8.52 و 34.06)، نتجاهل السعر الصغير جداً
          // لأن السعر الصغير هو من "You save" وليس السعر الفعلي
          if (priceDiff > 15 && p === minPrice && p < 20) {
            return false; // نتجاهل السعر الصغير جداً (من "You save")
          }
          
          // إذا كان هناك سعران قريبان (مثل 34.06 و 42.58)، نأخذ الأصغر (السعر المخفض)
          if (priceDiff < 15 && p === minPrice) {
            return true; // نأخذ الأصغر (السعر المخفض)
          }
        }
        return true;
      });
      
      if (validPrices.length > 0) {
        // إذا كان هناك سعران والفرق كبير، نأخذ الأكبر (السعر الفعلي) وليس الأصغر (You save)
        if (validPrices.length >= 2) {
          const maxPrice = Math.max(...validPrices);
          const minPrice = Math.min(...validPrices);
          const priceDiff = maxPrice - minPrice;
          
          // إذا كان الفرق كبير جداً (مثل 8.52 و 34.06)، نأخذ الأكبر (السعر الفعلي)
          if (priceDiff > 15 && minPrice < 20) {
            price = maxPrice; // السعر الفعلي (34.06)
            console.log(`✅ Using actual price (not "You save"): ${price} ${detectedCurrency} (ignoring "You save" price: ${minPrice})`);
          } else {
            // إذا كان الفرق صغير (مثل 34.06 و 42.58)، نأخذ الأصغر (السعر المخفض)
            price = minPrice;
            console.log(`✅ Using lowest SAR price (sale price): ${price} ${detectedCurrency}`);
          }
        } else {
          price = validPrices[0];
          console.log(`✅ Using SAR price: ${price} ${detectedCurrency}`);
        }
        detectedCurrency = 'SAR';
      }
    }
    
    // أولوية 1: البحث في JSON-LD (الأكثر دقة وموثوقية) - فقط إذا لم نجد سعر مع SAR
    // JSON-LD يحتوي على السعر الحالي (المخفض) في offers.price
    // لكن نحذر: قد يكون السعر بعملة USD!
    if (price === 0 || detectedCurrency !== 'SAR') {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            // البحث في offers (يحتوي على السعر الحالي)
            // أولوية: lowPrice (السعر الحالي/المخفض) > price (السعر العام)
            if (jsonData.offers) {
              const offerCurrency = jsonData.offers.priceCurrency?.toUpperCase() || 'USD';
              
              // أولوية 1: lowPrice (السعر الحالي/المخفض) - هذا هو السعر الذي يظهر للمستخدم
              // lowPrice دائماً هو أصغر سعر (السعر المخفض)
              if (jsonData.offers.lowPrice) {
                const lowPrice = parseFloat(jsonData.offers.lowPrice);
                
                // إذا كان السعر بعملة SAR، نستخدمه مباشرة
                if (lowPrice > 0.1 && lowPrice < 100000) {
                  if (offerCurrency === 'SAR') {
                    // إذا كان السعر بالفعل SAR، نستخدمه مباشرة (لا نحول)
                    // نستخدمه حتى لو كان لدينا سعر آخر، لأن lowPrice هو السعر المخفض
                    if (price === 0 || detectedCurrency !== 'SAR' || (detectedCurrency === 'SAR' && lowPrice < price)) {
                      price = lowPrice;
                      detectedCurrency = 'SAR';
                      console.log(`✅ Current price from JSON-LD lowPrice (SAR, sale price): ${price} ${detectedCurrency}`);
                    }
                  } else if (price === 0 || detectedCurrency !== 'SAR') {
                    // إذا لم نجد سعر SAR بعد، نستخدم هذا السعر (لكن نحوله لاحقاً)
                    if (price === 0 || (detectedCurrency !== 'SAR' && lowPrice < price)) {
                      price = lowPrice;
                      detectedCurrency = offerCurrency;
                      console.log(`✅ Current price from JSON-LD lowPrice: ${price} ${detectedCurrency} (will convert to SAR)`);
                    }
                  }
                }
              }
              
              // أولوية 2: إذا لم نجد lowPrice، نبحث في price
              // لكن نحذر: price قد يكون السعر الأصلي (أكبر من السعر الحالي)
              // لذلك نأخذ أصغر سعر دائماً
              if (price === 0 || (detectedCurrency !== 'SAR' && offerCurrency === 'SAR')) {
                if (Array.isArray(jsonData.offers)) {
                  // نبحث عن أصغر سعر في array (عادة السعر الحالي)
                  const prices = [];
                  const sarPricesArray = [];
                  
                  for (const offer of jsonData.offers) {
                    if (offer.price) {
                      const offerPrice = parseFloat(offer.price);
                      const curr = offer.priceCurrency?.toUpperCase() || offerCurrency;
                      if (offerPrice > 0.1 && offerPrice < 100000) {
                        if (curr === 'SAR') {
                          sarPricesArray.push(offerPrice);
                        } else {
                          prices.push({ price: offerPrice, currency: curr });
                        }
                      }
                    }
                  }
                  
                  // نفضل SAR prices - نأخذ أصغر سعر
                  if (sarPricesArray.length > 0) {
                    sarPricesArray.sort((a, b) => a - b);
                    price = sarPricesArray[0]; // أصغر سعر SAR
                    detectedCurrency = 'SAR';
                    console.log(`✅ Current price from JSON-LD offers array (lowest SAR): ${price} ${detectedCurrency}`);
                  } else if (prices.length > 0) {
                    // نأخذ أصغر سعر (عادة السعر الحالي/المخفض)
                    prices.sort((a, b) => a.price - b.price);
                    price = prices[0].price;
                    detectedCurrency = prices[0].currency;
                    console.log(`✅ Current price from JSON-LD offers array (lowest): ${price} ${detectedCurrency}`);
                  }
                } else if (jsonData.offers.price) {
                  const offerPrice = parseFloat(jsonData.offers.price);
                  if (offerPrice > 0.1 && offerPrice < 100000) {
                    // إذا كان السعر بعملة SAR، نفضله
                    // لكن نحذر: price قد يكون السعر الأصلي (أكبر من lowPrice)
                    // لذلك نستخدمه فقط إذا لم نجد lowPrice أو إذا كان أصغر من السعر الحالي
                    if (offerCurrency === 'SAR') {
                      if (price === 0 || detectedCurrency !== 'SAR' || (detectedCurrency === 'SAR' && offerPrice < price)) {
                        price = offerPrice;
                        detectedCurrency = 'SAR';
                        console.log(`✅ Price from JSON-LD offers (SAR): ${price} ${detectedCurrency}`);
                      }
                    } else if (price === 0) {
                      price = offerPrice;
                      detectedCurrency = offerCurrency;
                      console.log(`✅ Price from JSON-LD offers: ${price} ${detectedCurrency}`);
                    }
                  }
                }
              }
            }
            
            // السعر المباشر من jsonData (أقل أولوية)
            // لكن نتجنب استخدامه إذا كان بعملة USD وكان لدينا سعر SAR
            // ونحذر: هذا السعر قد يكون السعر الأصلي (أكبر من lowPrice)
            if (price === 0 || (detectedCurrency !== 'SAR' && jsonData.priceCurrency?.toUpperCase() === 'SAR')) {
              const directPrice = parseFloat(jsonData.price);
              const directCurrency = jsonData.priceCurrency?.toUpperCase() || 'USD';
              
              if (directPrice > 0.1 && directPrice < 100000) {
                // نفضل SAR على USD
                // لكن نستخدمه فقط إذا كان أصغر من السعر الحالي أو لم نجد سعر بعد
                if (directCurrency === 'SAR') {
                  if (price === 0 || detectedCurrency !== 'SAR' || (detectedCurrency === 'SAR' && directPrice < price)) {
                    price = directPrice;
                    detectedCurrency = directCurrency;
                    console.log(`✅ Price from JSON-LD direct (SAR, lowest): ${price} ${detectedCurrency}`);
                  }
                } else if (price === 0) {
                  price = directPrice;
                  detectedCurrency = directCurrency;
                  console.log(`✅ Price from JSON-LD direct: ${price} ${detectedCurrency}`);
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
    
    // أولوية 2: البحث في selectors محددة (السعر الحالي)
    if (price === 0) {
      const priceSelectors = [
        '[itemprop="price"]',           // Schema.org
        '.product-price-current',       // السعر الحالي
        '.price-current',              // السعر الحالي
        '.current-price',              // السعر الحالي
        '[data-price="current"]',      // السعر الحالي
        '.product-price',              // سعر المنتج
        '.price',                      // سعر عام
        '[class*="price-current"]',    // أي class يحتوي على price-current
        '[class*="current-price"]',    // أي class يحتوي على current-price
        '[data-price]',                // data-price attribute
      ];
      
      for (const selector of priceSelectors) {
        // محاولة content attribute أولاً (أكثر دقة)
        const contentPrice = $(selector).first().attr('content');
        const dataPrice = $(selector).first().attr('data-price');
        const textPrice = $(selector).first().text().trim();
        
        priceText = contentPrice || dataPrice || textPrice;
        
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
            
            if (foundPrice > 0.1 && foundPrice < 100000 && !isExcluded) {
              // تفضيل السعر إذا كان من selector محدد (current price)
              if (selector.includes('current') || selector.includes('itemprop')) {
                price = foundPrice;
                console.log(`✅ Current price found via selector "${selector}": ${price}`);
                break;
              } else {
                // إذا لم يكن current، نخزنه كاحتياطي
                foundPrices.push({ price: foundPrice, source: selector });
              }
            }
          }
        }
      }
      
      // إذا لم نجد سعر current، نستخدم أصغر سعر منطقي (عادة السعر الحالي/المخفض)
      if (price === 0 && foundPrices.length > 0) {
        // نأخذ أصغر سعر منطقي (عادة السعر الحالي/المخفض)
        foundPrices.sort((a, b) => a.price - b.price);
        for (const fp of foundPrices) {
          const isExcluded = excludedPrices.some(ex => Math.abs(fp.price - ex) < 0.01);
          if (!isExcluded) {
            price = fp.price;
            console.log(`✅ Price found (fallback, lowest): ${price} from ${fp.source}`);
            break;
          }
        }
      }
    }
    
    // أولوية 3: البحث في scripts (للأسعار الديناميكية)
    if (price === 0) {
      try {
        const scripts = $('script');
        for (let i = 0; i < scripts.length && i < 30; i++) { // فحص أول 30 script فقط (أسرع)
          const scriptText = $(scripts[i]).html();
          if (scriptText && scriptText.length > 100) {
            // أنماط للبحث عن السعر الحالي (أولوية)
            const pricePatterns = [
              /"currentPrice"\s*:\s*"?([\d.]+)"?/i,        // السعر الحالي
              /"price"\s*:\s*"?([\d.]+)"?/i,                // السعر العام
              /"salePrice"\s*:\s*"?([\d.]+)"?/i,            // سعر العرض
              /"finalPrice"\s*:\s*"?([\d.]+)"?/i,            // السعر النهائي
              /"priceValue"\s*:\s*"?([\d.]+)"?/i,           // قيمة السعر
              /price\s*=\s*"?([\d.]+)"?/i,                  // price = ...
            ];
            
            // البحث عن جميع الأسعار في script
            const scriptPrices = [];
            for (const pattern of pricePatterns) {
              const matches = scriptText.matchAll(new RegExp(pattern.source, 'gi'));
              for (const match of matches) {
                const foundPrice = parseFloat(match[1]);
                const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
                if (foundPrice > 0.1 && foundPrice < 100000 && !isExcluded) {
                  scriptPrices.push({
                    price: foundPrice,
                    pattern: pattern.source,
                    priority: pattern.source.includes('current') || pattern.source.includes('sale') || pattern.source.includes('final') ? 1 : 2
                  });
                }
              }
            }
            
            // تفضيل الأسعار التي تحتوي على current/sale/final
            // ثم نأخذ أصغر سعر منطقي دائماً (السعر الحالي/المخفض)
            if (scriptPrices.length > 0) {
              scriptPrices.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                // إذا كانت نفس الأولوية، نأخذ أصغر سعر (السعر الحالي/المخفض)
                return a.price - b.price;
              });
              
              // نأخذ أصغر سعر منطقي دائماً (السعر الحالي/المخفض)
              const validPrices = scriptPrices.filter(p => p.price > 0.1 && p.price < 10000);
              if (validPrices.length > 0) {
                // دائماً نأخذ أصغر سعر (السعر المخفض)
                price = validPrices[0].price;
                console.log(`✅ Current price (lowest) found in script (${validPrices[0].pattern}): ${price}`);
                break;
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    // أولوية 4: البحث في جميع العناصر التي تحتوي على price (بحث شامل)
    if (price === 0) {
      const allPriceElements = $('[class*="price"], [id*="price"], [data-price]');
      const priceCandidates = [];
      
      allPriceElements.each((i, el) => {
        const $el = $(el);
        // محاولة data-price أو content أولاً
        const dataPrice = $el.attr('data-price') || $el.attr('content');
        const text = $el.text().trim();
        
        if (dataPrice || text) {
          const priceStr = dataPrice || text;
          let cleanPrice = priceStr.toString().replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
          
          const arabicToEnglish = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
          };
          cleanPrice = cleanPrice.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
          
          const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[0]);
            const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
            const className = $el.attr('class') || '';
            const id = $el.attr('id') || '';
            
            // تفضيل العناصر التي تحتوي على "current" في class أو id
            const isCurrent = className.toLowerCase().includes('current') || id.toLowerCase().includes('current');
            
            if (foundPrice > 0.1 && foundPrice < 100000 && !isExcluded) {
              priceCandidates.push({
                price: foundPrice,
                priority: isCurrent ? 1 : 2,
                className: className,
              });
            }
          }
        }
      });
      
      if (priceCandidates.length > 0) {
        priceCandidates.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          // نأخذ أصغر سعر منطقي (عادة السعر الحالي/المخفض)
          return a.price - b.price;
        });
        
        // نأخذ أصغر سعر منطقي (السعر الحالي)
        const validPrices = priceCandidates.filter(p => p.price > 0.1 && p.price < 10000);
        if (validPrices.length > 0) {
          price = validPrices[0].price;
          console.log(`✅ Current price found in DOM elements: ${price}`);
        }
      }
    }
    
    // أولوية 5: البحث في النص عن السعر الحالي (مثل "17.93 ر.س" مع تجاهل "21.09 ر.س" المشطوب)
    if (price === 0) {
      const pageText = $.text();
      // البحث عن أنماط السعر الحالي (مع تجاهل الأسعار المشطوبة)
      // نبحث عن السعر الذي يظهر أولاً في النص (عادة السعر الحالي)
      const pricePatterns = [
        /(\d+\.?\d*)\s*ر\.س/i,           // 17.93 ر.س
        /(\d+\.?\d*)\s*SAR/i,             // 17.93 SAR
        /(\d+\.?\d*)\s*ريال/i,            // 17.93 ريال
        /(\d+\.?\d*)\s*SR/i,              // 17.93 SR
      ];
      
      const foundPrices = [];
      for (const pattern of pricePatterns) {
        const matches = pageText.matchAll(new RegExp(pattern.source, 'gi'));
        for (const match of matches) {
          const foundPrice = parseFloat(match[1]);
          const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
          if (foundPrice > 0.1 && foundPrice < 10000 && !isExcluded) {
            foundPrices.push(foundPrice);
          }
        }
      }
      
      if (foundPrices.length > 0) {
        // نأخذ أصغر سعر منطقي (عادة السعر الحالي/المخفض)
        foundPrices.sort((a, b) => a - b);
        price = foundPrices[0];
        console.log(`✅ Current price (lowest) found in text: ${price} (ignoring higher prices: ${foundPrices.slice(1).join(', ')})`);
      }
    }
    
    // البحث عن العملة في النص (USD, SAR, EUR, etc.) - مهم جداً
    // أولوية: البحث عن العملة بالقرب من السعر (أكثر دقة)
    if (price > 0) {
      const pageText = $.text();
      
      // أولوية 1: البحث عن العملة بالقرب من السعر (في نفس العنصر أو قريب منه)
      if (price > 0) {
        // البحث في العناصر التي تحتوي على السعر
        const priceElements = $('[class*="price"], [id*="price"], [data-price]');
        priceElements.each((i, el) => {
          const $el = $(el);
          const text = $el.text();
          const priceInText = text.match(/(\d+\.?\d*)/);
          if (priceInText && Math.abs(parseFloat(priceInText[1]) - price) < 0.1) {
            // إذا وجدنا السعر في هذا العنصر، نبحث عن العملة في نفس العنصر أو الأب
            const parentText = $el.parent().text() + ' ' + text;
            if (/ر\.س|SAR|ريال|SR/i.test(parentText)) {
              detectedCurrency = 'SAR';
              console.log(`✅ Currency detected near price: SAR`);
              return false; // break loop
            } else if (/\$|USD|US\$/i.test(parentText)) {
              detectedCurrency = 'USD';
              console.log(`✅ Currency detected near price: USD`);
              return false;
            }
          }
        });
      }
      
      // أولوية 2: البحث العام في النص (إذا لم نجد العملة بالقرب من السعر)
      if (!detectedCurrency || detectedCurrency === 'USD') {
        const currencyPatterns = [
          /\b(SAR|SR|ريال|ر\.س)\b/i,    // أولوية لـ SAR
          /\b(USD|US\$|\$)\b/i,
          /\b(EUR|€|يورو)\b/i,
          /\b(GBP|£|جنيه)\b/i,
          /\b(AED|درهم)\b/i,
        ];
        
        for (const pattern of currencyPatterns) {
          if (pattern.test(pageText)) {
            const match = pageText.match(pattern);
            if (match && match[1]) {
              const currencyCode = match[1].toUpperCase();
              // تحديد العملة من الكود
              if (currencyCode.includes('SAR') || currencyCode.includes('SR') || currencyCode.includes('ريال') || currencyCode.includes('ر.س')) {
                detectedCurrency = 'SAR';
                console.log(`✅ Currency detected from page text: SAR`);
                break;
              } else if (currencyCode.includes('USD') || currencyCode.includes('US$') || currencyCode === '$') {
                if (!detectedCurrency || detectedCurrency === 'USD') {
                  detectedCurrency = 'USD';
                }
              } else if (currencyCode.includes('EUR') || currencyCode === '€' || currencyCode.includes('يورو')) {
                detectedCurrency = 'EUR';
                console.log(`✅ Currency detected from page text: EUR`);
                break;
              } else if (currencyCode.includes('GBP') || currencyCode === '£' || currencyCode.includes('جنيه')) {
                detectedCurrency = 'GBP';
                console.log(`✅ Currency detected from page text: GBP`);
                break;
              } else if (currencyCode.includes('AED') || currencyCode.includes('درهم')) {
                detectedCurrency = 'AED';
                console.log(`✅ Currency detected from page text: AED`);
                break;
              }
            }
          }
        }
      }
    }
    
    // ========== جلب الصورة (Image) ==========
    let image = '';
    
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '[itemprop="image"]',
      '.product-image img',
      '.product-gallery img',
      'img[data-src]',
    ];
    
    for (const selector of imageSelectors) {
      if (selector.includes('meta')) {
        image = $(selector).attr('content') || '';
      } else {
        image = $(selector).first().attr('src') ||
                $(selector).first().attr('data-src') ||
                $(selector).first().attr('data-lazy-src') ||
                $(selector).first().attr('content') || '';
      }
      
      if (image && image.length > 20 &&
          !image.includes('placeholder') &&
          !image.includes('icon') &&
          !image.includes('logo')) {
        break;
      }
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
    
    const duration = Date.now() - startTime;
    console.log(`⚡ iHerb scraper completed in ${duration}ms`);
    
    // التحقق من البيانات الأساسية
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'لم يتم العثور على اسم المنتج',
        details: 'الرجاء التأكد من صحة الرابط',
      };
    }
    
    // استخدام العملة المكتشفة أو افتراض USD
    let finalCurrency = detectedCurrency || 'USD';
    let finalPrice = price || 0;
    
    // تحسين اكتشاف العملة: إذا كان السعر منطقي (مثل 21.22) ولم نجد عملة، نفحص أكثر
    if (finalPrice > 0 && finalPrice < 100 && !detectedCurrency) {
      // إذا كان السعر بين 10-100، قد يكون بالريال السعودي
      // دعنا نبحث مرة أخرى في النص
      const pageTextCheck = $.text();
      if (/ر\.س|SAR|ريال|SR/i.test(pageTextCheck)) {
        finalCurrency = 'SAR';
        console.log(`✅ Currency auto-detected as SAR based on price range: ${finalPrice}`);
      }
    }
    
    // تحويل العملة تلقائياً إلى SAR (مهم جداً - السلة تتعامل بالريال السعودي فقط)
    if (finalPrice > 0) {
      // إذا كانت العملة المكتشفة SAR، لا نحول (لأنها بالفعل صحيحة)
      if (finalCurrency === 'SAR') {
        console.log(`✅ Price already in SAR: ${finalPrice}`);
        // لا نحول - السعر بالفعل بالريال السعودي
      } else {
        // نحول فقط إذا كانت العملة غير SAR
        try {
          const settingsPromise = Settings.getSettings();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          
          const settings = await Promise.race([settingsPromise, timeoutPromise]);
          const currencyRates = settings.pricing?.currencyRates || {};
          
          const sourceRate = currencyRates[finalCurrency] || currencyRates.USD || 250;
          const sarRate = currencyRates.SAR || 67;
          
          if (finalCurrency === 'USD') {
            // تحويل مباشر من USD إلى SAR
            // معدل التحويل: SAR = USD * 3.75 (تقريباً)
            const usdToSar = sarRate / (currencyRates.USD || 250);
            const originalPrice = finalPrice;
            finalPrice = finalPrice * usdToSar;
            console.log(`✅ Converted ${originalPrice} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR (rate: ${usdToSar.toFixed(4)})`);
          } else {
            // تحويل عبر YER: Currency -> YER -> SAR
            const originalPrice = finalPrice;
            const priceInYER = finalPrice * sourceRate;
            finalPrice = priceInYER / sarRate;
            console.log(`✅ Converted ${originalPrice} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR`);
          }
          
          finalCurrency = 'SAR';
        } catch (e) {
          console.log(`⚠️ Using default exchange rate (DB timeout or error)`);
          // استخدام معدلات افتراضية
          const defaultRates = {
            'USD': 3.75,
            'EUR': 4.10,
            'GBP': 4.70,
            'AED': 1.02,
            'SAR': 1.00,
          };
          
          const rate = defaultRates[finalCurrency] || defaultRates['USD'];
          if (finalCurrency !== 'SAR') {
            const originalPrice = finalPrice;
            finalPrice = finalPrice * rate;
            finalCurrency = 'SAR';
            console.log(`✅ Converted ${originalPrice} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR (default rate: ${rate})`);
          }
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
        currency: finalCurrency,
        image: image || '',
        store: 'iherb',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'iherb-scraper',
        originalCurrency: detectedCurrency || 'USD',
        originalPrice: price || 0,
      },
    };
  } catch (error) {
    console.error('❌ iHerb scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من iHerb';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بـ iHerb. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم iHerb. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};

