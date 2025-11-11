/**
 * استخراج رابط منتج من نص مختلط (مثل عند نسخ من تطبيق Shein)
 * يدعم جميع المواقع: Amazon, Noon, Shein, AliExpress, Temu, iHerb, Nice One, Namshi, Trendyol
 */
export const extractUrlFromText = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // تنظيف النص من المسافات الزائدة
  const cleanedText = text.trim();

  // Patterns للبحث عن روابط
  const urlPatterns = [
    // روابط Shein (الأولوية لأنها الأكثر تعقيداً)
    /https?:\/\/(?:www\.)?(?:api-)?shein\.com[^\s]*/gi,
    /https?:\/\/ar\.shein\.com[^\s]*/gi,
    /https?:\/\/api-shein\.shein\.com[^\s]*/gi,
    
    // روابط Amazon
    /https?:\/\/(?:www\.)?amazon\.(?:sa|ae|com|co\.uk|de|fr|it|es|jp|in|com\.au|com\.br|com\.mx|ca)[^\s]*/gi,
    /https?:\/\/amzn\.eu[^\s]*/gi,
    
    // روابط Noon
    /https?:\/\/(?:www\.)?noon\.com[^\s]*/gi,
    /https?:\/\/[a-z]{2}\.noon\.com[^\s]*/gi,
    
    // روابط AliExpress
    /https?:\/\/(?:www\.)?(?:ar\.)?aliexpress\.com[^\s]*/gi,
    /https?:\/\/a\.aliexpress\.com[^\s]*/gi,
    
    // روابط Temu
    /https?:\/\/(?:www\.)?temu\.com[^\s]*/gi,
    
    // روابط iHerb
    /https?:\/\/(?:www\.)?(?:sa\.)?iherb\.com[^\s]*/gi,
    /https?:\/\/iherb\.co[^\s]*/gi,
    
    // روابط Nice One
    /https?:\/\/(?:www\.)?niceonesa\.com[^\s]*/gi,
    
    // روابط Namshi
    /https?:\/\/(?:www\.)?namshi\.com[^\s]*/gi,
    
    // روابط Trendyol (يدعم الروابط المختصرة ty.gl)
    /https?:\/\/(?:www\.)?trendyol\.com[^\s]*/gi,
    /https?:\/\/ty\.gl[^\s]*/gi,
    
    // روابط عامة (fallback)
    /https?:\/\/[^\s]+/gi,
  ];

  // البحث عن أول رابط يطابق patterns
  for (const pattern of urlPatterns) {
    const matches = cleanedText.match(pattern);
    if (matches && matches.length > 0) {
      // تنظيف الرابط من علامات الترقيم في النهاية
      let url = matches[0].trim();
      
      // إزالة علامات الترقيم الشائعة في النهاية
      url = url.replace(/[.,;:!?]+$/, '');
      url = url.replace(/\)$/, ''); // إزالة الأقواس المغلقة
      
      // التحقق من أن الرابط صحيح
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
  }

  return null;
};

/**
 * تنظيف وnormalize رابط منتج
 */
export const normalizeUrl = (url) => {
  // معالجة الحالات الفارغة أو غير الصحيحة
  if (!url) {
    return null;
  }
  
  // تحويل إلى string إذا لم يكن
  if (typeof url !== 'string') {
    url = String(url);
  }

  // تنظيف النص
  url = url.trim();
  
  // إذا كان فارغاً بعد التنظيف
  if (!url || url.length === 0) {
    return null;
  }

  // أولاً: استخراج الرابط من النص إذا كان مختلطاً
  let extractedUrl = extractUrlFromText(url);
  
  // إذا لم يتم استخراج رابط، استخدم النص الأصلي
  if (!extractedUrl) {
    extractedUrl = url;
  }

  // تنظيف الرابط
  extractedUrl = extractedUrl.replace(/[.,;:!?]+$/, '');
  extractedUrl = extractedUrl.replace(/\)$/, '');
  extractedUrl = extractedUrl.trim();
  
  // التحقق من أن الرابط يبدأ بـ http:// أو https://
  if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
    // محاولة إضافة https:// إذا كان الرابط ناقصاً
    if (extractedUrl.includes('.') && !extractedUrl.includes(' ')) {
      extractedUrl = 'https://' + extractedUrl;
    } else {
      return null;
    }
  }

  return extractedUrl;
};

