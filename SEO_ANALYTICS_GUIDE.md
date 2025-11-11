# 📊 دليل SEO & Analytics

## 🎯 ما تم إضافته

### 1. Google Analytics ✅
- تتبع الصفحات تلقائياً
- تتبع الأحداث (Add to Cart, Purchase, etc.)
- تتبع التحويلات

### 2. Meta Tags ديناميكية ✅
- Title & Description لكل صفحة
- Open Graph Tags (Facebook, LinkedIn)
- Twitter Cards
- Canonical URLs

### 3. Structured Data (Schema.org) ✅
- Organization Schema
- Website Schema
- Service Schema
- Product Schema
- Breadcrumb Schema

### 4. Sitemap & Robots.txt ✅
- sitemap.xml تلقائي
- robots.txt محسّن

---

## 🚀 كيفية الاستخدام

### 1. تفعيل Google Analytics

#### الخطوة 1: احصل على Measurement ID
1. اذهب إلى [Google Analytics](https://analytics.google.com/)
2. أنشئ حساب جديد أو استخدم حساب موجود
3. أنشئ Property جديد
4. احصل على Measurement ID (يبدأ بـ `G-`)

#### الخطوة 2: أضف ID في ملف .env
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### الخطوة 3: أعد تشغيل التطبيق
```bash
npm run dev
```

✅ تم! Google Analytics الآن يعمل!

---

### 2. استخدام SEO Component

في أي صفحة، أضف:

```jsx
import SEO from '../../components/SEO';

export default function MyPage() {
  return (
    <div>
      <SEO 
        title="عنوان الصفحة"
        description="وصف الصفحة"
        keywords="كلمات, مفتاحية, للبحث"
        image="/path/to/image.jpg"
        type="website" // أو article, product
      />
      
      {/* محتوى الصفحة */}
    </div>
  );
}
```

---

### 3. استخدام Structured Data

```jsx
import StructuredData from '../../components/StructuredData';

// Organization Schema
<StructuredData type="organization" />

// Product Schema
<StructuredData 
  type="product" 
  data={{
    name: "اسم المنتج",
    image: "رابط الصورة",
    description: "وصف المنتج",
    price: 100,
    currency: "SAR"
  }}
/>

// Breadcrumb Schema
<StructuredData 
  type="breadcrumb" 
  data={{
    items: [
      { name: "الرئيسية", url: "/" },
      { name: "المنتجات", url: "/products" },
      { name: "منتج 1", url: "/products/1" }
    ]
  }}
/>
```

---

### 4. تتبع الأحداث (Events)

```jsx
import analytics from '../../utils/analytics';

// عند إضافة منتج للسلة
analytics.addToCart({
  name: "اسم المنتج",
  price: 100
});

// عند الشراء
analytics.purchase("ORDER123", 500);

// عند التسجيل
analytics.signUp("email");

// عند تطبيق كوبون
analytics.applyCoupon("SAVE20");

// حدث مخصص
analytics.clickButton("اشتر الآن");
```

---

### 5. تحديث Sitemap

عند إضافة صفحات جديدة:

1. افتح `generate-sitemap.js`
2. أضف الصفحة في `staticPages`:
```js
{ url: '/new-page', priority: 0.8, changefreq: 'weekly' }
```
3. شغل السكربت:
```bash
npm run generate:sitemap
```

---

## 📝 أمثلة للصفحات

### صفحة المنتج
```jsx
<SEO 
  title={product.name}
  description={product.description}
  image={product.image}
  type="product"
/>

<StructuredData 
  type="product" 
  data={{
    name: product.name,
    image: product.image,
    description: product.description,
    price: product.price,
    currency: "SAR"
  }}
/>
```

### صفحة المقالة
```jsx
<SEO 
  title="عنوان المقالة"
  description="ملخص المقالة"
  type="article"
  author="اسم الكاتب"
/>
```

---

## 🔍 التحقق من SEO

### 1. Google Search Console
- أضف موقعك في [Search Console](https://search.google.com/search-console)
- ارفع sitemap.xml
- راقب الأداء

### 2. أدوات الفحص
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### 3. Lighthouse
```bash
# في Chrome DevTools
1. افتح DevTools (F12)
2. اذهب لـ Lighthouse
3. شغل Audit
4. شوف النتائج
```

---

## 📊 مراقبة Analytics

### في Google Analytics Dashboard:
1. **Realtime**: شوف الزوار الحاليين
2. **Acquisition**: من وين جايين الزوار
3. **Behavior**: وش يسوون في الموقع
4. **Conversions**: كم واحد اشترى

### أحداث مهمة للمراقبة:
- `add_to_cart` - إضافة للسلة
- `begin_checkout` - بدء الدفع
- `purchase` - الشراء
- `sign_up` - التسجيل
- `apply_coupon` - تطبيق كوبون

---

## 🎯 نصائح SEO

### 1. المحتوى
- ✅ استخدم عناوين واضحة
- ✅ اكتب وصف مفيد (150-160 حرف)
- ✅ استخدم كلمات مفتاحية طبيعية
- ❌ لا تكرر الكلمات كثير

### 2. الصور
- ✅ استخدم Alt Text
- ✅ ضغط الصور
- ✅ استخدم WebP
- ✅ Lazy Loading

### 3. الأداء
- ✅ سرعة التحميل < 3 ثواني
- ✅ Mobile-Friendly
- ✅ HTTPS
- ✅ PWA

### 4. الروابط
- ✅ استخدم روابط واضحة
- ✅ Internal Linking
- ✅ Breadcrumbs
- ✅ Sitemap

---

## 🚀 الخطوات التالية

1. ✅ فعّل Google Analytics
2. ✅ أضف SEO لكل الصفحات
3. ✅ ارفع Sitemap لـ Google
4. ⏳ راقب الأداء
5. ⏳ حسّن بناءً على البيانات

---

## 📞 دعم

إذا واجهت مشكلة:
1. تأكد من `.env` فيه `VITE_GA_MEASUREMENT_ID`
2. تأكد من إعادة تشغيل التطبيق
3. افتح Console وشوف الأخطاء
4. تأكد من Sitemap موجود في `/public`

---

**تم بنجاح! 🎉**
