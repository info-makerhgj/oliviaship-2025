import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Noon Scraper - يستخدم ScraperAPI مع render
 */
export const scrapeNoon = async (url) => {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Scraping Noon: ${url.substring(0, 80)}`);
    
    // التحقق من وجود ScraperAPI Key
    const hasKey = process.env.SCRAPERAPI_KEY && 
                   process.env.SCRAPERAPI_KEY !== 'your_scraperapi_key' &&
                   process.env.SCRAPERAPI_KEY.length > 10;
    
    console.log(`🔑 ScraperAPI Key: ${hasKey ? 'Valid (' + process.env.SCRAPERAPI_KEY.substring(0, 8) + '...)' : 'Invalid'}`);
    
    if (!hasKey) {
      throw new Error('SCRAPERAPI_KEY غير موجود أو غير صحيح في ملف .env');
    }
    
    console.log('🚀 Using ScraperAPI with JavaScript rendering...');
    
    // استخدام ScraperAPI مع render (ضروري لنون)
    const response = await axios.get('http://api.scraperapi.com', {
      params: {
        api_key: process.env.SCRAPERAPI_KEY,
        url: url,
        render: 'true', // مهم جداً لنون
        country_code: 'sa',
      },
      timeout: 60000, // دقيقة كاملة للـ render
    });
    
    const html = response.data;
    console.log(`✅ Got HTML: ${html.length} bytes`);
    
    if (!html || html.length < 1000) {
      throw new Error('HTML content too short');
    }
    
    const $ = cheerio.load(html);
    
    // استخراج الاسم
    let name = '';
    name = $('h1[data-qa="product-name"]').text().trim() ||
           $('h1').first().text().trim() ||
           $('meta[property="og:title"]').attr('content') ||
           $('title').text().trim();
    
    // تنظيف الاسم
    if (name) {
      name = name.replace(/\s+/g, ' ').trim();
      name = name.replace(/^تسوق\s+/i, '').trim();
      name = name.replace(/\s+أونلاين.*$/i, '').trim();
    }
    
    console.log(`📝 Name: ${name.substring(0, 50)}`);
    
    // استخراج السعر
    let price = 0;
    
    // محاولة 1: من data attribute
    const priceElement = $('[data-qa="product-price"]').first();
    let priceText = priceElement.text().trim();
    
    // محاولة 2: من class
    if (!priceText) {
      priceText = $('.priceNow').first().text().trim();
    }
    
    // محاولة 3: من أي عنصر يحتوي على "ريال"
    if (!priceText) {
      $('*').each((_i, el) => {
        const text = $(el).text().trim();
        if (text.length < 50 && text.includes('ريال')) {
          priceText = text;
          return false; // break
        }
      });
    }
    
    // تنظيف السعر
    if (priceText) {
      const cleanPrice = priceText.replace(/[^\d.]/g, '');
      price = parseFloat(cleanPrice);
    }
    
    console.log(`💰 Price: ${price} SAR`);
    
    // استخراج الصورة
    let image = '';
    image = $('img[data-qa="product-image"]').attr('src') ||
            $('img[data-qa="product-image"]').attr('data-src') ||
            $('meta[property="og:image"]').attr('content') ||
            $('img').first().attr('src');
    
    // تنظيف URL الصورة
    if (image && !image.startsWith('http')) {
      if (image.startsWith('//')) {
        image = 'https:' + image;
      }
    }
    
    console.log(`🖼️ Image: ${image ? 'Found' : 'Not found'}`);
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Completed in ${duration}ms`);
    
    // التحقق من البيانات
    if (!name || name.length < 5) {
      throw new Error('لم يتم العثور على اسم المنتج');
    }
    
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
        source: 'noon-scraperapi',
      },
    };
    
  } catch (error) {
    console.error('❌ Noon scraper error:', error.message);
    
    return {
      success: false,
      error: 'فشل في جلب بيانات المنتج من نون',
      details: error.message,
    };
  }
};
