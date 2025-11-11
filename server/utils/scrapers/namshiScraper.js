import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Namshi Scraper - مخصص ومحسّن لموقع نمشي
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 */
export const scrapeNamshi = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    let html = '';
    
    // محاولة 1: جلب مباشر مع headers محسّنة لنمشي
    try {
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.namshi.com/',
          'Cache-Control': 'no-cache',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
        timeout: 12000,
        maxRedirects: 5,
      });
      html = response.data;
      console.log(`✅ Direct fetch successful (${html.length} chars)`);
    } catch (error) {
      console.log(`⚠️ Direct request failed: ${error.message}`);
    }

    // محاولة 2: ScraperAPI فقط إذا فشل الجلب المباشر
    if ((!html || html.length < 100) && process.env.SCRAPERAPI_KEY) {
      try {
        console.log(`🔄 Trying ScraperAPI for Namshi...`);
        const response = await axios.get('http://api.scraperapi.com', {
          params: {
            api_key: process.env.SCRAPERAPI_KEY,
            url: cleanUrl,
            render: false, // بدون render أسرع
          },
          timeout: 15000,
        });
        html = response.data;
        console.log(`✅ ScraperAPI successful (${html.length} chars)`);
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
      }
    }

    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // ========== جلب الاسم (Name) ==========
    let name = '';
    
    const nameSelectors = [
      'h1[data-testid="product-name"]',
      'h1.product-name',
      'h1[class*="productName"]',
      'h1[class*="ProductName"]',
      'h1[class*="product-title"]',
      'h1[class*="ProductTitle"]',
      '.product-title h1',
      '.product-name h1',
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
        // إزالة "نمشي" من البداية إذا كان موجوداً
        name = name.replace(/^نمشي\s*[-–]\s*/i, '').trim();
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
    
    if (!name || name.length < 3) {
      throw new Error('لم يتم العثور على اسم المنتج');
    }
    
    // ========== جلب السعر (Price) ==========
    let price = 0;
    let detectedCurrency = 'SAR';
    
    // قائمة الأسعار المستبعدة (غير منطقية)
    const excludedPrices = [0, 0.01, 0.1, 0.5, 1, 2, 3, 4, 5, 10, 100, 1000, 10000];
    
    // دالة للتحقق من أن السعر منطقي
    const isValidPrice = (p) => {
      if (!p || p <= 0) return false;
      if (excludedPrices.includes(p)) return false;
      // نطاق منطقي لأسعار المنتجات في نمشي: من 5 إلى 50000 ريال
      if (p < 5 || p > 50000) return false;
      return true;
    };
    
    // استراتيجيات متعددة لجلب السعر
    // الأولوية 0: البحث في منطقة المنتج فقط (أكثر دقة)
    const productSection = $('.product, [class*="product"], [id*="product"], main, .main-content').first();
    const productText = productSection.length > 0 ? productSection.text() : $('body').text();
    
    // البحث عن السعر مع "ريال" أو "SAR" في منطقة المنتج
    const priceWithCurrencyPatterns = [
      /([\d,]+\.?\d*)\s*(?:ريال|SAR|ر\.س|ر\.س\.)/gi,
      /(?:ريال|SAR|ر\.س|ر\.س\.)\s*([\d,]+\.?\d*)/gi,
    ];
    
    let foundPricesWithCurrency = [];
    for (const pattern of priceWithCurrencyPatterns) {
      const matches = productText.matchAll(pattern);
      for (const match of matches) {
        const priceValue = parseFloat((match[1] || match[0]).toString().replace(/[^\d.,]/g, '').replace(/,/g, ''));
        if (isValidPrice(priceValue)) {
          foundPricesWithCurrency.push(priceValue);
        }
      }
    }
    
    // إزالة التكرارات
    foundPricesWithCurrency = [...new Set(foundPricesWithCurrency)];
    
    if (foundPricesWithCurrency.length > 0) {
      // نأخذ الأصغر (عادة هو السعر الحالي/المخفض)
      foundPricesWithCurrency.sort((a, b) => a - b);
      price = foundPricesWithCurrency[0];
      detectedCurrency = 'SAR';
      console.log(`✅ Price from HTML text (with currency): ${price} SAR (found ${foundPricesWithCurrency.length} prices)`);
    }
    
    // الأولوية 1: CSS Selectors المحددة للسعر (أكثر دقة)
    if (!price || price === 0) {
      const specificPriceSelectors = [
        '[data-testid="product-price"]',
        '[data-testid="price"]',
        '[itemprop="price"]',
      ];
      
      // أولاً: البحث في selectors محددة
      for (const selector of specificPriceSelectors) {
        const priceElement = $(selector).first();
        if (priceElement.length > 0) {
          let priceText = priceElement.text().trim() || priceElement.attr('content') || '';
          
          // استخراج السعر من النص (أول رقم منطقي)
          const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
          if (priceMatch) {
            const extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (isValidPrice(extractedPrice)) {
              price = extractedPrice;
              
              // اكتشاف العملة من النص
              if (priceText.toLowerCase().includes('sar') || priceText.toLowerCase().includes('ريال') || priceText.toLowerCase().includes('ر.س')) {
                detectedCurrency = 'SAR';
              } else if (priceText.toLowerCase().includes('usd') || priceText.toLowerCase().includes('$')) {
                detectedCurrency = 'USD';
              } else if (priceText.toLowerCase().includes('aed') || priceText.toLowerCase().includes('درهم')) {
                detectedCurrency = 'AED';
              }
              break;
            }
          }
        }
      }
    }
    
    // الأولوية 2: البحث في selectors عامة (إذا لم نجد في المحددة)
    if (!price || price === 0) {
      const generalPriceSelectors = [
        '.product-price',
        '.price-current',
        '.current-price',
        '.sale-price',
        '.final-price',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
      ];
      
      let allFoundPrices = [];
      
      for (const selector of generalPriceSelectors) {
        const priceElements = $(selector);
        priceElements.each((i, el) => {
          let priceText = $(el).text().trim() || $(el).attr('content') || '';
          
          // استخراج السعر من النص (أول رقم منطقي)
          const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
          if (priceMatch) {
            const extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (isValidPrice(extractedPrice)) {
              allFoundPrices.push({
                price: extractedPrice,
                text: priceText,
                selector: selector
              });
            }
          }
        });
      }
      
      // إذا وجدنا أسعار متعددة، نأخذ الأكثر منطقية
      if (allFoundPrices.length > 0) {
        // تصفية الأسعار: نأخذ الأكثر تكراراً أو الأوسط (ليس الأصغر دائماً)
        allFoundPrices.sort((a, b) => a.price - b.price);
        
        // إذا كان هناك أكثر من سعر، نأخذ الأصغر (عادة هو السعر الحالي/المخفض)
        price = allFoundPrices[0].price;
        
        // اكتشاف العملة
        const priceText = allFoundPrices[0].text.toLowerCase();
        if (priceText.includes('sar') || priceText.includes('ريال') || priceText.includes('ر.س')) {
          detectedCurrency = 'SAR';
        } else if (priceText.includes('usd') || priceText.includes('$')) {
          detectedCurrency = 'USD';
        } else if (priceText.includes('aed') || priceText.includes('درهم')) {
          detectedCurrency = 'AED';
        }
      }
    }
    
    // الأولوية 3: JSON-LD structured data (إذا لم نجد في CSS)
    if (!price || price === 0) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
        for (const script of jsonLdScripts) {
          try {
            const jsonData = JSON.parse($(script).html());
            if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'Offer') {
              const offers = jsonData.offers || (jsonData['@type'] === 'Offer' ? [jsonData] : []);
              for (const offer of offers) {
                if (offer.price) {
                  const offerPrice = parseFloat(offer.price);
                  const currency = offer.priceCurrency || offer.currency || 'SAR';
                  if (isValidPrice(offerPrice)) {
                    price = offerPrice;
                    detectedCurrency = currency;
                    break;
                  }
                }
              }
              if (price > 0) break;
            }
          } catch (e) {
            // تجاهل JSON غير صحيح
          }
        }
      } catch (e) {
        // تجاهل
      }
    }
    
    // الأولوية 4: البحث في meta tags
    if (!price || price === 0) {
      const priceMeta = $('meta[property="product:price:amount"]').attr('content');
      if (priceMeta) {
        const metaPrice = parseFloat(priceMeta);
        if (isValidPrice(metaPrice)) {
          price = metaPrice;
          const currencyMeta = $('meta[property="product:price:currency"]').attr('content');
          if (currencyMeta) {
            detectedCurrency = currencyMeta;
          }
        }
      }
    }
    
    // الأولوية 5: البحث في JavaScript variables (بفلترة صارمة)
    if (!price || price === 0) {
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptText = $(script).html() || '';
        
        // البحث عن أنماط السعر في JavaScript (مع سياق أفضل)
        const pricePatterns = [
          /"price":\s*([\d,]+\.?\d*)/i,
          /'price':\s*([\d,]+\.?\d*)/i,
          /currentPrice["\s:=]+([\d,]+\.?\d*)/i,
          /salePrice["\s:=]+([\d,]+\.?\d*)/i,
          /finalPrice["\s:=]+([\d,]+\.?\d*)/i,
          /price["\s:=]+([\d,]+\.?\d*)/i,
        ];
        
        const foundPrices = [];
        for (const pattern of pricePatterns) {
          const matches = scriptText.matchAll(new RegExp(pattern.source, 'gi'));
          for (const match of matches) {
            const extractedPrice = parseFloat(match[1].replace(/,/g, ''));
            if (isValidPrice(extractedPrice)) {
              foundPrices.push(extractedPrice);
            }
          }
        }
        
        if (foundPrices.length > 0) {
          // نأخذ الأصغر (عادة هو السعر الحالي)
          foundPrices.sort((a, b) => a - b);
          price = foundPrices[0];
          break;
        }
      }
    }
    
    // تحويل العملة إلى SAR إذا لزم الأمر
    if (price > 0 && detectedCurrency !== 'SAR') {
      const exchangeRates = {
        'USD': 3.75,
        'AED': 1.02,
        'EUR': 4.05,
        'GBP': 4.75,
      };
      
      if (exchangeRates[detectedCurrency]) {
        price = price * exchangeRates[detectedCurrency];
        detectedCurrency = 'SAR';
      }
    }
    
    if (!price || price === 0) {
      throw new Error('لم يتم العثور على سعر المنتج في نمشي');
    }
    
    // ========== جلب الصورة (Image) ==========
    let imageUrl = '';
    
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '[data-testid="product-image"] img',
      '.product-image img',
      '.product-images img',
      '[class*="productImage"] img',
      '[class*="ProductImage"] img',
      '[itemprop="image"]',
      '.main-image img',
      '.hero-image img',
      'img[class*="product"]',
      '.product-gallery img',
    ];
    
    for (const selector of imageSelectors) {
      if (selector.includes('meta')) {
        imageUrl = $(selector).attr('content')?.trim();
      } else {
        imageUrl = $(selector).first().attr('src') || $(selector).first().attr('data-src') || $(selector).first().attr('data-lazy-src');
      }
      
      if (imageUrl && imageUrl.length > 10) {
        // تحويل الصور النسبية إلى مطلقة
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = urlObj.origin + imageUrl;
        }
        
        // تصفية الصور الوهمية/الأيقونات
        if (!imageUrl.includes('placeholder') && 
            !imageUrl.includes('logo') && 
            !imageUrl.includes('icon') &&
            !imageUrl.includes('spinner') &&
            imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
          break;
        } else {
          imageUrl = '';
        }
      }
    }
    
    // إذا لم نجد صورة، نأخذ أول صورة من gallery
    if (!imageUrl) {
      const galleryImages = $('.product-gallery img, .product-images img, [class*="gallery"] img').toArray();
      for (const img of galleryImages) {
        const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
        if (src && src.length > 10 && !src.includes('placeholder') && !src.includes('logo')) {
          if (src.startsWith('//')) {
            imageUrl = 'https:' + src;
          } else if (src.startsWith('/')) {
            imageUrl = urlObj.origin + src;
          } else {
            imageUrl = src;
          }
          break;
        }
      }
    }
    
    if (!imageUrl || imageUrl.length < 10) {
      imageUrl = ''; // نسمح بعدم وجود صورة إذا لم نجدها
    }
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Namshi scraper completed in ${duration}ms`);
    
    return {
      success: true,
      product: {
        name: name.trim(),
        price: Math.round(price * 100) / 100, // تقريب لرقمين عشريين
        currency: detectedCurrency,
        image: imageUrl,
        store: 'namshi',
        url: cleanUrl,
      },
    };
    
  } catch (error) {
    console.error('❌ Namshi scraper error:', error.message);
    return {
      success: false,
      error: error.message || 'فشل في جلب بيانات المنتج من نمشي',
      details: 'يرجى التحقق من صحة رابط المنتج',
      suggestion: 'تأكد من أن الرابط يوجه إلى صفحة منتج صحيحة في نمشي',
    };
  }
};

