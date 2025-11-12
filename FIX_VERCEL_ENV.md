# حل مشكلة CORS - إعدادات Vercel

## المشكلة الحقيقية
الموقع على Vercel يحاول الاتصال بـ `/api` (relative path) بدلاً من Railway URL المباشر

## الحل - إضافة متغير البيئة على Vercel

### الخطوات:

#### 1. افتح مشروعك على Vercel
https://vercel.com/dashboard

#### 2. اذهب إلى Settings → Environment Variables

#### 3. أضف المتغير التالي:

**Name:**
```
VITE_API_URL
```

**Value:**
```
https://oliviaship-2025-production.up.railway.app/api
```

**Environment:** اختر الثلاثة:
- ✅ Production
- ✅ Preview
- ✅ Development

#### 4. اضغط Save

#### 5. أعد نشر الموقع (Redeploy)
- اذهب إلى Deployments
- اضغط على آخر deployment
- اضغط على الثلاث نقاط (...)
- اختر "Redeploy"

---

## إعدادات Railway (مهمة أيضاً!)

### اذهب إلى Railway Dashboard:
https://railway.app/

### أضف/حدث المتغيرات التالية:

```
FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
CLIENT_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
NODE_ENV=production
```

### ثم اضغط Redeploy

---

## التحقق من الحل

بعد إعادة النشر على Vercel و Railway:

1. افتح الموقع: https://oliviaship-2025-olivia-ships-projects.vercel.app
2. افتح Console (F12)
3. تحقق من:
   - ✅ لا توجد أخطاء CORS
   - ✅ الطلبات تذهب إلى `oliviaship-2025-production.up.railway.app`
   - ✅ البيانات تُحمل بنجاح

---

## ملاحظة مهمة

إذا لم يعمل بعد إضافة المتغير، تأكد من:
1. Railway يعمل بشكل صحيح (افتح https://oliviaship-2025-production.up.railway.app/api/health)
2. MongoDB متصل على Railway
3. جميع المتغيرات موجودة على Railway
