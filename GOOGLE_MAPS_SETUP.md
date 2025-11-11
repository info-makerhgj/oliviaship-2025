# 🗺️ إعداد Google Maps API

## الميزات المضافة:

1. **Google Maps Autocomplete** في صفحة إضافة/تعديل نقطة البيع
   - البحث التلقائي عن العنوان
   - ملء الإحداثيات تلقائياً
   - استخراج المدينة تلقائياً

2. **صفحة عامة لنقاط البيع** (`/points`)
   - عرض جميع النقاط النشطة
   - خريطة تفاعلية
   - فلترة حسب المدينة والنوع
   - بحث عن النقاط

3. **تحسين عرض الخريطة** في صفحة تفاصيل الطلب
   - عرض موقع نقطة الاستلام عند جاهزية الطلب

## إعداد Google Maps API:

### 1. الحصول على API Key:

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. افتح "APIs & Services" > "Library"
4. فعّل:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
5. اذهب إلى "APIs & Services" > "Credentials"
6. أنشئ "API Key"
7. قم بتقييد API Key (اختياري لكن موصى به):
   - قم بتقييده لـ "HTTP referrers"
   - أضف نطاقك (مثل: `localhost:5173`, `yourdomain.com`)

### 2. إضافة API Key:

افتح `index.html` واستبدل `AIzaSyDummyKey` بـ API Key الحقيقي:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places&language=ar" async defer></script>
```

### 3. (اختياري) إضافة متغير بيئة:

يمكنك أيضاً استخدام متغير بيئة في `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

ثم في `index.html`:

```html
<script src={`https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&language=ar`} async defer></script>
```

## ملاحظات:

- بدون API Key، ستظل الخرائط تعمل (باستخدام Embed API) لكن بدون Autocomplete
- API Key مجاني حتى 28,500 طلب شهرياً
- في التطوير، يمكنك استخدام Embed API بدون API Key


