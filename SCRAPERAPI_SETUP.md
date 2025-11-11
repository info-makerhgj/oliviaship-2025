# 🔧 دليل إعداد ScraperAPI

## 📋 المتطلبات الأساسية

1. **حساب ScraperAPI**: سجل في https://www.scraperapi.com/
2. **API Key**: احصل على مفتاح API من Dashboard
3. **رصيد كافٍ**: تأكد من وجود رصيد كافٍ في حسابك

---

## ⚙️ الإعدادات في الموقع

### 1. طريقة الـ Scraping (Scraping Method)

في API Playground، اختر إحدى الطرق:

#### ✅ **API** (الموصى به - الحالي)
- **الاستخدام**: للمواقع العامة
- **الميزات**: 
  - JavaScript rendering
  - Premium proxies (للمواقع المحمية)
  - دعم كامل لجميع المتاجر
- **الكود**: 
  ```javascript
  http://api.scraperapi.com?api_key=YOUR_KEY&url=PRODUCT_URL&render=true
  ```

#### 🔄 **Async** (للطلبات الكبيرة)
- **الاستخدام**: عند جلب عدد كبير من المنتجات
- **الميزات**: معالجة غير متزامنة
- **ملاحظة**: يحتاج لـ webhook لاستقبال النتائج

#### 🌐 **Proxy Mode** (للحماية القصوى)
- **الاستخدام**: للمواقع شديدة الحماية
- **الميزات**: استخدام proxies متعددة

#### 📊 **Structured Data Endpoints** (للمنتجات المحددة)
- **الاستخدام**: لـ Amazon, eBay, Google Shopping
- **الميزات**: بيانات منظمة جاهزة

---

### 2. إعدادات مهمة في ScraperAPI Dashboard

#### ✅ تفعيل Auto-Renewal
1. اذهب إلى **Billing** في القائمة
2. فعّل **Auto-renewal** لتجنب نفاد الرصيد
3. اختر خطة مناسبة:
   - **Starter**: $29/شهر (100K requests)
   - **Professional**: $99/شهر (500K requests)
   - **Business**: حسب الحاجة

#### ✅ إعدادات الـ API Key
1. اذهب إلى **Dashboard**
2. انسخ **API Key** من الصفحة الرئيسية
3. احفظه في ملف `.env` كـ `SCRAPERAPI_KEY`

---

## 🔑 إضافة API Key في المشروع

### 1. إضافة في ملف `.env`

```env
# ScraperAPI Settings
SCRAPERAPI_KEY=your-api-key-here
```

### 2. مثال كامل لملف `.env`

```env
# Server Settings
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/yemen-delivery

# JWT
JWT_SECRET=your-secret-key

# ScraperAPI
SCRAPERAPI_KEY=abc123def456ghi789  # ← ضع مفتاحك هنا
```

---

## 🎯 الخيارات المتقدمة (Optional)

### Premium Proxies (للمواقع المحمية)

الكود يدعم Premium Proxies تلقائياً لـ SHEIN و Temu:

```javascript
// في universalScraper.js
if (detectedStore === 'shein' || detectedStore === 'temu') {
  scraperParams.premium = true;
}
```

### Country Code (اختياري)

يمكن تحديد البلد:

```env
# في .env (اختياري)
SCRAPERAPI_COUNTRY_CODE=sa  # السعودية
SCRAPERAPI_COUNTRY_CODE=us  # أمريكا (افتراضي)
```

---

## 📊 مراقبة الاستخدام

### في ScraperAPI Dashboard:

1. **Analytics**: راجع استخدام API
2. **Billing**: تحقق من الرصيد المتبقي
3. **Status Page**: تأكد من حالة الخدمة

---

## ⚠️ ملاحظات مهمة

### 1. نفاد الرصيد
- إذا نفد الرصيد، سيستخدم النظام **Direct Request** (fallback)
- قد لا يعمل مع المواقع المحمية (SHEIN, Temu)

### 2. Rate Limits
- ScraperAPI لديه حد أقصى للطلبات في الثانية
- الخطة Starter: ~10 requests/second
- إذا تجاوزت الحد، سيتم إرجاع خطأ 429

### 3. التكلفة
- كل request = 1 credit
- مع JavaScript rendering = 2 credits
- مع Premium proxy = 3 credits

---

## 🧪 اختبار الإعداد

### 1. اختبار API Key

```bash
# في Terminal
curl "http://api.scraperapi.com?api_key=YOUR_KEY&url=https://httpbin.org/json"
```

### 2. اختبار من الكود

```javascript
// في server/utils/scrapers/universalScraper.js
// جرب رابط منتج من Amazon
const testUrl = 'https://www.amazon.com/dp/B08N5WRWNW';
const result = await scrapeProduct(testUrl);
console.log(result);
```

---

## 🔧 حل المشاكل

### ❌ خطأ: "You've exhausted your credits"
**الحل**: 
1. اذهب إلى **Billing** في ScraperAPI
2. تجديد الرصيد أو تفعيل Auto-renewal
3. أو ترقية الخطة

### ❌ خطأ: "Invalid API key"
**الحل**:
1. تأكد من نسخ API Key بشكل صحيح
2. تحقق من عدم وجود مسافات في `.env`
3. أعد تشغيل السيرفر بعد إضافة المفتاح

### ❌ ScraperAPI لا يعمل
**الحل**:
1. تحقق من اتصال الإنترنت
2. راجع logs في console: `console.log('ScraperAPI failed...')`
3. النظام سيستخدم Direct Request كـ fallback

---

## 📚 روابط مفيدة

- **ScraperAPI Dashboard**: https://dashboard.scraperapi.com/
- **Documentation**: https://www.scraperapi.com/documentation/
- **Pricing**: https://www.scraperapi.com/pricing/
- **Status Page**: https://status.scraperapi.com/

---

## ✅ الخطوات السريعة

1. ✅ سجل في ScraperAPI: https://www.scraperapi.com/
2. ✅ احصل على API Key من Dashboard
3. ✅ أضف `SCRAPERAPI_KEY` في ملف `.env`
4. ✅ تجديد الرصيد أو تفعيل Auto-renewal
5. ✅ أعد تشغيل السيرفر
6. ✅ جرب جلب منتج من Amazon أو SHEIN

---

## 🎉 جاهز!

بعد إضافة API Key، النظام سيستخدم ScraperAPI تلقائياً:
- ✅ جلب أفضل للمنتجات
- ✅ دعم JavaScript rendering
- ✅ Premium proxies للمواقع المحمية
- ✅ Fallback تلقائي عند الفشل

