import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Amazon Scraper - مخصص ومحسّن لأمازون
 * يركز على: صورة، اسم، سعر فقط - سريع وفعّال
 */
export const scrapeAmazon = async (url) => {
  const startTime = Date.now();
  
  try {
    // تنظيف URL
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    
    let html = '';
    
    // محاولة 1: جلب مباشر مع headers محسّنة
    try {
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.amazon.sa/',
          'Cache-Control': 'no-cache',
        },
        timeout: 10000, // 10 ثواني فقط
        maxRedirects: 5,
      });
      html = response.data;
    } catch (error) {
      console.log(`⚠️ Direct request failed: ${error.message}`);
    }

    // محاولة 2: ScraperAPI إذا كان متوفر
    if ((!html || html.length < 100) && process.env.SCRAPERAPI_KEY) {
      try {
        const response = await axios.get('http://api.scraperapi.com', {
          params: {
            api_key: process.env.SCRAPERAPI_KEY,
            url: cleanUrl,
            render: false, // بدون render أسرع
          },
          timeout: 15000,
        });
        html = response.data;
        console.log(`✅ ScraperAPI used for Amazon`);
      } catch (error) {
        console.log(`⚠️ ScraperAPI failed: ${error.message}`);
      }
    }

    if (!html || typeof html !== 'string' || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);
    
    // ========== جلب الاسم (Name) - أولوية عالية ==========
    let name = '';
    
    // محاولات متعددة بترتيب الأولوية
    const nameSelectors = [
      '#productTitle',                    // أمازون السعودية/الإمارات
      'h1.a-size-large.product-title-word-break', // أمازون عام
      'h1.a-size-large',                  // أمازون عام
      'h1[data-automation-id="title"]',    // أمازون موبايل
      'span#productTitle',                 // أمازون بديل
      'meta[property="og:title"]',        // Meta tag
      'title',                            // العنوان العام
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
        break;
      }
    }
    
    // إذا لم نجد، نبحث في JSON-LD
    if (!name || name.length < 5) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            if (jsonData.name || jsonData['@graph']?.[0]?.name) {
              name = jsonData.name || jsonData['@graph']?.[0]?.name;
              if (name && name.length > 5) break;
            }
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
    
    // محاولات متعددة بترتيب الأولوية
    const priceSelectors = [
      '.a-price-whole',                    // أمازون السعودية/الإمارات
      '.a-price .a-offscreen',             // أمازون بديل
      '#priceblock_ourprice',              // أمازون قديم
      '#priceblock_dealprice',             // أمازون عروض
      '#priceblock_saleprice',             // أمازون خصم
      '.a-price.a-text-price',             // أمازون بديل
      'span[data-a-color="price"]',        // أمازون موبايل
      '.a-price-range',                    // أمازون نطاق أسعار
    ];
    
    for (const selector of priceSelectors) {
      priceText = $(selector).first().text().trim() || 
                   $(selector).first().attr('data-a-color') ||
                   '';
      
      if (priceText) {
        // استخراج الأرقام فقط
        const cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
        const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0]);
          if (price > 0) break;
        }
      }
    }
    
    // البحث في JSON-LD
    if (price === 0) {
      try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
          try {
            const jsonData = JSON.parse($(jsonLdScripts[i]).text());
            
            // محاولات مختلفة لاستخراج السعر
            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers) && jsonData.offers[0]?.price) {
                price = parseFloat(jsonData.offers[0].price);
              } else if (jsonData.offers.price) {
                price = parseFloat(jsonData.offers.price);
              }
            }
            
            if (jsonData.price) {
              price = parseFloat(jsonData.price);
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
    
    // محاولة أخيرة من Meta tags
    if (price === 0) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        price = parseFloat(metaPrice);
      }
    }
    
    // ========== جلب الصورة (Image) - أولوية عالية ==========
    let image = '';
    
    // محاولات متعددة بترتيب الأولوية
    const imageSelectors = [
      '#landingImage',                     // أمازون الرئيسي
      '#imgBlkFront',                      // أمازون بديل
      '.a-dynamic-image',                  // أمازون ديناميكي
      '#main-image',                       // أمازون بديل
      'img[data-a-image-name="landingImage"]', // أمازون موبايل
      'meta[property="og:image"]',         // Meta tag
      'meta[name="twitter:image"]',        // Twitter meta
    ];
    
    for (const selector of imageSelectors) {
      if (selector.includes('meta')) {
        image = $(selector).attr('content');
      } else {
        image = $(selector).first().attr('src') || 
                $(selector).first().attr('data-src') ||
                $(selector).first().attr('data-a-dynamic-image');
      }
      
      if (image && image.length > 10) {
        // تنظيف URL الصورة
        if (image.includes('data-a-dynamic-image')) {
          try {
            const dynamicImages = JSON.parse(image);
            if (dynamicImages && Object.keys(dynamicImages).length > 0) {
              image = Object.keys(dynamicImages)[0]; // أول صورة (أكبر)
            }
          } catch (e) {
            // keep original
          }
        }
        
        // تحويل URL إلى صورة عالية الجودة
        if (image.includes('._')) {
          image = image.split('._')[0] + '._AC_SL1500_.jpg'; // صورة عالية الجودة
        }
        
        // إصلاح URLs النسبية
        if (image && !image.startsWith('http')) {
          if (image.startsWith('//')) {
            image = 'https:' + image;
          } else if (image.startsWith('/')) {
            image = urlObj.origin + image;
          }
        }
        
        if (image && image.includes('amazon')) {
          break;
        }
      }
    }
    
    // تنظيف نهائي للصورة
    if (image && image.includes('._')) {
      // إزالة أي parameters غير ضرورية
      image = image.split('?')[0];
    }
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Amazon scraper completed in ${duration}ms`);
    
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
        store: 'amazon',
        url: url,
      },
      metadata: {
        duration: duration,
        source: 'amazon-scraper',
      },
    };
    
  } catch (error) {
    console.error('❌ Amazon scraper error:', {
      message: error.message,
      code: error.code,
      url: url.substring(0, 60),
    });
    
    let errorMessage = 'فشل في جلب بيانات المنتج من أمازون';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بأمازون. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم أمازون. يرجى المحاولة لاحقاً.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message,
    };
  }
};






