# 🚀 ابدأ هنا - نشر المشروع في 3 خطوات

## ✅ الخطوة 1: MongoDB Atlas (قاعدة البيانات - 5 دقائق)

### افتح هذا الرابط:
👉 https://www.mongodb.com/cloud/atlas/register

### سجل وأنشئ قاعدة بيانات:
1. سجل بإيميل Gmail
2. اختر **FREE** (M0 Sandbox)
3. اختر **AWS** و **Region: Bahrain**
4. اسم الـ Cluster: `oliviaship`

### احصل على رابط الاتصال:
1. اضغط **Database Access** → **Add New Database User**
   - Username: `oliviaship_admin`
   - Password: (اختر كلمة قوية واحفظها)
   - اختر **Read and write to any database**

2. اضغط **Network Access** → **Add IP Address**
   - اختر **Allow Access from Anywhere** (0.0.0.0/0)

3. ارجع لـ **Database** → اضغط **Connect**
   - اختر **Connect your application**
   - انسخ الرابط وغيّر `<password>` بكلمة المرور الحقيقية
   - مثال: `mongodb+srv://oliviaship_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/oliviaship`

**✅ احفظ الرابط - راح نحتاجه!**

---

## ✅ الخطوة 2: Railway (Backend - 10 دقائق)

### افتح هذا الرابط:
👉 https://railway.app

### سجل وارفع المشروع:
1. اضغط **Login with GitHub**
2. اضغط **New Project**
3. اختر **Deploy from GitHub repo**
4. اختر المشروع: `yemen-global-delivery` (أو اسم المشروع)

### أضف المتغيرات البيئية:
1. اضغط على المشروع
2. اذهب لـ **Variables**
3. اضغط **Raw Editor** والصق هذا:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://oliviaship_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/oliviaship
JWT_SECRET=change-this-to-random-long-string-12345678
FRONTEND_URL=https://your-app.vercel.app
CLIENT_URL=https://your-app.vercel.app
SCRAPERAPI_KEY=ed3c1c1a165ad1355f1b498231f760c6
```

**⚠️ مهم:** غيّر:
- `MONGODB_URI` → ضع الرابط من الخطوة 1
- `JWT_SECRET` → غيّره لأي نص عشوائي طويل
- `FRONTEND_URL` → راح نحدثه بعد شوي

### احصل على رابط Backend:
1. اذهب لـ **Settings**
2. اضغط **Generate Domain**
3. انسخ الرابط (مثال): `https://your-app.railway.app`

**✅ احفظ الرابط - راح نحتاجه!**

---

## ✅ الخطوة 3: Vercel (Frontend - 5 دقائق)

### افتح هذا الرابط:
👉 https://vercel.com

### سجل وارفع المشروع:
1. اضغط **Sign Up** → **Continue with GitHub**
2. اضغط **Add New Project**
3. اختر **Import Git Repository**
4. اختر المشروع: `yemen-global-delivery`

### عدّل الإعدادات:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### أضف المتغيرات البيئية:
في قسم **Environment Variables**:

```
VITE_API_URL = https://your-app.railway.app
```

**⚠️ مهم:** غيّر `https://your-app.railway.app` برابط Backend من الخطوة 2

### Deploy:
1. اضغط **Deploy**
2. انتظر 2-3 دقائق
3. احصل على رابط الموقع: `https://your-app.vercel.app`

---

## ✅ الخطوة 4: تحديث Railway (دقيقة واحدة)

### ارجع لـ Railway:
1. افتح المشروع في Railway
2. اذهب لـ **Variables**
3. عدّل هذه المتغيرات:
   ```
   FRONTEND_URL = https://your-app.vercel.app
   CLIENT_URL = https://your-app.vercel.app
   ```
4. احفظ (راح يعيد التشغيل تلقائياً)

---

## 🎉 تم! اختبر المشروع

### افتح موقعك:
```
https://your-app.vercel.app
```

### جرب:
1. ✅ سجل حساب جديد
2. ✅ سجل دخول
3. ✅ اطلب منتج
4. ✅ تتبع الطلب

---

## 📱 تطبيق الجوال (اختياري)

### عدّل ملف التطبيق:
افتح `OliviaShip-Expo-App/App.js` وغيّر:

```javascript
// من:
const WEBSITE_URL = 'http://192.168.1.111:5174';

// إلى:
const WEBSITE_URL = 'https://your-app.vercel.app';
```

### ارفع التطبيق:
```bash
cd OliviaShip-Expo-App
npm install -g eas-cli
eas login
eas build --platform android
```

---

## 💰 التكلفة

- ✅ MongoDB Atlas: **مجاني** (512MB)
- ✅ Railway: **$5 مجاني شهرياً** (كافي للبداية)
- ✅ Vercel: **مجاني تماماً**

**المجموع: $0 للبداية! 🎉**

---

## ❓ مشاكل؟

### Backend لا يعمل:
- تحقق من MONGODB_URI في Railway
- افتح **Logs** في Railway وشوف الأخطاء

### Frontend لا يتصل:
- تحقق من VITE_API_URL في Vercel
- افتح Console في المتصفح (F12)

### تحتاج مساعدة:
راجع الملف الكامل: `DEPLOYMENT_GUIDE.md`

---

## 🎯 Checklist

- [ ] MongoDB Atlas جاهز ✅
- [ ] Railway Backend يعمل ✅
- [ ] Vercel Frontend يعمل ✅
- [ ] اختبار التسجيل والدخول ✅
- [ ] اختبار طلب منتج ✅

---

**بالتوفيق! 🚀**

المشروع الآن متاح للعالم! 🌍
