# تحديث متغيرات البيئة على Railway

## المشكلة
السيرفر على Railway يرفض طلبات CORS من الموقع الجديد على Vercel

## الحل - تحديث متغيرات البيئة

اذهب إلى Railway Dashboard وأضف/حدث المتغيرات التالية:

### 1. افتح مشروعك على Railway
https://railway.app/

### 2. اذهب إلى Variables
اضغط على مشروعك → Variables

### 3. أضف/حدث المتغيرات التالية:

```
FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
NODE_ENV=production
```

### 4. أعد نشر السيرفر (Redeploy)
بعد تحديث المتغيرات، اضغط على "Redeploy" لتطبيق التغييرات

---

## ملاحظات مهمة

✅ **تم إصلاح الكود المحلي:**
- إضافة رابط Vercel الجديد للـ CORS في `server/index.js`
- إصلاح routing لملف `manifest.json` في `vercel.json`
- إصلاح meta tags في `index.html`

⚠️ **يجب عليك:**
1. رفع التغييرات إلى GitHub
2. تحديث متغيرات البيئة على Railway
3. إعادة نشر السيرفر على Railway

---

## الأوامر المطلوبة

### 1. رفع التغييرات إلى GitHub
```bash
git add .
git commit -m "Fix CORS and manifest.json issues"
git push origin main
```

### 2. Railway سيعيد النشر تلقائياً
بعد الـ push، Railway سيكتشف التغييرات ويعيد النشر تلقائياً

---

## التحقق من الحل

بعد إعادة النشر، افتح الموقع وتحقق من:
- ✅ لا توجد أخطاء CORS في Console
- ✅ ملف manifest.json يعمل بدون خطأ 401
- ✅ البيانات تُحمل من السيرفر بشكل صحيح
