# اختبار Google Analytics

## الخطوات للاختبار

### 1. تشغيل السيرفر
```bash
npm run dev
```

### 2. تسجيل الدخول كمدير
- اذهب إلى `/login`
- سجل دخول بحساب المدير

### 3. الذهاب إلى الإعدادات
- اذهب إلى `/admin/settings`
- اختر تبويب **متقدم** (Advanced)

### 4. تفعيل Google Analytics
- فعّل خيار Google Analytics
- أدخل Measurement ID تجريبي: `G-TEST123456`
- احفظ الإعدادات

### 5. التحقق من التفعيل
- افتح Console في المتصفح (F12)
- أعد تحميل الصفحة
- ابحث عن رسالة: `✅ Google Analytics initialized with ID: G-TEST123456`

### 6. اختبار تتبع الصفحات
- انتقل بين صفحات مختلفة
- تحقق من Console أن كل صفحة يتم تتبعها

## النتائج المتوقعة

✅ يجب أن ترى رسالة في Console عند تحميل الصفحة الأولى
✅ يجب أن يتم تحميل سكريبت Google Analytics في `<head>`
✅ يجب أن يتم تتبع كل تغيير في الصفحة

## الملفات المعدلة

1. **server/models/Settings.js** - إضافة حقل analytics في قاعدة البيانات
2. **src/pages/admin/Settings.jsx** - إضافة واجهة إدخال Measurement ID
3. **src/utils/analytics.js** - تحديث دوال التتبع
4. **src/hooks/useGoogleAnalytics.js** - Hook جديد لتحميل الإعدادات
5. **src/App.jsx** - استخدام الـ Hook

## الميزات

✨ إدخال Measurement ID من لوحة التحكم
✨ تفعيل/إلغاء تفعيل بضغطة زر
✨ تتبع تلقائي لجميع الصفحات
✨ دعم الأحداث المخصصة (Custom Events)
✨ لا حاجة لتعديل ملفات .env

## ملاحظات

- الإعدادات تُحفظ في قاعدة البيانات
- التغييرات تُطبق فوراً بدون إعادة تشغيل السيرفر
- يمكن تغيير Measurement ID في أي وقت
