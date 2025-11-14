import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Noon Scraper - مخصص ومحسّن لموقع نون
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 */
export const scrapeNoon = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    let html = '';
    
    // استخدام ScraperAPI مباشرة لتجنب الحظر
    if (process.env.SCRAPERAPI_KEY) {
      try {
        console.log('🚀 Using ScraperAPI for Noon (direct)');
        const response = await axios.get('http://api.scraperapi.com', {
          params: {
            api_key: process.env.SCRAPERAPI_KEY,
            url: cleanUrl,
            render: false, // بدون render أسرع
            country_code: 'sa', // السعودية
          },
          timeout: 30000, // 30 ثانية
        });
        html = response.data;
        console.log(`✅ ScraperAPI success for Noon`);
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
        // Fallback: محاولة مباشرة فقط إذا فشل ScraperAPI
        try {
          console.log('🔄 Trying direct request as fallback...');
          const response = await axios.get(cleanUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.noon.com/',
              'Cache-Control': 'no-cache',
            },
            timeout: 10000,
            maxRedirects: 5,
          });
          html = response.data;
          console.log('✅ Direct request fallback succeeded');
        } catch (fallbackError) {
          console.log(`❌ Direct request fallback also failed: ${fallbackError.message}`);
        }
      }
    } else {
      // إذا لم يكن ScraperAPI موجود، استخدم الطريقة المباشرة
      console.log('⚠️ SCRAPERAPI_KEY not found, using direct request');
      try {
        const response = await axios.get(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.noon.com/',
            'Cache-Control': 'no-cache',
          },
          timeout: 10000,
          maxRedirects: 5,
        });
        html = response.data;
      } catch (error) {
        console.log(`❌ Direct request failed: ${error.message}`);
      }
    }

    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // ========== جلب الاسم (Name) - أولوية عالية ==========
    let name = '';
    
    // محاولات متعددة بترتيب الأولوية لنون
    const nameSelectors = [
      'h1[data-qa="product-name"]',              // نون الرئيسي
      'h1.productContainer__name',               // نون بديل
      'h1[class*="productName"]',                // نون عام
      'h1[class*="ProductName"]',                 // نون بديل
      'h1[data-product-title]',                  // نون data attribute
      '.productContainer h1',                    // نون container
      'h1.sc-fzqARJ',                            // نون styled
      'meta[property="og:title"]',               // Meta tag
      'meta[name="twitter:title"]',              // Twitter meta
      'title',                                   // العنوان العام
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
        // إزالة "نون" من البداية إذا كان موجوداً
        name = name.replace(/^نون\s*[-–]\s*/i, '').trim();
        // إزالة "تسوق" من البداية
        name = name.replace(/^تسوق\s+/i, '').trim();
        // إزالة "أونلاين في السعودية" من النهاية
        name = name.replace(/\s+أونلاين\s+في\s+السعودية.*$/i, '').trim();
        name = name.replace(/\s+أونلاين.*$/i, '').trim();
        if (name.length > 5) break;
      }
    }
    
    // تنظيف title من نون
    if (!name || name.length < 5) {
      const titleText = $('title').text().trim();
      if (titleText) {
        // استخراج اسم المنتج من title
        const titleMatch = titleText.match(/تسوق\s+(.+?)\s+أونلاين/i);
        if (titleMatch && titleMatch[1]) {
          name = titleMatch[1].trim();
          // تنظيف إضافي
          name = name.replace(/أونلاين.*$/i, '').trim();
        }
      }
    }
    
    // البحث في JSON-LD (نون يستخدم JSON-LD كثيراً)
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
    
    // محاولات متعددة بترتيب الأولوية لنون
    const priceSelectors = [
      'strong[data-qa="product-price"]',         // نون الأساسي
      '[data-qa="product-price"]',               // نون الرئيسي
      'div.priceNow',                            // نون سعر الآن
      'span.priceNow',                           // نون سعر بديل
      '.sellingPrice',                           // نون سعر البيع
      '[data-price]',                            // نون data attribute
      '.productContainer__price strong',         // نون container
      '[class*="PriceNow"]',                     // نون class
      '[class*="price-now"]',                    // نون class
      'strong[class*="price"]',                  // نون strong price
    ];
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      
      // محاولة data attribute أولاً
      priceText = element.attr('data-price') ||
                  element.attr('data-qa-price') ||
                  element.text().trim();
      
      if (priceText) {
        // تنظيف السعر - إزالة كل شيء ما عدا الأرقام والنقطة
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
          if (foundPrice > 0 && foundPrice < 100000) { // سعر منطقي
            price = foundPrice;
            console.log(`✅ Found price: ${price} SAR from selector: ${selector}`);
            break;
          }
        }
      }
    }
    
    // محاولة إضافية: البحث في جميع العناصر التي تحتوي على "ريال"
    if (price === 0) {
      console.log('⚠️ Trying to find price in text containing "ريال"');
      $('*').each((_i, el) => {
        const text = $(el).text().trim();
        // تحقق من أن النص قصير (ليس فقرة كاملة) ويحتوي على ريال
        if (text.length < 50 && (text.includes('ريال') || text.includes('SAR') || text.includes('ر.س'))) {
          const priceMatch = text.match(/([\d,]+\.?\d*)\s*(?:ريال|SAR|ر\.س)/);
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (foundPrice > 0 && foundPrice < 100000) { // سعر منطقي
              price = foundPrice;
              console.log(`✅ Found price from text: ${price} SAR`);
              return false; // break
            }
          }
        }
      });
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
        price = parseFloat(metaPrice);
      }
    }
    
    // تنظيف السعر - إزالة الهامش .01
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
    
    // ========== جلب الصورة (Image) - استخدام النظام القديم البسيط والسريع ==========
    let image = '';
    
    // النظام القديم كان بسيط وسريع - نفس الطريقة
    image = $('[data-product-image]').attr('data-product-image') ||
            $('meta[property="og:image"]').attr('content');
    
    // Clean image URL (نفس الكود القديم)
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
    console.log(`⚡ Noon scraper completed in ${duration}ms`);
    
    // التحقق من البيانات الأساسية
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'لم يتم العثور على اسم المنتج',
        details: 'الرجاء التأكد من صحة الرابط',
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
        store: 'noon',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'noon-scraper',
      },
    };
    
  } catch (error) {
    console.error('❌ Noon scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من نون';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بنون. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم نون. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};

