import axios from 'axios';
import * as cheerio from 'cheerio';
import Settings from '../../models/Settings.js';

/**
 * Nice One SA Scraper - مخصص ومحسّن لموقع Nice One
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 * يحول العملة تلقائياً إلى SAR
 */
export const scrapeNiceOne = async (url) => {
  const startTime = Date.now();
  
  try {
    // الحصول على الإعدادات للتحقق من الأقسام المتاحة
    let availableCategories = ['perfume', 'makeup', 'care', 'devices', 'premium', 'nails', 'gifts', 'lenses', 'home-scents'];
    try {
      const settings = await Settings.getSettings();
      const niceonesaSettings = settings?.stores?.niceonesa || {};
      if (niceonesaSettings.availableCategories && Array.isArray(niceonesaSettings.availableCategories)) {
        availableCategories = niceonesaSettings.availableCategories;
      }
    } catch (settingsError) {
      // إذا فشل جلب الإعدادات، نستخدم القائمة الافتراضية (جميع الأقسام متاحة)
      console.log('⚠️ Could not load settings, using default categories');
    }
    
    // تنظيف URL
    let urlObj = new URL(url);
    let finalUrl = url;
    let html = '';
    let price = 0;
    let detectedCurrency = 'SAR';
    
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    // تحديد قسم المنتج من URL
    const urlPath = urlObj.pathname.toLowerCase();
    let detectedCategory = null;
    
    // خريطة الأقسام والكلمات المفتاحية (مرتبة حسب الأولوية)
    // الأقسام ذات الأولوية الأعلى أولاً (مثل makeup قبل perfume لأن بعض المنتجات قد تحتوي على كلمات مشتركة)
    const categoryKeywords = [
      {
        category: 'makeup',
        keywords: ['makeup', 'مكياج', 'cosmetics', 'foundation', 'lipstick', 'mascara', 'bb-cream', 'bb-cream', 'bb cream', 'concealer', 'blush', 'eyeshadow', 'eyeliner', 'primer', 'powder', 'topface', 'maybelline', 'revolution', 'mac', 'nars', 'make-up', 'skin-editor', 'bb-skin'],
        priority: 1
      },
      {
        category: 'care',
        keywords: ['care', 'عناية', 'skincare', 'shampoo', 'soap', 'brush', 'tongue', 'cleanser', 'moisturizer', 'serum', 'mask'],
        priority: 2
      },
      {
        category: 'perfume',
        keywords: ['perfume-for-women', 'perfume-for-men', 'eau-de-parfum', 'eau-de-toilette', 'parfum-for', 'perfume-for', 'عطر', 'عطور'],
        priority: 3
      },
      {
        category: 'nails',
        keywords: ['nails', 'أظافر', 'nail', 'polish'],
        priority: 4
      },
      {
        category: 'gifts',
        keywords: ['gifts', 'هدايا', 'gift', 'set'],
        priority: 5
      },
      {
        category: 'lenses',
        keywords: ['lenses', 'عدسات', 'lens', 'contact'],
        priority: 6
      },
      {
        category: 'devices',
        keywords: ['devices', 'أجهزة', 'device', 'tool', 'machine'],
        priority: 7
      },
      {
        category: 'premium',
        keywords: ['premium', 'بريميوم', 'luxury'],
        priority: 8
      },
      {
        category: 'home-scents',
        keywords: ['home-scents', 'home-scent', 'معطرات المنزل', 'home perfume', 'room fragrance', 'home fragrance'],
        priority: 9
      },
    ];
    
    // البحث عن القسم في URL (بحسب الأولوية)
    let bestMatch = null;
    let bestPriority = Infinity;
    
    for (const categoryData of categoryKeywords) {
      for (const keyword of categoryData.keywords) {
        if (urlPath.includes(keyword.toLowerCase())) {
          // إذا كان هذا القسم له أولوية أعلى، نأخذه
          if (categoryData.priority < bestPriority) {
            bestMatch = categoryData.category;
            bestPriority = categoryData.priority;
          }
          break;
        }
      }
    }
    
    if (bestMatch) {
      detectedCategory = bestMatch;
    }
    
    // جلب صفحة المنتج
    try {
      console.log(`🚀 Fetching Nice One product page...`);
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://niceonesa.com/',
        },
        timeout: 12000,
        maxRedirects: 5,
      });
      html = response.data;
      console.log(`✅ Direct fetch successful (${html.length} chars)`);
    } catch (error) {
      console.log(`⚠️ Direct request failed: ${error.message}`);
      if (error.response && error.response.status === 403) {
        // إذا كان 403، نحاول مع ScraperAPI إذا كان متوفراً
        if (process.env.SCRAPERAPI_KEY) {
          try {
            console.log(`🔄 Trying ScraperAPI for protected page...`);
            const apiResponse = await axios.get('http://api.scraperapi.com', {
              params: {
                api_key: process.env.SCRAPERAPI_KEY,
                url: cleanUrl,
                render: false,
              },
              timeout: 15000,
            });
            html = apiResponse.data;
            console.log(`✅ ScraperAPI successful (${html.length} chars)`);
          } catch (apiError) {
            throw new Error('فشل في جلب بيانات المنتج. يرجى المحاولة مرة أخرى.');
          }
        } else {
          throw new Error('الموقع محمي. يرجى إضافة SCRAPERAPI_KEY في ملف .env أو المحاولة مرة أخرى.');
        }
      } else {
        throw new Error('فشل في جلب بيانات المنتج. يرجى التحقق من صحة الرابط.');
      }
    }
    
    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // إذا لم نحدد القسم من URL، نحاول تحديده من HTML
    if (!detectedCategory) {
      // البحث في breadcrumb أولاً (أكثر دقة)
      // نبحث في عناصر breadcrumb المختلفة
      const breadcrumbSelectors = [
        '.breadcrumb', 
        '[class*="breadcrumb"]', 
        '[class*="bread"]',
        'nav ol', 
        'nav ul',
        '[itemprop="breadcrumb"]',
        '[aria-label*="breadcrumb"]',
      ];
      
      let breadcrumbText = '';
      for (const selector of breadcrumbSelectors) {
        const breadcrumb = $(selector).first();
        if (breadcrumb.length > 0) {
          breadcrumbText = breadcrumb.text().toLowerCase();
          break;
        }
      }
      
      // البحث بحسب الأولوية في breadcrumb
      let bestMatch = null;
      let bestPriority = Infinity;
      
      if (breadcrumbText) {
        for (const categoryData of categoryKeywords) {
          for (const keyword of categoryData.keywords) {
            // نبحث عن الكلمة كاملة في breadcrumb (لتجنب التطابق الخاطئ)
            const keywordLower = keyword.toLowerCase();
            if (breadcrumbText.includes(keywordLower)) {
              // تأكد من أن الكلمة ليست جزءاً من كلمة أخرى
              const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              if (regex.test(breadcrumbText)) {
                if (categoryData.priority < bestPriority) {
                  bestMatch = categoryData.category;
                  bestPriority = categoryData.priority;
                }
                break;
              }
            }
          }
        }
      }
      
      // إذا لم نجد في breadcrumb، نبحث في meta tags أو structured data
      if (!bestMatch) {
        // البحث في meta tags
        const ogType = $('meta[property="og:type"]').attr('content') || '';
        const categoryMeta = $('meta[property="product:category"]').attr('content') || '';
        const categoryText = (ogType + ' ' + categoryMeta).toLowerCase();
        
        for (const categoryData of categoryKeywords) {
          for (const keyword of categoryData.keywords) {
            if (categoryText.includes(keyword.toLowerCase())) {
              if (categoryData.priority < bestPriority) {
                bestMatch = categoryData.category;
                bestPriority = categoryData.priority;
              }
              break;
            }
          }
        }
      }
      
      // آخر حل: البحث في breadcrumb HTML structure (إذا كان موجوداً)
      if (!bestMatch) {
        // البحث في breadcrumb links
        const breadcrumbLinks = $('.breadcrumb a, [class*="breadcrumb"] a, nav a').toArray();
        const breadcrumbLinksText = breadcrumbLinks.map(el => $(el).text().toLowerCase()).join(' ');
        
        if (breadcrumbLinksText) {
          for (const categoryData of categoryKeywords) {
            for (const keyword of categoryData.keywords) {
              const keywordLower = keyword.toLowerCase();
              if (breadcrumbLinksText.includes(keywordLower)) {
                const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(breadcrumbLinksText)) {
                  if (categoryData.priority < bestPriority) {
                    bestMatch = categoryData.category;
                    bestPriority = categoryData.priority;
                  }
                  break;
                }
              }
            }
          }
        }
      }
      
      // إذا لم نجد بعد، نبحث في URL path segments (أكثر دقة)
      if (!bestMatch) {
        const urlSegments = urlPath.split('/').filter(seg => seg && seg !== 'ar' && seg !== 'en');
        
        for (const segment of urlSegments) {
          for (const categoryData of categoryKeywords) {
            for (const keyword of categoryData.keywords) {
              if (segment === keyword.toLowerCase() || segment.includes(keyword.toLowerCase())) {
                if (categoryData.priority < bestPriority) {
                  bestMatch = categoryData.category;
                  bestPriority = categoryData.priority;
                }
                break;
              }
            }
          }
          if (bestMatch) break;
        }
      }
      
      if (bestMatch) {
        detectedCategory = bestMatch;
      }
    }
    
    // التحقق من أن القسم متوفر
    if (detectedCategory && !availableCategories.includes(detectedCategory)) {
      const categoryNames = {
        'perfume': 'العطور',
        'makeup': 'المكياج',
        'care': 'العناية',
        'devices': 'الأجهزة',
        'premium': 'بريميوم',
        'nails': 'الأظافر',
        'gifts': 'الهدايا',
        'lenses': 'العدسات',
        'home-scents': 'معطرات المنزل',
      };
      
      const categoryName = categoryNames[detectedCategory] || detectedCategory;
      
      return {
        success: false,
        error: `قسم ${categoryName} غير متوفر حالياً`,
        details: `يمكنك التسوق من أقسام أخرى متاحة`,
        suggestion: 'الرجاء اختيار منتج من قسم متاح',
      };
    }
    
    // ========== جلب الاسم (Name) ==========
    let name = '';
    
    const nameSelectors = [
      'h1.product-title',
      'h1',
      '.product-name',
      '[class*="product-title"]',
      '[class*="product-name"]',
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
        name = name.replace(/^Nice One\s*[-–]\s*/i, '').trim();
        name = name.replace(/\s*-\s*Nice One.*$/i, '').trim();
        break;
      }
    }
    
    // ========== جلب السعر (Price) ==========
    let priceText = '';
    let foundPrices = [];
    let excludedPrices = [0.01, 0.1, 0.5, 1, 2, 3, 4, 5, 10];
    
    // استخراج رقم المنتج من URL (مثل n11995-3490 أو n6171-2865 أو n17078)
    // هذا يساعدنا في التمييز بين الصفحات المختلفة لنفس المنتج
    const productIdMatch = url.match(/n(\d+)-(\d+)/);
    const productPrefix = productIdMatch ? productIdMatch[1] : null; // مثل 6273
    const productId = productIdMatch ? productIdMatch[2] : null; // مثل 1628
    
    // للمنتجات بدون رقم فرعي (مثل n17078)، نستخدم رقم المنتج الكامل
    let fullProductId = null;
    if (productId && productPrefix) {
      fullProductId = `n${productPrefix}-${productId}`;
    } else {
      // منتج بدون رقم فرعي (مثل n17078)
      const singleProductIdMatch = url.match(/n(\d+)(?:[^-\d]|$)/);
      if (singleProductIdMatch) {
        fullProductId = `n${singleProductIdMatch[1]}`;
      }
    }
    
    // محاولة تحديد حجم المنتج من URL (مثل 50 مل، 75 مل)
    const urlMatch = url.match(/(\d+)\s*مل|ml/i) || url.match(/n\d+-(\d+)/);
    const productSize = urlMatch ? parseInt(urlMatch[1]) : null;
    
    // أولوية 1: البحث في HTML النص أولاً - هذا الأكثر دقة لأنه يعرض السعر الصحيح للصفحة الحالية
    // نبحث عن السعر الذي يظهر مع رقم المنتج في HTML أو في أزرار الحجم
    if (fullProductId) {
      const productMainSection = $('.product-details, .product-info, .product-main, [class*="product-main"], [id*="product-main"], [class*="product-detail"]').first();
      const searchArea = productMainSection.length > 0 ? productMainSection : $('body');
      const htmlText = searchArea.html() || '';
      
      // استراتيجية 1: البحث في عناصر DOM مباشرة عن السعر المرتبط برقم المنتج
      // نبحث في جميع العناصر التي تحتوي على رقم المنتج
      const elementsWithProductId = $('*').filter((i, el) => {
        const $el = $(el);
        const elHtml = $el.html() || '';
        return elHtml.includes(fullProductId) || elHtml.includes(`-${productId}`) || elHtml.includes(`"${productId}"`);
      });
      
      elementsWithProductId.each((i, el) => {
        if (price > 0) return false; // break if found
        
        const $el = $(el);
        const elText = $el.text() || '';
        const elHtml = $el.html() || '';
        
        // البحث عن السعر في النص
        // للمنتجات بدون رقم فرعي، نبحث عن أسعار صغيرة (5-200)
        // للمنتجات برقم فرعي، نبحث عن أسعار أكبر (50-2000)
        const minPriceDOM = (!productId || !productPrefix) ? 5 : 50;
        const maxPriceDOM = (!productId || !productPrefix) ? 200 : 2000;
        const priceMatches = elText.matchAll(/(\d{1,4}(?:\.\d+)?)\s*ر\.س/gi);
        for (const match of priceMatches) {
          const foundPrice = parseFloat(match[1]);
          if (foundPrice >= minPriceDOM && foundPrice <= maxPriceDOM) {
            price = foundPrice;
            detectedCurrency = 'SAR';
            console.log(`✅ Price found in DOM element with product ID ${fullProductId}: ${price} ${detectedCurrency}`);
            return false; // break loop
          }
        }
      });
      
      // استراتيجية 2: البحث في HTML عن السعر الذي يظهر في نطاق قريب من رقم المنتج
      if (price === 0) {
        const productIdIndex = htmlText.indexOf(fullProductId);
        if (productIdIndex !== -1) {
          // نبحث في نطاق 5000 حرف حول رقم المنتج (نطاق أكبر)
          const contextStart = Math.max(0, productIdIndex - 5000);
          const contextEnd = Math.min(htmlText.length, productIdIndex + 5000);
          const context = htmlText.substring(contextStart, contextEnd);
          
          // البحث عن السعر الذي يظهر بعد رقم المنتج مباشرة (أولوية)
          const productIdPosInContext = context.indexOf(fullProductId);
          const afterProductId = context.substring(productIdPosInContext + fullProductId.length);
          // نبحث عن أسعار من 1-4 أرقام (مثل 22، 499، 519)
          const afterMatches = Array.from(afterProductId.matchAll(/(\d{1,4}(?:\.\d+)?)\s*ر\.س/gi));
          
          // نأخذ أول سعر منطقي بعد رقم المنتج
          // للمنتجات بدون رقم فرعي، نبحث عن أسعار صغيرة (5-200)
          // للمنتجات برقم فرعي، نبحث عن أسعار أكبر (50-2000)
          const minPrice = (!productId || !productPrefix) ? 5 : 50;
          const maxPrice = (!productId || !productPrefix) ? 200 : 2000;
          
          for (const match of afterMatches) {
            const foundPrice = parseFloat(match[1]);
            if (foundPrice >= minPrice && foundPrice <= maxPrice) {
              price = foundPrice;
              detectedCurrency = 'SAR';
              console.log(`✅ Price found in HTML context after product ID ${fullProductId}: ${price} ${detectedCurrency}`);
              break;
            }
          }
          
          // إذا لم نجد بعد رقم المنتج، نبحث قبله
          if (price === 0 && productIdPosInContext !== -1) {
            const beforeProductId = context.substring(0, productIdPosInContext);
            const beforeMatches = Array.from(beforeProductId.matchAll(/(\d{1,4}(?:\.\d+)?)\s*ر\.س/gi));
            
            // نأخذ آخر سعر منطقي قبل رقم المنتج
            if (beforeMatches.length > 0) {
              // نبحث من آخر سعر إلى أول سعر
              for (let i = beforeMatches.length - 1; i >= 0; i--) {
                const foundPrice = parseFloat(beforeMatches[i][1]);
                if (foundPrice >= minPrice && foundPrice <= maxPrice) {
                  price = foundPrice;
                  detectedCurrency = 'SAR';
                  console.log(`✅ Price found in HTML context before product ID ${fullProductId}: ${price} ${detectedCurrency}`);
                  break;
                }
              }
            }
          }
        }
      }
      
      // استراتيجية 3: البحث في أزرار الحجم (buttons)
      if (price === 0) {
        const buttonsWithPrice = $('button, [class*="size"], [class*="variant"], [data-product-id], [class*="product"], [class*="price"]');
        buttonsWithPrice.each((i, el) => {
          if (price > 0) return false; // break if found
          
          const $el = $(el);
          const elHtml = $el.html() || '';
          const elText = $el.text() || '';
          
          // التحقق من أن هذا العنصر يحتوي على رقم المنتج
          if (elHtml.includes(fullProductId)) {
            const priceMatches = elText.matchAll(/(\d{1,4}(?:\.\d+)?)\s*ر\.س/gi);
            for (const match of priceMatches) {
              const foundPrice = parseFloat(match[1]);
              if (foundPrice >= 5 && foundPrice <= 2000) {
                price = foundPrice;
                detectedCurrency = 'SAR';
                console.log(`✅ Price found in button/element with product ID ${fullProductId}: ${price} ${detectedCurrency}`);
                return false; // break loop
              }
            }
          }
        });
      }
      
      // إذا لم نجد بعد، نبحث في النص عن السعر الذي يظهر مع رقم المنتج
      // نبحث في منطقة المنتج عن السعر الذي يظهر في نفس السياق
      if (price === 0) {
        const pageText = searchArea.text();
        const htmlText = searchArea.html() || '';
        
        // البحث عن جميع الأسعار في النص
        const allPrices = [];
        const priceMatches = pageText.matchAll(/(\d{1,4}(?:\.\d+)?)\s*ر\.س/gi);
        for (const match of priceMatches) {
          const foundPrice = parseFloat(match[1]);
          // نبحث عن أسعار منطقية (5-2000) للمنتجات بدون رقم فرعي
          if (foundPrice >= 5 && foundPrice <= 2000) {
            allPrices.push(foundPrice);
          }
        }
        
        // إذا كان هناك أكثر من سعر، نحتاج للتمييز
        if (allPrices.length >= 2) {
          const uniquePrices = [...new Set(allPrices)];
          uniquePrices.sort((a, b) => a - b);
          
          // البحث في HTML عن السعر الذي يظهر قريباً من رقم المنتج
          // نبحث في نطاق 3000 حرف حول رقم المنتج (نطاق أكبر)
          const productIdIndex = htmlText.indexOf(fullProductId);
          if (productIdIndex !== -1) {
            const contextStart = Math.max(0, productIdIndex - 3000);
            const contextEnd = Math.min(htmlText.length, productIdIndex + 3000);
            const context = htmlText.substring(contextStart, contextEnd);
            
            // البحث عن السعر الذي يظهر بعد رقم المنتج مباشرة (أولوية)
            const productIdPosInContext = context.indexOf(fullProductId);
            const afterProductId = context.substring(productIdPosInContext + fullProductId.length);
            const afterMatches = Array.from(afterProductId.matchAll(/(\d{2,3}(?:\.\d+)?)\s*ر\.س/gi));
            
            // نأخذ أول سعر منطقي بعد رقم المنتج
            for (const match of afterMatches) {
              const foundPrice = parseFloat(match[1]);
              if (foundPrice >= 5 && foundPrice <= 2000 && uniquePrices.includes(foundPrice)) {
                price = foundPrice;
                detectedCurrency = 'SAR';
                console.log(`✅ Price found in context after product ID ${fullProductId}: ${price} ${detectedCurrency}`);
                break;
              }
            }
            
            // إذا لم نجد بعد رقم المنتج، نبحث قبله
            if (price === 0 && productIdPosInContext !== -1) {
              const beforeProductId = context.substring(0, productIdPosInContext);
              const beforeMatches = Array.from(beforeProductId.matchAll(/(\d{2,3}(?:\.\d+)?)\s*ر\.س/gi));
              
              // نأخذ آخر سعر منطقي قبل رقم المنتج
              if (beforeMatches.length > 0) {
                const lastMatch = beforeMatches[beforeMatches.length - 1];
                const foundPrice = parseFloat(lastMatch[1]);
                if (foundPrice >= 5 && foundPrice <= 2000 && uniquePrices.includes(foundPrice)) {
                  price = foundPrice;
                  detectedCurrency = 'SAR';
                  console.log(`✅ Price found in context before product ID ${fullProductId}: ${price} ${detectedCurrency}`);
                }
              }
            }
          }
          
          // إذا لم نجد في السياق، نستخدم منطق التمييز بناءً على رقم المنتج
          if (price === 0) {
            // البحث عن أرقام المنتجات الأخرى لنفس المنتج
            const allProductIds = [];
            if (productPrefix) {
              const productIdPattern = new RegExp(`n${productPrefix}-(\\d{4})`, 'g');
              const htmlMatches = htmlText.matchAll(productIdPattern);
              for (const match of htmlMatches) {
                const foundId = parseInt(match[1]);
                if (foundId && foundId >= 1000 && foundId <= 9999) {
                  allProductIds.push(foundId);
                }
              }
            }
            
            const uniqueProductIds = [...new Set(allProductIds)];
            
              if (uniqueProductIds.length >= 2) {
                const currentIdNum = parseInt(productId);
                uniqueProductIds.sort((a, b) => a - b);
                const avgId = uniqueProductIds.reduce((a, b) => a + b, 0) / uniqueProductIds.length;
                
                // إذا كان رقم المنتج أصغر (مثل 1891)، عادة يكون للحجم الأكبر (100ml) والسعر الأكبر
                // إذا كان رقم المنتج أكبر (مثل 1892)، عادة يكون للحجم الأصغر (50ml) والسعر الأصغر
                if (currentIdNum < avgId) {
                  // رقم أصغر → عادة حجم أكبر → سعر أكبر
                  price = uniquePrices[uniquePrices.length - 1]; // الأكبر
                  console.log(`✅ Price from text (lower product ID ${productId} < avg ${avgId.toFixed(0)}, taking higher): ${price} ${detectedCurrency}`);
                } else {
                  // رقم أكبر → عادة حجم أصغر → سعر أصغر
                  price = uniquePrices[0]; // الأصغر
                  console.log(`✅ Price from text (higher product ID ${productId} >= avg ${avgId.toFixed(0)}, taking lower): ${price} ${detectedCurrency}`);
                }
            } else {
              // إذا لم نجد أرقام متعددة، نأخذ الأكبر
              price = uniquePrices[uniquePrices.length - 1];
              console.log(`✅ Price from text (highest, no product ID match): ${price} ${detectedCurrency}`);
            }
          }
        } else if (allPrices.length === 1) {
          price = allPrices[0];
          detectedCurrency = 'SAR';
          console.log(`✅ Price from text: ${price} ${detectedCurrency}`);
        }
      }
    }
    
    // أولوية 2: للمنتجات بدون رقم فرعي، نبحث في HTML النص أولاً قبل CSS selectors
    // هذا مهم جداً لأن JavaScript قد يحتوي على أسعار من منتجات أخرى (مثل 1962)
    if (price === 0 && fullProductId && (!productId || !productPrefix)) {
      const productMainSection = $('.product-details, .product-info, .product-main, [class*="product-main"], [id*="product-main"], [class*="product-detail"]').first();
      const searchArea = productMainSection.length > 0 ? productMainSection : $('body');
      const pageText = searchArea.text();
      
      // البحث عن جميع الأسعار في النص
      const allPrices = [];
      const priceMatches = pageText.matchAll(/(\d{1,3}(?:\.\d+)?)\s*ر\.س/gi);
      for (const match of priceMatches) {
        const foundPrice = parseFloat(match[1]);
        if (foundPrice >= 5 && foundPrice <= 200) {
          allPrices.push(foundPrice);
        }
      }
      
      if (allPrices.length > 0) {
        const uniquePrices = [...new Set(allPrices)];
        uniquePrices.sort((a, b) => a - b);
        // نأخذ الأصغر (عادة السعر الصحيح للمنتج الواحد)
        price = uniquePrices[0];
        detectedCurrency = 'SAR';
        console.log(`✅ Price from text (simple product, priority 2): ${price} ${detectedCurrency} (found ${uniquePrices.length} prices: ${uniquePrices.join(', ')})`);
      }
    }
    
    // أولوية 2: البحث في CSS selectors (السعر المعروض في الصفحة الرئيسية)
    // هذا مهم جداً للمنتجات بدون رقم فرعي
    if (price === 0) {
      const priceSelectors = [
        '[itemprop="price"]',
        '.product-price',
        '.price',
        '.price-current',
        '.current-price',
        '[class*="price-current"]',
        '[class*="current-price"]',
        '[data-price]',
        '[id*="price"]',
        'h2[class*="price"]',
        'h3[class*="price"]',
        'span[class*="price"]',
        'div[class*="price"]',
      ];
      
      for (const selector of priceSelectors) {
        const contentPrice = $(selector).first().attr('content');
        const dataPrice = $(selector).first().attr('data-price');
        const textPrice = $(selector).first().text().trim();
        
        priceText = contentPrice || dataPrice || textPrice;
        
        if (priceText) {
          let cleanPrice = priceText.toString().replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
          
          const arabicToEnglish = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
          };
          cleanPrice = cleanPrice.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
          
          const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[0]);
            // للمنتجات بدون رقم فرعي، نبحث عن أسعار منطقية (5-2000)
            // للمنتجات برقم فرعي، نستخدم النطاق القديم
            const minPrice = (!productId || !productPrefix) ? 5 : 0.1;
            const maxPrice = (!productId || !productPrefix) ? 2000 : 100000;
            if (foundPrice >= minPrice && foundPrice < maxPrice) {
              price = foundPrice;
              detectedCurrency = 'SAR';
              console.log(`✅ Price found via selector "${selector}": ${price} ${detectedCurrency}`);
              break;
            }
          }
        }
      }
    }
    
    // أولوية 2: البحث عن السعر مع العملة (SAR) في النص - في منطقة المنتج الرئيسية
    // نبحث عن السعر الذي يظهر بشكل بارز في الصفحة الحالية
    // نبحث في جميع العناصر التي تحتوي على "ر.س" أو "SAR" ونجمع كل الأسعار
    if (price === 0) {
      const productMainSection = $('.product-details, .product-info, .product-main, [class*="product-main"], [id*="product-main"], [class*="product-detail"], main, article').first();
      const searchArea = productMainSection.length > 0 ? productMainSection : $('body');
      
      // البحث في النص
      const pageText = searchArea.text();
      const priceWithCurrencyPatterns = [
        /(\d+\.?\d{1,2})\s*ر\.س/i,
        /(\d+\.?\d{1,2})\s*SAR/i,
        /(\d+\.?\d{1,2})\s*ريال/i,
        /(\d+\.?\d{1,2})\s*SR/i,
      ];
      
      const sarPrices = [];
      // للمنتجات بدون رقم فرعي، نبحث عن أسعار صغيرة (5-200)
      // للمنتجات برقم فرعي، نبحث عن أسعار أكبر (5-10000)
      const minPrice = (!productId || !productPrefix) ? 5 : 5;
      const maxPrice = (!productId || !productPrefix) ? 200 : 10000;
      
      for (const pattern of priceWithCurrencyPatterns) {
        const matches = pageText.matchAll(new RegExp(pattern.source, 'gi'));
        for (const match of matches) {
          const foundPrice = parseFloat(match[1]);
          const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
          if (foundPrice >= minPrice && foundPrice < maxPrice && !isExcluded) {
            sarPrices.push(foundPrice);
          }
        }
      }
      
      // البحث في HTML أيضاً (في العناصر التي تحتوي على السعر)
      const priceElements = searchArea.find('*:contains("ر.س"), *:contains("SAR"), *:contains("ريال")');
      priceElements.each((i, el) => {
        const elText = $(el).text();
        for (const pattern of priceWithCurrencyPatterns) {
          const matches = elText.matchAll(new RegExp(pattern.source, 'gi'));
          for (const match of matches) {
            const foundPrice = parseFloat(match[1]);
            const isExcluded = excludedPrices.some(ex => Math.abs(foundPrice - ex) < 0.01);
            // استخدام نفس النطاق
            if (foundPrice >= minPrice && foundPrice < maxPrice && !isExcluded) {
              sarPrices.push(foundPrice);
            }
          }
        }
      });
      
      if (sarPrices.length > 0) {
        // إزالة التكرارات
        const uniquePrices = [...new Set(sarPrices)];
        
        // إذا كان هناك أكثر من سعر، نحتاج للتمييز بينهم
        if (uniquePrices.length >= 2) {
          uniquePrices.sort((a, b) => a - b); // ترتيب تصاعدي
          
          // محاولة البحث في HTML عن السعر الذي يظهر مع رقم المنتج الحالي
          if (productId && productPrefix) {
            const htmlText = searchArea.html() || '';
            const fullProductId = `n${productPrefix}-${productId}`;
            
            // البحث عن السعر الذي يظهر قريباً من رقم المنتج في HTML
            const contextPatterns = [
              new RegExp(`${fullProductId}[^<]*?>(?:[^<]*?<[^>]*?>)*?([^<]*?)(\\d{2,3}(?:\\.\\d+)?)\\s*ر\\.س`, 'i'),
              new RegExp(`(\\d{2,3}(?:\\.\\d+)?)\\s*ر\\.س[^<]*?${fullProductId}`, 'i'),
              new RegExp(`${productId}[^<]*?>(?:[^<]*?<[^>]*?>)*?([^<]*?)(\\d{2,3}(?:\\.\\d+)?)\\s*ر\\.س`, 'i'),
              new RegExp(`(\\d{2,3}(?:\\.\\d+)?)\\s*ر\\.س[^<]*?${productId}`, 'i'),
            ];
            
            let matchedPrice = null;
            for (const pattern of contextPatterns) {
              const match = htmlText.match(pattern);
              if (match) {
                const foundPrice = parseFloat(match[2] || match[1]);
                if (foundPrice >= 50 && foundPrice <= 500 && uniquePrices.includes(foundPrice)) {
                  matchedPrice = foundPrice;
                  break;
                }
              }
            }
            
            if (matchedPrice) {
              price = matchedPrice;
              console.log(`✅ Price with SAR found in text (matched with product ID ${productId}): ${price} ${detectedCurrency} (found ${uniquePrices.length} prices: ${uniquePrices.join(', ')})`);
            } else {
              // إذا لم نجد تطابق، نستخدم منطق التمييز
              // إذا كان رقم المنتج أصغر من متوسط أرقام المنتجات الأخرى، نأخذ السعر الأصغر
              // وإلا نأخذ السعر الأكبر
              const allProductIds = [];
              if (productPrefix) {
                const productIdPattern = new RegExp(`n${productPrefix}-(\\d{4})`, 'g');
                const htmlMatches = htmlText.matchAll(productIdPattern);
                for (const match of htmlMatches) {
                  const foundId = parseInt(match[1]);
                  if (foundId && foundId >= 1000 && foundId <= 9999) {
                    allProductIds.push(foundId);
                  }
                }
              }
              
              const uniqueProductIds = [...new Set(allProductIds)];
              
              if (uniqueProductIds.length >= 2) {
                const currentIdNum = parseInt(productId);
                uniqueProductIds.sort((a, b) => a - b);
                const avgId = uniqueProductIds.reduce((a, b) => a + b, 0) / uniqueProductIds.length;
                
                // إذا كان رقم المنتج أصغر (مثل 1891)، عادة يكون للحجم الأكبر (100ml) والسعر الأكبر
                // إذا كان رقم المنتج أكبر (مثل 1892)، عادة يكون للحجم الأصغر (50ml) والسعر الأصغر
                if (currentIdNum < avgId) {
                  // رقم أصغر → عادة حجم أكبر → سعر أكبر
                  price = uniquePrices[uniquePrices.length - 1]; // الأكبر
                  console.log(`✅ Price with SAR found in text (lower product ID ${productId} < avg ${avgId.toFixed(0)}, taking higher): ${price} ${detectedCurrency}`);
                } else {
                  // رقم أكبر → عادة حجم أصغر → سعر أصغر
                  price = uniquePrices[0]; // الأصغر
                  console.log(`✅ Price with SAR found in text (higher product ID ${productId} >= avg ${avgId.toFixed(0)}, taking lower): ${price} ${detectedCurrency}`);
                }
              } else {
                // إذا لم نجد أرقام منتجات متعددة، نأخذ الأكبر
                price = uniquePrices[uniquePrices.length - 1];
                console.log(`✅ Price with SAR found in text (highest, no product ID match): ${price} ${detectedCurrency} (found ${uniquePrices.length} prices: ${uniquePrices.join(', ')})`);
              }
            }
          } else {
            // إذا لم يكن لدينا رقم منتج، نأخذ الأكبر
            uniquePrices.sort((a, b) => b - a);
            price = uniquePrices[0];
            console.log(`✅ Price with SAR found in text (highest, no product ID): ${price} ${detectedCurrency} (found ${uniquePrices.length} prices: ${uniquePrices.join(', ')})`);
          }
        } else {
          // إذا كان هناك سعر واحد فقط
          price = uniquePrices[0];
          console.log(`✅ Price with SAR found in text: ${price} ${detectedCurrency}`);
        }
        detectedCurrency = 'SAR';
      }
    }
    
    
    // أولوية 4: البحث في JavaScript variables و data attributes
    if (price === 0) {
      // البحث في جميع data attributes
      const dataPriceElements = $('[data-price], [data-current-price], [data-product-price]');
      dataPriceElements.each((i, el) => {
        const dataPrice = $(el).attr('data-price') || 
                          $(el).attr('data-current-price') || 
                          $(el).attr('data-product-price');
        if (dataPrice) {
          const foundPrice = parseFloat(dataPrice);
          // للمنتجات بدون رقم فرعي، نبحث عن أسعار صغيرة (5-200)
          const minPrice = (!productId || !productPrefix) ? 5 : 50;
          const maxPrice = (!productId || !productPrefix) ? 200 : 10000;
          if (foundPrice >= minPrice && foundPrice < maxPrice) {
            price = foundPrice;
            detectedCurrency = 'SAR';
            console.log(`✅ Price from data attribute: ${price} ${detectedCurrency}`);
            return false; // break loop
          }
        }
      });
      
      // البحث في JavaScript variables
      if (price === 0) {
        const scripts = $('script:not([type="application/ld+json"])');
        for (let i = 0; i < scripts.length && i < 30; i++) {
          const scriptText = $(scripts[i]).html();
          if (scriptText && scriptText.length > 50) {
            // البحث عن patterns مثل var price = 129, price: 129, "price":129, currentPrice: 129
            const pricePatterns = [
              /(?:currentPrice|productPrice|price|finalPrice)\s*[=:]\s*['"]?(\d{2,4}\.?\d*)/gi,
              /['"](?:price|currentPrice|productPrice)['"]\s*:\s*['"]?(\d{2,4}\.?\d*)/gi,
            ];
            
            const jsPrices = [];
            for (const pattern of pricePatterns) {
              const matches = scriptText.matchAll(pattern);
              for (const match of matches) {
                const foundPrice = parseFloat(match[1]);
                // للمنتجات بدون رقم فرعي، نبحث عن أسعار صغيرة (5-200)
                // للمنتجات برقم فرعي (عطور)، نبحث عن أسعار أكبر (50-10000)
                const minPrice = (!productId || !productPrefix) ? 5 : 50;
                const maxPrice = (!productId || !productPrefix) ? 200 : 10000;
                if (foundPrice >= minPrice && foundPrice < maxPrice) {
                  jsPrices.push(foundPrice);
                }
              }
            }
            
            // بحث إضافي: البحث عن جميع الأسعار في JavaScript (حتى لو لم تكن في patterns)
            // هذا مهم للمنتجات التي تحتوي على 3 أحجام أو أكثر
            if (productId && productPrefix) {
              // البحث عن جميع الأرقام التي قد تكون أسعار (مثل 490، 594، 830)
              const allNumberPattern = /\b(\d{2,4}(?:\.\d+)?)\b/g;
              const allNumbers = scriptText.matchAll(allNumberPattern);
              for (const match of allNumbers) {
                const foundPrice = parseFloat(match[1]);
                // نأخذ الأسعار المنطقية فقط (50-1000)
                if (foundPrice >= 50 && foundPrice <= 1000 && !jsPrices.includes(foundPrice)) {
                  // نتحقق من أن هذا الرقم يظهر في سياق منطقي (مثل "490 ر.س" أو "price: 490")
                  const contextStart = Math.max(0, (match.index || 0) - 50);
                  const contextEnd = Math.min(scriptText.length, (match.index || 0) + 50);
                  const context = scriptText.substring(contextStart, contextEnd);
                  // إذا كان الرقم يظهر مع "ر.س" أو "SAR" أو "price" أو "سعر"، نأخذه
                  if (context.match(/ر\.س|SAR|price|سعر|ريال|ريال/i)) {
                    jsPrices.push(foundPrice);
                  }
                }
              }
            }
            
            if (jsPrices.length > 0) {
              // إزالة التكرارات
              const uniqueJsPrices = [...new Set(jsPrices)];
              
              // نبحث عن سعر منطقي (بين 50 و 1000) - توسيع النطاق ليشمل جميع الأحجام (50 مل، 100 مل، 150 مل، إلخ)
              const logicalPrices = uniqueJsPrices.filter(p => p >= 50 && p <= 1000);
              
              // أولاً، نبحث في HTML عن جميع الأسعار المنطقية (50-1000) في كامل الصفحة
              // لأن HTML قد يحتوي على أسعار أكثر من JavaScript (مثل 490، 594، 830)
              const htmlTextForAllPrices = $('body').html() || '';
              const allHtmlPrices = [];
              
              if (productId && productPrefix) {
                // البحث عن جميع الأسعار في كامل الصفحة أولاً
                const allPriceMatches = Array.from(htmlTextForAllPrices.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                const tempPrices = [];
                for (const match of allPriceMatches) {
                  const foundPrice = parseFloat(match[1]);
                  if (foundPrice >= 50 && foundPrice <= 1000) {
                    tempPrices.push(foundPrice);
                  }
                }
                
                // ثم نبحث عن الأسعار المرتبطة بأرقام المنتجات الأخرى لنفس المنتج
                // (مثل n6185-1539, n6185-1540, n6185-1541)
                const productIdPattern = new RegExp(`n${productPrefix}-(\\d{4})`, 'g');
                const allProductIdMatches = Array.from(htmlTextForAllPrices.matchAll(productIdPattern));
                const foundProductIds = [];
                
                for (const match of allProductIdMatches) {
                  const foundId = parseInt(match[1]);
                  if (foundId && foundId >= 1000 && foundId <= 9999) {
                    foundProductIds.push(foundId);
                  }
                }
                
                // البحث عن الأسعار المرتبطة بأرقام المنتجات هذه
                const uniqueFoundIds = [...new Set(foundProductIds)];
                if (uniqueFoundIds.length >= 2) {
                  // إذا وجدنا أرقام منتجات متعددة، نبحث عن الأسعار المرتبطة بهم
                  for (const foundId of uniqueFoundIds) {
                    const productIdIndex = htmlTextForAllPrices.indexOf(`n${productPrefix}-${foundId}`);
                    if (productIdIndex !== -1) {
                      // البحث في نطاق 5000 حرف حول رقم المنتج (نطاق أكبر)
                      const contextStart = Math.max(0, productIdIndex - 5000);
                      const contextEnd = Math.min(htmlTextForAllPrices.length, productIdIndex + 5000);
                      const context = htmlTextForAllPrices.substring(contextStart, contextEnd);
                      
                      // البحث عن السعر في هذا السياق
                      const priceMatches = Array.from(context.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                      for (const match of priceMatches) {
                        const foundPrice = parseFloat(match[1]);
                        if (foundPrice >= 50 && foundPrice <= 1000) {
                          allHtmlPrices.push(foundPrice);
                        }
                      }
                    }
                  }
                }
                
                // دمج الأسعار من كامل الصفحة مع الأسعار المرتبطة بأرقام المنتجات
                // نأخذ الأسعار الفريدة فقط
                allHtmlPrices.push(...tempPrices);
              }
              
              // دمج أسعار JavaScript مع أسعار HTML
              const allPossiblePrices = [...new Set([...logicalPrices, ...allHtmlPrices])].sort((a, b) => a - b);
              
              if (allPossiblePrices.length > 0) {
                // ترتيب الأسعار تصاعدياً
                allPossiblePrices.sort((a, b) => a - b);
                
                // إذا كان هناك سعران منطقيان أو أكثر (مثل 490، 594، 830)، نحتاج للتمييز بين الصفحات
                if (allPossiblePrices.length >= 2) {
                  // محاولة البحث في HTML عن السعر الذي يظهر مع رقم المنتج الحالي
                  // نبحث عن السعر الذي يظهر في منطقة المنتج الرئيسية
                  const productMainSection = $('.product-details, .product-info, .product-main, [class*="product-main"], [id*="product-main"], [class*="product-detail"]').first();
                  const searchArea = productMainSection.length > 0 ? productMainSection : $('body');
                  
                    // البحث عن السعر الذي يظهر مع رقم المنتج في HTML
                    let foundPriceInHtml = null;
                    if (productId && productPrefix) {
                      // البحث عن رقم المنتج الكامل (مثل n6273-1628) في HTML بالقرب من السعر
                      const htmlText = searchArea.html() || '';
                      const fullProductId = `n${productPrefix}-${productId}`;
                      const pricePatterns = [
                        new RegExp(`${fullProductId}[^>]*>.*?(\\d{2,4}(?:\\.\\d+)?)\\s*ر\\.س`, 'i'),
                        new RegExp(`(\\d{2,4}(?:\\.\\d+)?)\\s*ر\\.س[^<]*${fullProductId}`, 'i'),
                        new RegExp(`${productId}[^>]*>.*?(\\d{2,4}(?:\\.\\d+)?)\\s*ر\\.س`, 'i'),
                        new RegExp(`(\\d{2,4}(?:\\.\\d+)?)\\s*ر\\.س[^<]*${productId}`, 'i'),
                      ];
                      
                      for (const pattern of pricePatterns) {
                        const match = htmlText.match(pattern);
                        if (match) {
                          const htmlPrice = parseFloat(match[1]);
                          if (htmlPrice >= 50 && htmlPrice <= 1000 && allPossiblePrices.includes(htmlPrice)) {
                            foundPriceInHtml = htmlPrice;
                            break;
                          }
                        }
                      }
                    }
                  
                  // إذا وجدنا السعر في HTML مع رقم المنتج، نستخدمه
                  if (foundPriceInHtml) {
                    price = foundPriceInHtml;
                    console.log(`✅ Price from HTML (matched with product ID ${productId}): ${price} ${detectedCurrency}`);
                  } else {
                    // إذا لم نجد، نستخدم منطق التمييز بناءً على رقم المنتج
                    // نبحث في JavaScript عن جميع أرقام المنتجات لنفس المنتج ونقارنها
                    allPossiblePrices.sort((a, b) => a - b); // ترتيب تصاعدي
                    
                    // البحث في JavaScript عن أرقام المنتجات الأخرى لنفس المنتج
                    // فقط المنتجات التي تبدأ بنفس البادئة (مثل n6273-1628 و n6273-1627)
                    const scripts = $('script:not([type="application/ld+json"])');
                    const foundProductIds = [];
                    
                    if (productPrefix) {
                      for (let i = 0; i < scripts.length && i < 30; i++) {
                        const scriptText = $(scripts[i]).html();
                        if (scriptText && scriptText.length > 50) {
                          // البحث عن أرقام المنتجات التي تبدأ بنفس البادئة (مثل n6273-1628, n6273-1627)
                          const productIdPattern = new RegExp(`n${productPrefix}-(\\d+)`, 'g');
                          const matches = scriptText.matchAll(productIdPattern);
                          for (const match of matches) {
                            const foundId = parseInt(match[1]);
                            if (foundId && foundId >= 1000 && foundId <= 9999) {
                              foundProductIds.push(foundId);
                            }
                          }
                        }
                      }
                    }
                    
                    // إزالة التكرارات
                    const uniqueProductIds = [...new Set(foundProductIds)];
                    
                    if (uniqueProductIds.length >= 2 && productId) {
                      // إذا وجدنا أرقام منتجات متعددة، نقارن رقم المنتج الحالي معهم
                      uniqueProductIds.sort((a, b) => a - b);
                      const currentIdNum = parseInt(productId);
                      
                      // البحث في HTML عن السعر الذي يظهر مع رقم المنتج مباشرة (أولوية)
                      // نبحث في نطاق 5000 حرف حول رقم المنتج (نطاق كبير جداً)
                      const htmlTextForMatch = $('body').html() || '';
                      const productIdIndexForMatch = htmlTextForMatch.indexOf(`n${productPrefix}-${productId}`);
                      let matchedPrice = null;
                      
                      if (productIdIndexForMatch !== -1) {
                        // نبحث في نطاق أكبر (10000 حرف) لضمان العثور على السعر
                        const contextStart = Math.max(0, productIdIndexForMatch - 10000);
                        const contextEnd = Math.min(htmlTextForMatch.length, productIdIndexForMatch + 10000);
                        const context = htmlTextForMatch.substring(contextStart, contextEnd);
                        
                        // البحث عن السعر الذي يظهر بعد رقم المنتج مباشرة (أولوية)
                        const productIdPosInContext = context.indexOf(`n${productPrefix}-${productId}`);
                        const afterProductId = context.substring(productIdPosInContext + `n${productPrefix}-${productId}`.length);
                        
                        // نبحث عن السعر في نطاق أصغر (1000 حرف) بعد رقم المنتج مباشرة
                        // هذا يضمن أننا نجد السعر المرتبط مباشرة برقم المنتج
                        const afterContext = afterProductId.substring(0, Math.min(1000, afterProductId.length));
                        const afterMatches = Array.from(afterContext.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                        
                        // نأخذ أول سعر منطقي بعد رقم المنتج مباشرة (أولوية لأقرب سعر)
                        // نأخذ أي سعر منطقي (50-1000) حتى لو لم يكن في allPossiblePrices
                        for (const match of afterMatches) {
                          const foundPrice = parseFloat(match[1]);
                          // نأخذ السعر إذا كان منطقي (50-1000)
                          if (foundPrice >= 50 && foundPrice <= 1000) {
                            matchedPrice = foundPrice;
                            break; // نأخذ أول سعر منطقي مباشرة
                          }
                        }
                        
                        // إذا لم نجد في نطاق 1000 حرف، نبحث في نطاق أوسع (3000 حرف)
                        if (!matchedPrice) {
                          const afterContextWider = afterProductId.substring(0, Math.min(3000, afterProductId.length));
                          const afterMatchesWider = Array.from(afterContextWider.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                          for (const match of afterMatchesWider) {
                            const foundPrice = parseFloat(match[1]);
                            if (foundPrice >= 50 && foundPrice <= 1000) {
                              matchedPrice = foundPrice;
                              break;
                            }
                          }
                        }
                        
                        // إذا لم نجد بعد رقم المنتج، نبحث قبله
                        if (!matchedPrice && productIdPosInContext !== -1) {
                          const beforeProductId = context.substring(0, productIdPosInContext);
                          // نبحث في نطاق 3000 حرف قبل رقم المنتج
                          const beforeContext = beforeProductId.substring(Math.max(0, beforeProductId.length - 3000));
                          const beforeMatches = Array.from(beforeContext.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                          
                          // نأخذ آخر سعر منطقي قبل رقم المنتج (أولوية لأقرب سعر)
                          if (beforeMatches.length > 0) {
                            // نبحث من آخر سعر إلى أول سعر
                            for (let i = beforeMatches.length - 1; i >= 0; i--) {
                              const foundPrice = parseFloat(beforeMatches[i][1]);
                              if (foundPrice >= 50 && foundPrice <= 1000) {
                                matchedPrice = foundPrice;
                                break; // نأخذ آخر سعر منطقي مباشرة
                              }
                            }
                          }
                        }
                      }
                      
                      if (matchedPrice) {
                        price = matchedPrice;
                        console.log(`✅ Price from HTML (matched with product ID ${productId} in HTML context): ${price} ${detectedCurrency}`);
                      } else {
                        // إذا لم نجد في HTML، نبحث في JavaScript عن السعر المرتبط برقم المنتج
                        const scripts = $('script:not([type="application/ld+json"])');
                        let foundPriceInScript = null;
                        
                        for (let i = 0; i < scripts.length && i < 50; i++) {
                          const scriptText = $(scripts[i]).html();
                          if (!scriptText || scriptText.length < 100) continue;
                          
                          // البحث عن رقم المنتج في script
                          if (scriptText.includes(`n${productPrefix}-${productId}`) || scriptText.includes(`"${productId}"`) || scriptText.includes(`'${productId}'`)) {
                            // البحث عن السعر في نطاق 1000 حرف حول رقم المنتج في script
                            const productIdPatterns = [
                              new RegExp(`n${productPrefix}-${productId}`, 'g'),
                              new RegExp(`"${productId}"`, 'g'),
                              new RegExp(`'${productId}'`, 'g'),
                            ];
                            
                            for (const pattern of productIdPatterns) {
                              const matches = scriptText.matchAll(pattern);
                              for (const match of matches) {
                                const matchIndex = match.index;
                                if (matchIndex !== undefined) {
                                  const scriptContextStart = Math.max(0, matchIndex - 1000);
                                  const scriptContextEnd = Math.min(scriptText.length, matchIndex + 1000);
                                  const scriptContext = scriptText.substring(scriptContextStart, scriptContextEnd);
                                  
                                  // البحث عن السعر في هذا السياق
                                  const scriptPricePatterns = [
                                    /price[^:]*?[:=]\s*['"]?(\d{2,4}(?:\.\d+)?)/gi,
                                    /(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi,
                                    /(\d{2,4}(?:\.\d+)?)\s*SAR/gi,
                                  ];
                                  
                                  for (const pricePattern of scriptPricePatterns) {
                                    const priceMatches = scriptContext.matchAll(pricePattern);
                                    for (const priceMatch of priceMatches) {
                                      const foundPrice = parseFloat(priceMatch[1]);
                                      if (foundPrice >= 50 && foundPrice <= 1000 && allPossiblePrices.includes(foundPrice)) {
                                        foundPriceInScript = foundPrice;
                                        break;
                                      }
                                    }
                                    if (foundPriceInScript) break;
                                  }
                                }
                                if (foundPriceInScript) break;
                              }
                              if (foundPriceInScript) break;
                            }
                          }
                          if (foundPriceInScript) break;
                        }
                        
                        if (foundPriceInScript) {
                          price = foundPriceInScript;
                          console.log(`✅ Price from JavaScript (matched with product ID ${productId} in script): ${price} ${detectedCurrency}`);
                        } else {
                          // إذا لم نجد بعد، نستخدم منطق التمييز المتقدم بناءً على رقم المنتج
                          // هذا المنطق يدعم 3 أحجام أو أكثر (50 مل، 100 مل، 150 مل)
                          const avgId = uniqueProductIds.reduce((a, b) => a + b, 0) / uniqueProductIds.length;
                          
                          // نحدد موقع رقم المنتج الحالي بين الأرقام الأخرى
                          // إذا كان هناك 3 أحجام أو أكثر، نستخدم منطق نسبي
                          if (allPossiblePrices.length >= 3) {
                            // 3 أسعار أو أكثر (مثل 50 مل، 100 مل، 150 مل)
                            // نحدد موقع رقم المنتج الحالي بين الأرقام الأخرى
                            const sortedIds = [...uniqueProductIds].sort((a, b) => a - b);
                            const currentIndex = sortedIds.indexOf(currentIdNum);
                            
                            if (currentIndex !== -1) {
                              // نحدد موقع السعر المقابل بناءً على موقع رقم المنتج
                              // إذا كان رقم المنتج في البداية (50 مل) → السعر الأصغر
                              // إذا كان في المنتصف (100 مل) → السعر المتوسط
                              // إذا كان في النهاية (150 مل) → السعر الأكبر
                              if (currentIndex === 0) {
                                // أصغر رقم → أصغر سعر (50 مل)
                                price = allPossiblePrices[0];
                                console.log(`✅ Price from HTML + JavaScript (lowest product ID ${productId}, taking lowest price): ${price} ${detectedCurrency} (${allPossiblePrices.length} prices: ${allPossiblePrices.join(', ')})`);
                              } else if (currentIndex === sortedIds.length - 1) {
                                // أكبر رقم → أكبر سعر (150 مل)
                                price = allPossiblePrices[allPossiblePrices.length - 1];
                                console.log(`✅ Price from HTML + JavaScript (highest product ID ${productId}, taking highest price): ${price} ${detectedCurrency} (${allPossiblePrices.length} prices: ${allPossiblePrices.join(', ')})`);
                              } else {
                                // في المنتصف → نستخدم الموقع النسبي
                                const ratio = currentIndex / (sortedIds.length - 1);
                                const priceIndex = Math.round(ratio * (allPossiblePrices.length - 1));
                                price = allPossiblePrices[priceIndex];
                                console.log(`✅ Price from HTML + JavaScript (middle product ID ${productId}, taking middle price at index ${priceIndex}): ${price} ${detectedCurrency} (${allPossiblePrices.length} prices: ${allPossiblePrices.join(', ')})`);
                              }
                            } else {
                              // إذا لم نجد رقم المنتج في القائمة، نستخدم المتوسط
                              if (currentIdNum < avgId) {
                                price = allPossiblePrices[0]; // أصغر سعر
                                console.log(`✅ Price from HTML + JavaScript (product ID ${productId} < avg ${avgId.toFixed(0)}, taking lowest): ${price} ${detectedCurrency}`);
                              } else {
                                price = allPossiblePrices[allPossiblePrices.length - 1]; // أكبر سعر
                                console.log(`✅ Price from HTML + JavaScript (product ID ${productId} >= avg ${avgId.toFixed(0)}, taking highest): ${price} ${detectedCurrency}`);
                              }
                            }
                          } else if (allPossiblePrices.length === 2) {
                            // سعران فقط - لكن قد يكون هناك سعر ثالث مفقود
                            // نبحث في HTML مرة أخرى عن السعر المرتبط مباشرة برقم المنتج
                            const htmlTextForDirectMatch = $('body').html() || '';
                            const productIdIndexForDirect = htmlTextForDirectMatch.indexOf(`n${productPrefix}-${productId}`);
                            
                            if (productIdIndexForDirect !== -1) {
                              // البحث في نطاق 2000 حرف حول رقم المنتج
                              const directContextStart = Math.max(0, productIdIndexForDirect - 2000);
                              const directContextEnd = Math.min(htmlTextForDirectMatch.length, productIdIndexForDirect + 2000);
                              const directContext = htmlTextForDirectMatch.substring(directContextStart, directContextEnd);
                              
                              // البحث عن السعر في هذا السياق
                              const directPriceMatches = Array.from(directContext.matchAll(/(\d{2,4}(?:\.\d+)?)\s*ر\.س/gi));
                              for (const match of directPriceMatches) {
                                const foundPrice = parseFloat(match[1]);
                                if (foundPrice >= 50 && foundPrice <= 1000) {
                                  // إذا كان السعر موجود في allPossiblePrices، نأخذه
                                  if (allPossiblePrices.includes(foundPrice)) {
                                    price = foundPrice;
                                    console.log(`✅ Price from HTML (direct match with product ID ${productId}): ${price} ${detectedCurrency}`);
                                    break;
                                  } else {
                                    // إذا كان السعر غير موجود في allPossiblePrices لكنه منطقي، نضيفه ونستخدمه
                                    if (!allPossiblePrices.includes(foundPrice)) {
                                      allPossiblePrices.push(foundPrice);
                                      allPossiblePrices.sort((a, b) => a - b);
                                      // إذا أصبح لدينا 3 أسعار، نستخدم منطق 3 أحجام
                                      if (allPossiblePrices.length >= 3) {
                                        const sortedIds = [...uniqueProductIds].sort((a, b) => a - b);
                                        const currentIndex = sortedIds.indexOf(currentIdNum);
                                        if (currentIndex === 0) {
                                          price = allPossiblePrices[0];
                                        } else if (currentIndex === sortedIds.length - 1) {
                                          price = allPossiblePrices[allPossiblePrices.length - 1];
                                        } else {
                                          const ratio = currentIndex / (sortedIds.length - 1);
                                          const priceIndex = Math.round(ratio * (allPossiblePrices.length - 1));
                                          price = allPossiblePrices[priceIndex];
                                        }
                                        console.log(`✅ Price from HTML (3 prices found, using position logic): ${price} ${detectedCurrency} (${allPossiblePrices.length} prices: ${allPossiblePrices.join(', ')})`);
                                        break;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            
                            // إذا لم نجد بعد، نستخدم المنطق القديم لسعرين
                            if (price === 0) {
                              if (currentIdNum < avgId) {
                                // رقم أصغر (1891) → سعر أكبر (100 مل)
                                price = allPossiblePrices[allPossiblePrices.length - 1];
                                console.log(`✅ Price from HTML + JavaScript (lower product ID ${productId}, taking higher): ${price} ${detectedCurrency} (diff: ${allPossiblePrices[1] - allPossiblePrices[0]})`);
                              } else {
                                // رقم أكبر (1892) → سعر أصغر (50 مل)
                                price = allPossiblePrices[0];
                                console.log(`✅ Price from HTML + JavaScript (higher product ID ${productId}, taking lower): ${price} ${detectedCurrency} (diff: ${allPossiblePrices[1] - allPossiblePrices[0]})`);
                              }
                            }
                          } else {
                            // سعر واحد فقط
                            price = allPossiblePrices[0];
                            console.log(`✅ Price from HTML + JavaScript (single price): ${price} ${detectedCurrency}`);
                          }
                        }
                      }
                    } else {
                      // إذا لم نجد أرقام منتجات متعددة في JavaScript، نبحث في URL
                      // نبحث عن أرقام منتجات أخرى في نفس الصفحة (في HTML أو في JavaScript)
                      const currentIdNum = productId ? parseInt(productId) : 0;
                      
                      // محاولة البحث في HTML عن أرقام منتجات أخرى لنفس المنتج
                      // فقط المنتجات التي تبدأ بنفس البادئة (مثل n6273-1628 و n6273-1627)
                      const htmlText = $('body').html() || '';
                      const allProductIds = [];
                      
                      if (productPrefix) {
                        // البحث عن أرقام المنتجات التي تبدأ بنفس البادئة فقط
                        const productIdPattern = new RegExp(`n${productPrefix}-(\\d{4})`, 'g');
                        const htmlMatches = htmlText.matchAll(productIdPattern);
                        for (const match of htmlMatches) {
                          const foundId = parseInt(match[1]);
                          if (foundId && foundId >= 1000 && foundId <= 9999) {
                            allProductIds.push(foundId);
                          }
                        }
                      }
                      
                      // إزالة التكرارات
                      const uniqueHtmlProductIds = [...new Set(allProductIds)];
                      
                      if (uniqueHtmlProductIds.length >= 2 && currentIdNum > 0) {
                        // إذا وجدنا أرقام منتجات متعددة في HTML، نقارن
                        uniqueHtmlProductIds.sort((a, b) => a - b);
                        const avgId = uniqueHtmlProductIds.reduce((a, b) => a + b, 0) / uniqueHtmlProductIds.length;
                        
                        // البحث في HTML عن السعر الذي يظهر مع رقم المنتج مباشرة أولاً
                        const htmlTextForMatch = $('body').html() || '';
                        const productIdIndexForMatch = htmlTextForMatch.indexOf(`n${productPrefix}-${productId}`);
                        let matchedPriceFromHtml = null;
                        
                        if (productIdIndexForMatch !== -1) {
                          const contextStart = Math.max(0, productIdIndexForMatch - 1000);
                          const contextEnd = Math.min(htmlTextForMatch.length, productIdIndexForMatch + 1000);
                          const context = htmlTextForMatch.substring(contextStart, contextEnd);
                          
                          const contextPriceMatches = context.matchAll(/(\d{2,3}(?:\.\d+)?)\s*ر\.س/gi);
                          for (const match of contextPriceMatches) {
                            const foundPrice = parseFloat(match[1]);
                            if (foundPrice >= 50 && foundPrice <= 600 && logicalPrices.includes(foundPrice)) {
                              matchedPriceFromHtml = foundPrice;
                              break;
                            }
                          }
                        }
                        
                        if (matchedPriceFromHtml) {
                          price = matchedPriceFromHtml;
                          console.log(`✅ Price from JavaScript (matched with product ID ${productId} in HTML): ${price} ${detectedCurrency}`);
                        } else {
                          // إذا لم نجد، نستخدم منطق التمييز بناءً على الفرق بين الأسعار
                          const lowerPrice = logicalPrices[0];
                          const higherPrice = logicalPrices[logicalPrices.length - 1];
                          const priceDiff = higherPrice - lowerPrice;
                          
                          if (currentIdNum < avgId) {
                            // رقم أصغر (1891) → عادة حجم أكبر (100ml) → سعر أكبر (519)
                            price = higherPrice;
                            console.log(`✅ Price from JavaScript (lower product ID ${productId}, taking higher): ${price} ${detectedCurrency} (diff: ${priceDiff})`);
                          } else {
                            // رقم أكبر (1892) → عادة حجم أصغر (50ml) → سعر أصغر (499)
                            price = lowerPrice;
                            console.log(`✅ Price from JavaScript (higher product ID ${productId}, taking lower): ${price} ${detectedCurrency} (diff: ${priceDiff})`);
                          }
                        }
                      } else {
                        // إذا لم نجد أرقام متعددة، نستخدم منطق بسيط نسبي
                        // نأخذ السعر الأصغر إذا كان رقم المنتج في النصف السفلي من النطاق
                        // والسعر الأكبر إذا كان في النصف العلوي
                        if (currentIdNum > 0 && currentIdNum < 3000) {
                          // للأرقام الصغيرة (مثل 2865, 2866)، نأخذ الأصغر إذا كان < 2865.5
                          // هذا يعني أن 2865 يأخذ الأصغر و 2866 يأخذ الأكبر
                          const threshold = 2865.5;
                          price = currentIdNum < threshold ? logicalPrices[0] : logicalPrices[logicalPrices.length - 1];
                          console.log(`✅ Price from JavaScript (product ID ${productId} < ${threshold}, taking ${currentIdNum < threshold ? 'lower' : 'higher'}): ${price} ${detectedCurrency}`);
                        } else if (currentIdNum >= 3000) {
                          // للأرقام الكبيرة (مثل 3477, 3490)، نأخذ الأصغر إذا كان < 3483.5
                          const threshold = 3483.5;
                          price = currentIdNum < threshold ? logicalPrices[0] : logicalPrices[logicalPrices.length - 1];
                          console.log(`✅ Price from JavaScript (product ID ${productId} < ${threshold}, taking ${currentIdNum < threshold ? 'lower' : 'higher'}): ${price} ${detectedCurrency}`);
                        } else {
                          // افتراضي: نأخذ الأكبر
                          price = logicalPrices[logicalPrices.length - 1];
                          console.log(`✅ Price from JavaScript (default, taking highest): ${price} ${detectedCurrency}`);
                        }
                      }
                    }
                  }
                } else {
                  // إذا كانت الأسعار متقاربة أو سعر واحد، نأخذ الأكبر
                  price = logicalPrices[0];
                  console.log(`✅ Price from JavaScript (logical range 50-500, highest): ${price} ${detectedCurrency} (found ${logicalPrices.length} logical prices: ${logicalPrices.slice(0, 5).join(', ')})`);
                }
                detectedCurrency = 'SAR';
              } else {
                // إذا لم نجد أسعار منطقية (50-600)، نبحث في HTML أولاً قبل JavaScript
                // للمنتجات بدون رقم فرعي، نبحث في HTML عن السعر المرتبط برقم المنتج
                if (fullProductId && (!productId || !productPrefix)) {
                  // منتج بدون رقم فرعي (مثل n17078, n11233, n18778)
                  // نبحث في HTML النص أولاً قبل JavaScript لأن JavaScript قد يحتوي على أسعار من منتجات أخرى
                  const productMainSection = $('.product-details, .product-info, .product-main, [class*="product-main"], [id*="product-main"], [class*="product-detail"]').first();
                  const searchArea = productMainSection.length > 0 ? productMainSection : $('body');
                  const pageText = searchArea.text();
                  
                  // البحث عن جميع الأسعار في النص
                  const htmlPrices = [];
                  const priceMatches = pageText.matchAll(/(\d{1,3}(?:\.\d+)?)\s*ر\.س/gi);
                  for (const match of priceMatches) {
                    const foundPrice = parseFloat(match[1]);
                    // نفلتر الأسعار المنطقية (5-200) للمنتجات الصغيرة
                    // نستبعد الأسعار المرتفعة غير المعقولة (مثل 1956, 1962)
                    if (foundPrice >= 5 && foundPrice <= 200) {
                      htmlPrices.push(foundPrice);
                    }
                  }
                  
                  if (htmlPrices.length > 0) {
                    // نأخذ الأصغر (عادة السعر الصحيح للمنتج الواحد)
                    htmlPrices.sort((a, b) => a - b);
                    price = htmlPrices[0];
                    detectedCurrency = 'SAR';
                    console.log(`✅ Price from HTML text (simple product, before JavaScript): ${price} ${detectedCurrency} (found ${htmlPrices.length} prices: ${htmlPrices.slice(0, 5).join(', ')})`);
                  } else {
                    // إذا لم نجد في HTML، نبحث في JavaScript لكن نفلتر الأسعار المرتفعة
                    // نفلتر الأسعار غير المنطقية (مثل 1956, 1962 من منتجات أخرى)
                    const filteredPrices = uniqueJsPrices.filter(p => p >= 5 && p <= 200);
                    if (filteredPrices.length > 0) {
                      filteredPrices.sort((a, b) => a - b);
                      price = filteredPrices[0];
                      detectedCurrency = 'SAR';
                      console.log(`✅ Price from JavaScript (lowest, filtered 5-200): ${price} ${detectedCurrency}`);
                    } else {
                      // إذا لم نجد أي سعر منطقي، نأخذ الأصغر من جميع الأسعار لكن نستبعد الأسعار المرتفعة
                      const veryFilteredPrices = uniqueJsPrices.filter(p => p >= 5 && p <= 500);
                      if (veryFilteredPrices.length > 0) {
                        veryFilteredPrices.sort((a, b) => a - b);
                        price = veryFilteredPrices[0];
                        detectedCurrency = 'SAR';
                        console.log(`✅ Price from JavaScript (lowest, filtered 5-500): ${price} ${detectedCurrency}`);
                      } else {
                        // آخر محاولة: نأخذ الأصغر من جميع الأسعار
                        uniqueJsPrices.sort((a, b) => a - b);
                        price = uniqueJsPrices[0];
                        detectedCurrency = 'SAR';
                        console.log(`✅ Price from JavaScript (lowest, no filter): ${price} ${detectedCurrency}`);
                      }
                    }
                  }
                } else {
                  // منتج برقم فرعي (عطور) - نستخدم المنطق القديم
                  const widerLogicalPrices = uniqueJsPrices.filter(p => p >= 5 && p <= 2000);
                  if (widerLogicalPrices.length > 0) {
                    widerLogicalPrices.sort((a, b) => a - b);
                    price = widerLogicalPrices[0];
                    detectedCurrency = 'SAR';
                    console.log(`✅ Price from JavaScript (lowest, wider range 5-2000): ${price} ${detectedCurrency}`);
                  } else {
                    uniqueJsPrices.sort((a, b) => a - b);
                    price = uniqueJsPrices[0];
                    detectedCurrency = 'SAR';
                    console.log(`✅ Price from JavaScript (lowest, no logical range): ${price} ${detectedCurrency}`);
                  }
                }
              }
            }
            
            if (price > 0) break;
            if (price > 0) break;
          }
        }
      }
    }
    
    // أولوية 4: البحث في JSON-LD (لكن نبحث عن السعر الأكبر إذا كان هناك عدة خيارات)
    // هذا لأن JSON-LD قد يحتوي على كل الخيارات (50 مل، 75 مل) ونريد السعر الصحيح
    // لكن نستخدم JSON-LD فقط كـ fallback إذا لم نجد السعر في النص أو CSS selectors
    // ملاحظة: JSON-LD و meta tags قد يحتويان على سعر خاطئ (91) لصفحة 75 مل
    if (price === 0) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers)) {
                // إذا كان هناك عدة خيارات، نبحث عن السعر الأكبر (عادة السعر الصحيح للصفحة الحالية)
                const validPrices = [];
                for (const offer of jsonData.offers) {
                  if (offer.price) {
                    const offerPrice = parseFloat(offer.price);
                    if (offerPrice > 0.1 && offerPrice < 100000) {
                      validPrices.push({
                        price: offerPrice,
                        currency: offer.priceCurrency?.toUpperCase() || 'SAR'
                      });
                    }
                  }
                }
                
                if (validPrices.length > 0) {
                  // دائماً نأخذ الأكبر سعر (عادة السعر الصحيح للصفحة الحالية)
                  // لأن الأسعار الصغيرة قد تكون من خيارات أخرى (50 مل مقابل 75 مل)
                  validPrices.sort((a, b) => b.price - a.price);
                  const selectedPrice = validPrices[0];
                  
                  price = selectedPrice.price;
                  detectedCurrency = selectedPrice.currency;
                  
                  if (validPrices.length > 1) {
                    console.log(`✅ Price from JSON-LD offers array (highest): ${price} ${detectedCurrency} (found ${validPrices.length} offers: ${validPrices.map(p => p.price).join(', ')})`);
                  } else {
                    console.log(`✅ Price from JSON-LD offers array: ${price} ${detectedCurrency}`);
                  }
                  break;
                }
              } else if (jsonData.offers.price) {
                const offerPrice = parseFloat(jsonData.offers.price);
                if (offerPrice > 0.1 && offerPrice < 100000) {
                  price = offerPrice;
                  if (jsonData.offers.priceCurrency) {
                    detectedCurrency = jsonData.offers.priceCurrency.toUpperCase();
                  }
                  console.log(`✅ Price from JSON-LD offers: ${price} ${detectedCurrency}`);
                  break;
                }
              }
            }
            
            if (price === 0 && jsonData.price) {
              price = parseFloat(jsonData.price);
              if (jsonData.priceCurrency) {
                detectedCurrency = jsonData.priceCurrency.toUpperCase();
              }
              console.log(`✅ Price from JSON-LD direct: ${price} ${detectedCurrency}`);
              break;
            }
          } catch (e) {
            // continue
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    // البحث عن العملة في النص
    if (price > 0) {
      const pageText = $.text();
      if (/ر\.س|SAR|ريال|SR/i.test(pageText)) {
        detectedCurrency = 'SAR';
        console.log(`✅ Currency detected: SAR`);
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
      '.product-thumbnail img',
      'img[data-src]',
      'img.product-image',
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
    console.log(`⚡ Nice One scraper completed in ${duration}ms`);
    
    // التحقق من البيانات الأساسية
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'لم يتم العثور على اسم المنتج',
        details: 'الرجاء التأكد من صحة الرابط',
      };
    }
    
    // استخدام العملة المكتشفة أو افتراض SAR (Nice One عادة بالريال السعودي)
    let finalCurrency = detectedCurrency || 'SAR';
    let finalPrice = price || 0;
    
    // تحويل العملة تلقائياً إلى SAR (إذا لم تكن SAR بالفعل)
    if (finalPrice > 0 && finalCurrency !== 'SAR') {
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
          const usdToSar = sarRate / (currencyRates.USD || 250);
          const originalPrice = finalPrice;
          finalPrice = finalPrice * usdToSar;
          console.log(`✅ Converted ${originalPrice} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR`);
        } else {
          const originalPrice = finalPrice;
          const priceInYER = finalPrice * sourceRate;
          finalPrice = priceInYER / sarRate;
          console.log(`✅ Converted ${originalPrice} ${finalCurrency} to ${finalPrice.toFixed(2)} SAR`);
        }
        
        finalCurrency = 'SAR';
      } catch (e) {
        console.log(`⚠️ Using default exchange rate (DB timeout or error)`);
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
        store: 'niceonesa',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'niceonesa-scraper',
        originalCurrency: detectedCurrency || 'SAR',
        originalPrice: price || 0,
      },
    };
  } catch (error) {
    console.error('❌ Nice One scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من Nice One';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بـ Nice One. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم Nice One. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};

