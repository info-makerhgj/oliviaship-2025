// import puppeteer from 'puppeteer'; // Disabled for Railway deployment
import Settings from '../../models/Settings.js';

/**
 * Shein Scraper باستخدام Puppeteer - نظام قوي ودقيق
 * يستخدم headless browser حقيقي لتنفيذ JavaScript بشكل كامل
 * مثل المتصفح الحقيقي - أدق وأقوى من ScraperAPI
 */
export const scrapeSheinPuppeteer = async (url) => {
  // Puppeteer disabled for Railway deployment
  throw new Error('Puppeteer scraping temporarily disabled - not configured on Railway');
  
  /* DISABLED FOR RAILWAY
  const startTime = Date.now();
  let browser = null;

  try {
    // تنظيف URL
    let urlObj = new URL(url);
    let finalUrl = url;

    // معالجة الروابط القصيرة
    if (urlObj.hostname.includes('api-shein.shein.com') || urlObj.hostname.includes('api-shein')) {
      try {
        console.log(`🔄 Following redirect for short link...`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'follow',
        });
        finalUrl = response.url || url;
        urlObj = new URL(finalUrl);
        console.log(`✅ Redirect completed: ${finalUrl}`);
      } catch (error) {
        // continue with original URL
      }
    }

    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');

    console.log(`🚀 Starting Puppeteer scraping for Shein...`);
    console.log(`   URL: ${cleanUrl}`);

    // تشغيل Puppeteer - محاولة non-headless أولاً (أكثر نجاحاً)
    // إذا فشل، نعود لـ headless
    let useHeadless = true;
    try {
      // محاولة non-headless (أكثر نجاحاً مع Shein)
      browser = await puppeteer.launch({
        headless: false, // غير headless - يظهر المتصفح
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
        ],
      });
      useHeadless = false;
      console.log('✅ Using non-headless browser (more reliable)');
    } catch (e) {
      // Fallback to headless
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080',
        ],
      });
      console.log('⚠️ Using headless browser (fallback)');
    }

    const page = await browser.newPage();
    
    // مراقبة network requests للعثور على API endpoint للسعر
    const apiRequests = [];
    const productApiRequests = []; // طلبات خاصة بالمنتج
    
    page.on('response', async (response) => {
      const url = response.url();
      
      // الأولوية لـ product detail APIs
      const isProductApi = url.includes('productDetail') || url.includes('goods_detail') || 
                          url.includes('productInfo') || url.includes('goods_id') ||
                          (url.includes('product') && url.includes('detail'));
      
      // البحث في جميع API requests
      if (url.includes('/api/') || url.includes('/bff-api/') || url.includes('product') || 
          url.includes('goods') || url.includes('detail')) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('json') || url.includes('/api/')) {
            const data = await response.json().catch(() => null);
            if (data) {
              const dataStr = JSON.stringify(data);
              const requestData = { 
                url, 
                data: dataStr.length > 10000 ? dataStr.substring(0, 10000) : dataStr,
                fullData: data,
                isProductApi: isProductApi
              };
              
              apiRequests.push(requestData);
              if (isProductApi) {
                productApiRequests.push(requestData);
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // إخفاء أننا headless browser
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // تعيين User Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // تعيين اللغة
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    
    // إضافة cookies لتحسين التجربة
    await page.setCookie({
      name: 'currency',
      value: 'SAR',
      domain: '.shein.com',
    });

    // الانتقال إلى الصفحة - استخدام networkidle2 لضمان تحميل كامل
    console.log(`📄 Loading page...`);
    await page.goto(cleanUrl, {
      waitUntil: 'networkidle2',
      timeout: 40000,
    });

    // انتظار تحميل JavaScript والمحتوى
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // محاولة التمرير لتفعيل lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // انتظار العنصر المحدد للسعر (من الصورة) - مع محاولات متعددة
    let priceElementFound = false;
    const priceSelectors = [
      '#productMainPriceId',
      '#productPriceId', 
      '#priceContainer',
      '.productPrice_main',
      '[id*="productPrice"]',
      '[class*="productPrice"]',
    ];
    
    for (const selector of priceSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 8000 });
        console.log(`✅ Found price element: ${selector}`);
        priceElementFound = true;
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      } catch (e) {
        // continue to next selector
      }
    }
    
    if (!priceElementFound) {
      console.log('⚠️ Specific price elements not found, trying general selectors...');
      try {
        await page.waitForSelector('[class*="price"], [id*="price"]', { timeout: 5000 });
        console.log('✅ General price elements found');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('⚠️ Continuing without waiting for price elements...');
      }
    }
    
    // انتظار إضافي للتأكد من تحميل السعر
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // محاولة استدعاء API endpoint مباشر للمنتج (إذا كان productId موجود)
    const productIdMatch = cleanUrl.match(/p-(\d+)/);
    if (productIdMatch && productIdMatch[1]) {
      const productId = productIdMatch[1];
      console.log(`🔍 Trying direct API call for product ${productId}...`);
      
      const apiEndpoints = [
        `https://ar.shein.com/api/productInfo/productDetail/get?goods_id=${productId}`,
        `https://ar.shein.com/bff-api/product/productDetail/get?goods_id=${productId}`,
        `https://ar.shein.com/product/get_goods_detail_static_data?goods_id=${productId}`,
      ];
      
      for (const apiUrl of apiEndpoints) {
        try {
          const apiResponse = await page.evaluate(async (url) => {
            const response = await fetch(url, {
              headers: {
                'Referer': window.location.href,
              },
            });
            if (response.ok) {
              return await response.json();
            }
            return null;
          }, apiUrl);
          
          if (apiResponse) {
            console.log(`✅ Got response from: ${apiUrl.substring(apiUrl.indexOf('/api'))}`);
            // البحث عن السعر في الاستجابة
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
            const foundPrice = findPrice(apiResponse);
            if (foundPrice) {
              console.log(`✅ Price found via direct API: ${foundPrice} SAR`);
              // سنستخدمه لاحقاً في page.evaluate
            }
          }
        } catch (e) {
          // continue
        }
      }
    }
    
    // محاولة النقر على حجم معين لتفعيل تحميل السعر (إذا كان موجوداً)
    try {
      const sizeButtons = await page.$$('button[class*="size"], div[class*="size"], span[class*="size"]');
      if (sizeButtons.length > 0) {
        await sizeButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Clicked size button to trigger price loading');
      }
    } catch (e) {
      // ignore
    }

    // استخراج البيانات باستخدام JavaScript في المتصفح
    const productData = await page.evaluate(() => {
      const result = {
        name: '',
        price: 0,
        image: '',
        currency: 'SAR',
      };

      // 1. استخراج الاسم (بحث شامل - نتجنب title العام)
      // أولاً: البحث في window objects
      const nameSources = [
        window.productData,
        window.goodsInfo,
        window.__INITIAL_STATE__,
      ];
      
      const findName = (obj, depth = 0) => {
        if (depth > 20 || typeof obj !== 'object' || obj === null) return null;
        
        for (const key in obj) {
          const value = obj[key];
          
          if ((key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) && 
              typeof value === 'string' && value.length > 10 && 
              !value.includes('SHEIN') && !value.includes('شي إن')) {
            return value;
          }
          
          if (typeof value === 'object' && value !== null) {
            const found = findName(value, depth + 1);
            if (found) return found;
          }
          
          if (Array.isArray(value) && value.length > 0) {
            for (let j = 0; j < Math.min(value.length, 10); j++) {
              if (typeof value[j] === 'object') {
                const found = findName(value[j], depth + 1);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };
      
      for (const source of nameSources) {
        if (source) {
          const foundName = findName(source);
          if (foundName) {
            result.name = foundName;
            break;
          }
        }
      }
      
      // ثانياً: البحث في DOM (نتجنب title العام)
      const nameSelectors = [
        '[class*="product-name"]',
        '[class*="goods-name"]',
        '[class*="product-intro"] h1',
        '[class*="goods-title"]',
        '[class*="product-title"]',
        'h1[class*="product"]',
        'h1[class*="goods"]',
      ];

      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim() || '';
          if (text && text.length > 5 && 
              !text.includes('SHEIN') && 
              !text.includes('شي إن') &&
              !text.includes('ملابس نسائية')) {
            result.name = text;
            break;
          }
        }
      }
      
      // ثالثاً: البحث في جميع h1 (نتجنب title العام)
      if (!result.name || result.name.length < 5 || result.name.includes('ملابس نسائية')) {
        const h1s = document.querySelectorAll('h1');
        for (const h1 of h1s) {
          const text = h1.textContent?.trim() || '';
          if (text && text.length > 10 && 
              !text.includes('SHEIN') && 
              !text.includes('شي إن') &&
              !text.includes('ملابس نسائية') &&
              !text.includes('تسوق')) {
            result.name = text;
            break;
          }
        }
      }
      
      // رابعاً: fallback إلى og:title لكن نستخرج الجزء الصحيح
      if (!result.name || result.name.length < 5 || result.name.includes('ملابس نسائية')) {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        if (ogTitle) {
          // استخراج الجزء بعد | أو قبل |
          const parts = ogTitle.split('|');
          if (parts.length > 1) {
            result.name = parts[0].trim();
          } else {
            result.name = ogTitle.replace(/^SHEIN\s*[-–]\s*/i, '').replace(/\s*[-–]\s*SHEIN$/i, '').trim();
          }
        }
      }
      
      // تنظيف الاسم
      if (result.name) {
        result.name = result.name.replace(/^SHEIN\s*[-–]\s*/i, '').trim();
        result.name = result.name.replace(/\s*[-–]\s*SHEIN$/i, '').trim();
        result.name = result.name.replace(/^ملابس\s+نسائية\s+ورجالية[^|]*\|?\s*/i, '').trim();
        result.name = result.name.replace(/\s*\|.*$/i, '').trim(); // إزالة كل شيء بعد |
      }

      // 2. استخراج الصورة (بحث شامل)
      const imageSelectors = [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[itemprop="image"]',
        '[class*="product-intro"] img',
        '[class*="product-image"] img',
        '[class*="goods-image"] img',
        '[class*="goods-img"] img',
        '[itemprop="image"] img',
      ];

      for (const selector of imageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          result.image = element.getAttribute('content') || 
                        element.getAttribute('src') || 
                        element.getAttribute('data-src') ||
                        element.getAttribute('data-lazy-src') ||
                        element.getAttribute('data-oss-src') || '';
          if (result.image && result.image.length > 20 && 
              !result.image.includes('placeholder') && 
              !result.image.includes('icon') &&
              !result.image.includes('logo') &&
              !result.image.includes('svg')) {
            break;
          }
        }
      }
      
      // البحث في جميع img tags
      if (!result.image || result.image.length < 20) {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          if (src && src.length > 20 && 
              (src.includes('shein') || src.includes('ltwebstatic') || src.includes('http')) &&
              !src.includes('placeholder') && !src.includes('icon') && !src.includes('logo')) {
            result.image = src;
            break;
          }
        }
      }

      // 3. استخراج السعر (الأهم والأصعب)
      // ملاحظة: لا يمكن استخدام await في page.evaluate، لذلك نستخدم DOM search فقط
      
      // ثانياً: البحث في العناصر المحددة (الأكثر دقة) - من الصورة
      const priceSelectors = [
        '#productMainPriceId',
        '#productPriceId',
        '#priceContainer',
        '.productPrice_main',
        '[id*="productPrice"]',
        '[id*="priceContainer"]',
        '[class*="productPrice"]',
        '[class*="priceContainer"]',
      ];
      
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          // البحث في النص مباشرة
          const text = element.textContent?.trim() || '';
          if (text) {
            // البحث عن رقم مع SAR/ريال أولاً
            const sarMatch = text.match(/([\d,]+\.?\d*)\s*(?:SAR|ريال|ر\.س|SR)/i);
            if (sarMatch) {
              const price = parseFloat(sarMatch[1].replace(/,/g, ''));
              if (price > 1 && price < 50000) {
                result.price = price;
                return result; // إرجاع مباشرة
              }
            }
            
            // البحث عن رقم فقط
            const priceMatch = text.match(/([\d,]+\.?\d{0,2})/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(/,/g, ''));
              if (price > 1 && price < 50000) {
                result.price = price;
                return result; // إرجاع مباشرة
              }
            }
          }
          
          // البحث في جميع children (بشكل شامل)
          const children = element.querySelectorAll('*');
          for (const child of children) {
            const childText = child.textContent?.trim() || '';
            if (childText) {
              // البحث عن رقم مع SAR/ريال
              const sarMatch = childText.match(/([\d,]+\.?\d*)\s*(?:SAR|ريال|ر\.س|SR)/i);
              if (sarMatch) {
                const price = parseFloat(sarMatch[1].replace(/,/g, ''));
                if (price > 1 && price < 50000) {
                  result.price = price;
                  return result; // إرجاع مباشرة
                }
              }
              
              // البحث عن رقم فقط
              const childMatch = childText.match(/([\d,]+\.?\d{0,2})/);
              if (childMatch) {
                const price = parseFloat(childMatch[1].replace(/,/g, ''));
                if (price > 1 && price < 50000) {
                  result.price = price;
                  return result; // إرجاع مباشرة
                }
              }
            }
          }
        }
      }
      
      // ثانياً: البحث في window objects
      const priceSources = [
        window.productData,
        window.goodsInfo,
        window.__INITIAL_STATE__,
        window.__PRELOADED_STATE__,
        window.g_config,
      ];

      // دالة للبحث العميق في object
      const findPrice = (obj, depth = 0) => {
        if (depth > 30 || typeof obj !== 'object' || obj === null) return null;

        for (const key in obj) {
          const value = obj[key];

          // إذا كان المفتاح يحتوي على price وكان الرقم منطقي
          if (key.toLowerCase().includes('price') && typeof value === 'number' && value > 1 && value < 50000) {
            return value;
          }

          // مفاتيح محددة
          if (typeof value === 'number' && (
            key === 'price' || key === 'currentPrice' || key === 'salePrice' ||
            key === 'finalPrice' || key === 'goodsPrice' || key === 'retailPrice' ||
            key === 'minPrice' || key === 'maxPrice' || key === 'listPrice'
          ) && value > 1 && value < 50000) {
            return value;
          }

          // البحث في objects فرعية
          if (typeof value === 'object' && value !== null) {
            const found = findPrice(value, depth + 1);
            if (found) return found;
          }

          // البحث في arrays
          if (Array.isArray(value) && value.length > 0) {
            for (let j = 0; j < Math.min(value.length, 20); j++) {
              if (typeof value[j] === 'object') {
                const found = findPrice(value[j], depth + 1);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };

      // البحث في جميع sources (فقط إذا لم يتم العثور بعد)
      if (result.price === 0) {
        for (const source of priceSources) {
          if (source) {
            const foundPrice = findPrice(source);
            if (foundPrice) {
              result.price = foundPrice;
              break;
            }
          }
        }
      }

      // إذا لم يتم العثور، البحث في DOM elements (بحث شامل جداً)
      if (result.price === 0) {
        // البحث في جميع العناصر - نهج شامل
        const allElements = document.querySelectorAll('*');
        const priceCandidates = [];
        
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text && text.length < 200) {
            // البحث عن رقم مع SAR/ريال
            const sarMatch = text.match(/([\d,]+\.?\d*)\s*(?:SAR|ريال|ر\.س|SR)/i);
            if (sarMatch) {
              const price = parseFloat(sarMatch[1].replace(/,/g, ''));
              if (price > 1 && price < 50000) {
                priceCandidates.push({
                  price: price,
                  text: text,
                  tag: el.tagName,
                  className: (typeof el.className === 'string' ? el.className : el.className?.baseVal || '') || '',
                });
              }
            }
            
            // البحث عن أرقام بين 10 و 500 (نطاق منطقي لأسعار Shein)
            const numberMatch = text.match(/\b([\d,]+\.?\d{0,2})\b/);
            if (numberMatch) {
              const num = parseFloat(numberMatch[1].replace(/,/g, ''));
              if (num >= 10 && num <= 500 && !text.includes('px') && !text.includes('%')) {
                const className = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '') || '';
                // إذا كان العنصر يحتوي على price في class أو id
                if (className.toLowerCase().includes('price') || el.id?.toLowerCase().includes('price')) {
                  priceCandidates.push({
                    price: num,
                    text: text,
                    tag: el.tagName,
                    className: className,
                  });
                }
              }
            }
          }
        }
        
        // اختيار أفضل مرشح (أول واحد منطقي)
        if (priceCandidates.length > 0) {
          // تفضيل الأرقام التي تحتوي على SAR/ريال
          const sarPrice = priceCandidates.find(p => p.text.match(/(?:SAR|ريال|ر\.س)/i));
          if (sarPrice) {
            result.price = sarPrice.price;
          } else {
            // خذ أول رقم منطقي
            result.price = priceCandidates[0].price;
          }
        }
      }

      // تنظيف URL الصورة
      if (result.image && !result.image.startsWith('http')) {
        if (result.image.startsWith('//')) {
          result.image = 'https:' + result.image;
        } else if (result.image.startsWith('/')) {
          result.image = 'https://ar.shein.com' + result.image;
        }
      }

      return result;
    });

    // فحص API requests بشكل شامل - الأولوية لـ product APIs
    if (apiRequests.length > 0 && productData.price === 0) {
      console.log(`🔍 Found ${apiRequests.length} API requests (${productApiRequests.length} product-specific), checking for price...`);
      
      // البحث أولاً في product APIs (أكثر دقة)
      const requestsToCheck = productApiRequests.length > 0 ? productApiRequests : apiRequests;
      
      for (const req of requestsToCheck) {
        const urlShort = req.url.substring(0, 80);
        console.log(`   Checking: ${urlShort}`);
        
        // استخدام fullData إذا كان موجوداً (أدق)
        const dataToSearch = req.fullData || req.data;
        const dataStr = typeof dataToSearch === 'string' ? dataToSearch : JSON.stringify(dataToSearch);
        
        // البحث الشامل عن price في البيانات
        const pricePatterns = [
          /"price"\s*:\s*"?([\d.]+)"?/i,
          /"goodsPrice"\s*:\s*"?([\d.]+)"?/i,
          /"salePrice"\s*:\s*"?([\d.]+)"?/i,
          /"currentPrice"\s*:\s*"?([\d.]+)"?/i,
          /"retailPrice"\s*:\s*"?([\d.]+)"?/i,
          /"finalPrice"\s*:\s*"?([\d.]+)"?/i,
          /"usdPrice"\s*:\s*"?([\d.]+)"?/i,
          /price["']?\s*:\s*"?([\d.]+)"?/i,
        ];
        
        for (const pattern of pricePatterns) {
          const matches = dataStr.matchAll(new RegExp(pattern.source, 'gi'));
          const prices = [];
          for (const match of matches) {
            const price = parseFloat(match[1]);
            if (price > 1 && price < 50000) {
              prices.push(price);
            }
          }
          
          // إذا وجدنا عدة أسعار، نختار الأصغر (عادة السعر الحقيقي)
          if (prices.length > 0) {
            // نطاق منطقي لأسعار Shein: بين 5 و 500 SAR
            // تفضيل الأسعار الأقل من 30 (لأن 30 عادة shipping threshold)
            const validPrices = prices.filter(p => p >= 5 && p <= 500);
            const pricesBelow30 = validPrices.filter(p => p < 30);
            
            if (pricesBelow30.length > 0) {
              // اختيار أصغر سعر أقل من 30 (السعر الحقيقي عادة)
              const selectedPrice = Math.min(...pricesBelow30);
              productData.price = selectedPrice;
              console.log(`✅ Price found in API (below 30): ${selectedPrice} SAR (from ${urlShort})`);
              break;
            } else if (validPrices.length > 0) {
              // إذا لم يكن هناك سعر أقل من 30، نأخذ أصغر سعر منطقي
              const selectedPrice = Math.min(...validPrices);
              productData.price = selectedPrice;
              console.log(`✅ Price found in API: ${selectedPrice} SAR (from ${urlShort})`);
              break;
            } else if (req.isProductApi && prices.length > 0) {
              // إذا كان من product API، نأخذ أصغر سعر
              const selectedPrice = Math.min(...prices);
              productData.price = selectedPrice;
              console.log(`✅ Price found in Product API: ${selectedPrice} (from ${urlShort})`);
              break;
            }
          }
        }
        
        if (productData.price > 0) break;
        
        // محاولة parse JSON كامل والبحث داخله (إذا كان object)
        if (req.fullData && typeof req.fullData === 'object') {
          const findPriceInObject = (obj, depth = 0) => {
            if (depth > 25 || typeof obj !== 'object' || obj === null) return null;
            for (const key in obj) {
              const value = obj[key];
              if (key.toLowerCase().includes('price') && typeof value === 'number' && value > 1 && value < 50000) {
                // تفضيل الأسعار بين 5 و 500 (نطاق منطقي)
                if (value >= 5 && value <= 500) {
                  return value;
                }
              }
              if (typeof value === 'number' && (
                key === 'price' || key === 'goodsPrice' || key === 'salePrice' ||
                key === 'currentPrice' || key === 'retailPrice' || key === 'finalPrice'
              ) && value > 1 && value < 50000) {
                // تفضيل الأسعار بين 5 و 500
                if (value >= 5 && value <= 500) {
                  return value;
                }
              }
              if (typeof value === 'object' && value !== null) {
                const found = findPriceInObject(value, depth + 1);
                if (found) return found;
              }
              if (Array.isArray(value) && value.length > 0) {
                for (let j = 0; j < Math.min(value.length, 20); j++) {
                  if (typeof value[j] === 'object') {
                    const found = findPriceInObject(value[j], depth + 1);
                    if (found) return found;
                  }
                }
              }
            }
            return null;
          };
          const foundPrice = findPriceInObject(req.fullData);
          if (foundPrice) {
            productData.price = foundPrice;
            console.log(`✅ Price found in API JSON: ${foundPrice} (from ${urlShort})`);
            break;
          }
        } else {
          // محاولة parse من string
          try {
            const jsonData = JSON.parse(dataStr);
            const findPriceInObject = (obj, depth = 0) => {
              if (depth > 25 || typeof obj !== 'object' || obj === null) return null;
              for (const key in obj) {
                const value = obj[key];
                if (key.toLowerCase().includes('price') && typeof value === 'number' && value > 1 && value < 50000) {
                  return value;
                }
                if (typeof value === 'object' && value !== null) {
                  const found = findPriceInObject(value, depth + 1);
                  if (found) return found;
                }
              }
              return null;
            };
            const foundPrice = findPriceInObject(jsonData);
            if (foundPrice) {
              productData.price = foundPrice;
              console.log(`✅ Price found in API JSON: ${foundPrice}`);
              break;
            }
          } catch (e) {
            // not valid JSON
          }
        }
      }
    }

    // Debug logging
    console.log(`✅ Puppeteer scraping completed:`);
    console.log(`   - Name: ${productData?.name ? '✅ (' + productData.name.substring(0, 40) + '...)' : '❌'}`);
    console.log(`   - Image: ${productData?.image ? '✅' : '❌'}`);
    console.log(`   - Price: ${productData?.price > 0 ? `✅ ${productData.price}` : '❌'}`);

    // إغلاق المتصفح
    await browser.close();
    browser = null;

    // التحقق من البيانات الأساسية
    if (!productData || !productData.name || productData.name.length < 3) {
      // Fallback: استخدام title من URL أو HTML
      const productIdMatch = cleanUrl.match(/p-(\d+)/);
      if (productIdMatch) {
        // محاولة استخراج الاسم من URL
        const urlPath = urlObj.pathname;
        const pathParts = urlPath
          .replace(/\.html$/, '')
          .replace(/^\/+/, '')
          .split('-');
        
        // إزالة "p" و product ID من النهاية
        const filteredParts = pathParts.filter((part, index) => {
          // إزالة "p" و product ID
          if (part === 'p' || part.match(/^\d+$/)) return false;
          // إزالة "pc" من البداية
          if (index === 0 && part.toLowerCase() === 'pc') return false;
          return part.length > 1;
        });
        
        let nameFromUrl = filteredParts
          .join(' ')
          .replace(/\d+/g, '')
          .trim();
        
        // تنظيف الاسم: إزالة "pc" من البداية
        nameFromUrl = nameFromUrl.replace(/^pc\s+/i, '').trim();
        
        if (nameFromUrl && nameFromUrl.length > 5) {
          if (!productData) productData = { name: '', price: 0, image: '', currency: 'SAR' };
          productData.name = nameFromUrl;
          console.log(`✅ Using name from URL: ${productData.name.substring(0, 40)}`);
        }
      }
    }

    // التحقق من productData
    if (!productData) {
      productData = { name: '', price: 0, image: '', currency: 'SAR' };
    }

    // تحويل العملة إلى SAR إذا لزم الأمر
    let finalPrice = productData.price || 0;
    let finalCurrency = 'SAR';

    if (productData.price && productData.price > 0 && productData.currency !== 'SAR') {
      try {
        const settingsPromise = Settings.getSettings();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const settings = await Promise.race([settingsPromise, timeoutPromise]);
        const currencyRates = settings.pricing?.currencyRates || {};

        const sourceRate = currencyRates[productData.currency] || currencyRates.USD || 250;
        const sarRate = currencyRates.SAR || 67;

        if (productData.currency === 'USD') {
          const usdToSar = sarRate / (currencyRates.USD || 250);
          finalPrice = productData.price * usdToSar;
          console.log(`✅ Converted ${productData.price} ${productData.currency} to ${finalPrice.toFixed(2)} SAR`);
        } else {
          const priceInYER = productData.price * sourceRate;
          finalPrice = priceInYER / sarRate;
          console.log(`✅ Converted ${productData.price} ${productData.currency} to ${finalPrice.toFixed(2)} SAR`);
        }

        finalCurrency = 'SAR';
      } catch (e) {
        console.log(`⚠️ Using default exchange rate (DB timeout or error)`);
        if (productData.currency === 'USD') {
          finalPrice = productData.price * 3.75;
          finalCurrency = 'SAR';
          console.log(`✅ Converted ${productData.price} USD to ${finalPrice.toFixed(2)} SAR (default rate)`);
        }
      }
    }

    // تقريب السعر
    if (finalPrice > 0) {
      finalPrice = Math.round(finalPrice * 100) / 100;
    }

    const duration = Date.now() - startTime;
    console.log(`⚡ Puppeteer scraper completed in ${duration}ms`);

    // التحقق من البيانات
    if (!productData || !productData.name || productData.name.length < 3) {
      // Fallback: استخدام default name
      const defaultName = 'منتج من Shein';
      if (!productData) productData = { name: defaultName, price: 0, image: '', currency: 'SAR' };
      if (!productData.name || productData.name.length < 3) {
        productData.name = defaultName;
      }
      
      // إذا لم يكن هناك اسم صحيح، نعيد خطأ
      if (productData.name === defaultName && finalPrice === 0) {
        return {
          success: false,
          error: 'لم يتم العثور على اسم المنتج',
          details: 'الرجاء التأكد من صحة الرابط',
        };
      }
    }

    if (finalPrice === 0 || !finalPrice) {
      return {
        success: false,
        error: 'لم يتم العثور على سعر المنتج',
        product: {
          name: productData.name || 'منتج من Shein',
          price: 0,
          currency: 'SAR',
          image: productData.image || '',
          store: 'shein',
          url: finalUrl,
        },
        metadata: {
          duration: duration,
          source: 'shein-puppeteer',
        },
      };
    }

    // إرجاع النتيجة
    return {
      success: true,
      product: {
        name: productData.name,
        price: finalPrice || 0,
        currency: finalCurrency,
        image: productData.image || '',
        store: 'shein',
        url: finalUrl,
      },
      metadata: {
        duration: duration,
        source: 'shein-puppeteer',
        originalCurrency: productData.currency || 'SAR',
        originalPrice: productData.price || 0,
      },
    };

  } catch (error) {
    // إغلاق المتصفح في حالة الخطأ
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore
      }
    }

    console.error('❌ Puppeteer scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });

    let errorMessage = 'فشل في جلب بيانات المنتج من شين';

    if (error.message.includes('timeout')) {
      errorMessage = 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
    } else if (error.message.includes('Navigation')) {
      errorMessage = 'فشل في تحميل الصفحة. يرجى التحقق من صحة الرابط.';
    }

    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};

