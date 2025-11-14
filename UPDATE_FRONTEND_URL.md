# 🔗 تحديث Frontend URL للاتصال بـ AWS Lightsail

## 📝 الخطوات:

### 1️⃣ تحديث ملف .env في Frontend:

```bash
# في مشروع Frontend المحلي:
# ملف: .env أو .env.production

# القديم (Render أو Railway):
# VITE_API_URL=https://old-backend.railway.app

# الجديد (AWS Lightsail):
VITE_API_URL=http://52.66.189.199:5000
```

---

### 2️⃣ Commit و Push:

```bash
# في مجلد Frontend:
git add .env
git commit -m "Update API URL to AWS Lightsail"
git push origin main
```

---

### 3️⃣ Vercel سيعيد النشر تلقائياً:

- Vercel يراقب GitHub
- عند Push، سيعيد النشر تلقائياً
- انتظر 2-3 دقائق

---

## ⚠️ مشكلة CORS محتملة:

إذا Frontend لم يتصل بـ Backend، المشكلة في CORS.

### الحل: تحديث CORS في Backend

```bash
# SSH إلى AWS Lightsail:
ssh -i your-key.pem ubuntu@52.66.189.199

# تحديث ملف .env:
cd ~/oliviaship-2025
nano .env
```

**تأكد من:**
```env
FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
CORS_ORIGIN=https://oliviaship-2025-olivia-ships-projects.vercel.app
```

**أعد تشغيل:**
```bash
pm2 restart oliviaship
pm2 logs oliviaship
```

---

## 🧪 اختبار الاتصال:

### 1. اختبر API مباشرة:
```
http://52.66.189.199:5000/api/health
```
يجب أن يرجع: `{"status":"ok"}`

### 2. اختبر من Frontend:
```
https://oliviaship-2025-olivia-ships-projects.vercel.app
```
افتح Console (F12) وشوف إذا فيه أخطاء CORS.

---

## 🔧 إذا لم يشتغل (CORS Error):

### الخطأ الشائع:
```
Access to fetch at 'http://52.66.189.199:5000/api/...' 
from origin 'https://oliviaship-2025...vercel.app' 
has been blocked by CORS policy
```

### الحل:

**في Backend (AWS Lightsail):**

```bash
# SSH إلى السيرفر:
ssh -i your-key.pem ubuntu@52.66.189.199

cd ~/oliviaship-2025

# تحديث server/index.js:
nano server/index.js
```

**تأكد من CORS config:**
```javascript
import cors from 'cors';

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'https://oliviaship-2025-olivia-ships-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**حفظ وإعادة تشغيل:**
```bash
# Ctrl+X, Y, Enter (للحفظ)
pm2 restart oliviaship
pm2 logs oliviaship
```

---

## 📊 الخلاصة:

### الخطوات:
1. ✅ حدث `VITE_API_URL` في Vercel
2. ✅ أعد النشر (Redeploy)
3. ✅ تأكد من CORS في Backend
4. ✅ اختبر الموقع

### النتيجة:
- ✅ Frontend (Vercel) يتصل بـ Backend (AWS Lightsail)
- ✅ سرعة ممتازة (50-200ms)
- ✅ كل المكتبات مثبتة
- ✅ المشروع يشتغل 100%

---

## 🚀 بعد الانتهاء:

### احذف الموارد القديمة:
1. ✅ Render - محذوف
2. ⏳ AWS Lightsail القديم (512MB) - احذفه
3. ⏳ Railway (إن وجد) - احذفه

### التكلفة النهائية:
- AWS Lightsail: $12/شهر
- Vercel: $0 (Free tier)
- MongoDB Atlas: $0 (Free tier)
- **المجموع: $12/شهر**

---

## ✅ تم بنجاح! 🎉

موقعك الحين:
- ⚡ سريع جداً (AWS Lightsail Mumbai)
- 💪 قوي (2GB RAM, 60GB SSD)
- 🔒 آمن (HTTPS via Vercel)
- 💰 رخيص ($12/شهر)

**مبروك! 🎊**
