# فحص حالة Railway

## المشكلة الحقيقية
السيرفر يرجع **502 Bad Gateway** - معناه السيرفر واقف أو crashed

## الخطوات للتحقق:

### 1. افتح Railway Dashboard
https://railway.app/

### 2. افتح مشروعك → Deployments

### 3. شوف آخر deployment:
- ✅ إذا كان **Active** (أخضر) - السيرفر شغال
- ❌ إذا كان **Failed** (أحمر) - السيرفر crashed
- 🟡 إذا كان **Building** (أصفر) - لسه يبني

### 4. افتح Logs وشوف الأخطاء

---

## الأخطاء المحتملة:

### 1. MongoDB Connection Failed
```
❌ MongoDB connection error
```
**الحل:** تأكد من `MONGODB_URI` صحيح على Railway

### 2. Missing Environment Variables
```
❌ JWT_SECRET is required
```
**الحل:** أضف المتغيرات الناقصة

### 3. Port Binding Error
```
❌ Error: listen EADDRINUSE
```
**الحل:** Railway يحدد PORT تلقائياً، تأكد من استخدام `process.env.PORT`

---

## اختبار سريع:

افتح هذا الرابط في المتصفح:
```
https://oliviaship-2025-production.up.railway.app/api/health
```

### النتيجة المتوقعة:
```json
{"status":"OK","message":"Server is running"}
```

### إذا ما فتح:
- السيرفر واقف تماماً
- شوف Railway Logs للأخطاء

---

## الحل السريع:

1. افتح Railway → Variables
2. تأكد من وجود:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (اتركه فاضي - Railway يحدده تلقائياً)
   - `NODE_ENV=production`
   - `FRONTEND_URL`
   - `CLIENT_URL`

3. اضغط **Redeploy**

4. انتظر 2-3 دقائق

5. جرب الرابط مرة ثانية:
   https://oliviaship-2025-production.up.railway.app/api/health
