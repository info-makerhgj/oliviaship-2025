![alt text](image.png)# 🚀 دليل نشر المشروع - خطوة بخطوة

## المتطلبات الأساسية
- ✅ حساب GitHub
- ✅ حساب MongoDB Atlas (مجاني)
- ✅ حساب Railway (مجاني)
- ✅ حساب Vercel (مجاني)

---

## 📦 الخطوة 1: MongoDB Atlas (قاعدة البيانات)

### 1.1 التسجيل
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل بإيميل Gmail
3. اختر **FREE** (M0 Sandbox - 512MB مجاني)
4. اختر **AWS** و **Region: Bahrain** (الأقرب لليمن)
5. اسم الـ Cluster: `oliviaship`

### 1.2 إنشاء Database User
1. من القائمة اليسرى: **Database Access**
2. اضغط **Add New Database User**
3. اسم المستخدم: `oliviaship_admin`
4. كلمة المرور: (اختر كلمة قوية واحفظها)
5. اختر **Read and write to any database**
6. اضغط **Add User**

### 1.3 السماح بالاتصال من أي مكان
1. من القائمة اليسرى: **Network Access**
2. اضغط **Add IP Address**
3. اضغط **Allow Access from Anywhere** (0.0.0.0/0)
4. اضغط **Confirm**

### 1.4 الحصول على Connection String
1. ارجع لـ **Database**
2. اضغط **Connect** على الـ Cluster
3. اختر **Connect your application**
4. انسخ الرابط (مثال):
   ```
   mongodb+srv://oliviaship_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **استبدل `<password>` بكلمة المرور الحقيقية**
6. **احفظ الرابط الكامل** - راح نحتاجه

---

## 🚂 الخطوة 2: Railway (Backend)

### 2.1 التسجيل
1. اذهب إلى: https://railway.app
2. اضغط **Login** ثم **Login with GitHub**
3. وافق على الصلاحيات

### 2.2 رفع المشروع
1. اضغط **New Project**
2. اختر **Deploy from GitHub repo**
3. اختر المشروع: `yemen-global-delivery`
4. Railway سيبدأ البناء تلقائياً

### 2.3 إضافة المتغيرات البيئية
1. اضغط على المشروع
2. اذهب لـ **Variables**
3. أضف هذه المتغيرات:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://oliviaship_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/oliviaship?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345678
FRONTEND_URL=https://your-app.vercel.app
CLIENT_URL=https://your-app.vercel.app
SCRAPERAPI_KEY=ed3c1c1a165ad1355f1b498231f760c6

# اختياري (للإيميلات)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 2.4 الحصول على رابط Backend
1. اذهب لـ **Settings**
2. اضغط **Generate Domain**
3. انسخ الرابط (مثال): `https://your-app.railway.app`
4. **احفظه** - راح نحتاجه للـ Frontend

---

## ⚡ الخطوة 3: Vercel (Frontend)

### 3.1 التسجيل
1. اذهب إلى: https://vercel.com
2. اضغط **Sign Up** ثم **Continue with GitHub**

### 3.2 رفع المشروع
1. اضغط **Add New Project**
2. اختر **Import Git Repository**
3. اختر المشروع: `yemen-global-delivery`
4. **مهم جداً:** عدّل الإعدادات:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (اتركه كما هو)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 إضافة المتغيرات البيئية
في قسم **Environment Variables** أضف:

```env
VITE_API_URL=https://your-app.railway.app
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3.4 Deploy
1. اضغط **Deploy**
2. انتظر 2-3 دقائق
3. احصل على رابط الموقع: `https://your-app.vercel.app`

### 3.5 تحديث رابط Frontend في Railway
1. ارجع لـ Railway
2. عدّل المتغيرات:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   CLIENT_URL=https://your-app.vercel.app
   ```
3. احفظ وانتظر إعادة التشغيل

---

## 🎯 الخطوة 4: التحقق من النشر

### 4.1 اختبار Backend
افتح في المتصفح:
```
https://your-app.railway.app/api/health
```
يجب أن ترى: `{"status":"ok"}`

### 4.2 اختبار Frontend
افتح:
```
https://your-app.vercel.app
```
يجب أن يفتح الموقع بشكل طبيعي

### 4.3 اختبار التسجيل
1. سجل حساب جديد
2. سجل دخول
3. جرب طلب منتج

---

## 📱 الخطوة 5: تطبيق الجوال (اختياري)

### 5.1 تحديث رابط API في التطبيق
عدّل ملف `OliviaShip-Expo-App/App.js`:

```javascript
// غيّر هذا السطر:
const WEBSITE_URL = 'http://192.168.1.111:5174';

// إلى:
const WEBSITE_URL = 'https://your-app.vercel.app';
```

### 5.2 بناء التطبيق
```bash
cd OliviaShip-Expo-App
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
```

---

## 🔒 نصائح الأمان

### 1. غيّر JWT_SECRET
استخدم نص عشوائي طويل:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. فعّل HTTPS فقط
كل من Railway و Vercel يوفرون HTTPS تلقائياً ✅

### 3. احمِ المتغيرات البيئية
لا تشارك ملف `.env` أبداً!

---

## 💰 التكلفة

### المجاني (للبداية):
- ✅ MongoDB Atlas: 512MB مجاني
- ✅ Railway: $5 رصيد مجاني شهرياً
- ✅ Vercel: مجاني تماماً

### بعد النمو:
- Railway: $5-20/شهر (حسب الاستخدام)
- MongoDB: $0-9/شهر
- Domain: $10/سنة (اختياري)

---

## 🆘 حل المشاكل الشائعة

### ❌ Backend لا يعمل
1. تحقق من MONGODB_URI في Railway
2. تحقق من Logs في Railway
3. تأكد من السماح بـ 0.0.0.0/0 في MongoDB Atlas

### ❌ Frontend لا يتصل بـ Backend
1. تحقق من VITE_API_URL في Vercel
2. تحقق من CORS في Backend
3. افتح Console في المتصفح وشوف الأخطاء

### ❌ التطبيق لا يفتح الموقع
1. تأكد من تحديث WEBSITE_URL في App.js
2. أعد بناء التطبيق

---

## ✅ Checklist النشر

- [ ] MongoDB Atlas جاهز
- [ ] Railway Backend يعمل
- [ ] Vercel Frontend يعمل
- [ ] اختبار التسجيل والدخول
- [ ] اختبار طلب منتج
- [ ] تحديث تطبيق الجوال (اختياري)
- [ ] شراء Domain (اختياري)

---

## 🎉 تم النشر بنجاح!

الآن مشروعك متاح للعالم! 🌍

**الروابط:**
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app
- Database: MongoDB Atlas

---

## 📞 دعم إضافي

إذا واجهت أي مشكلة:
1. راجع Logs في Railway
2. راجع Console في المتصفح
3. تحقق من المتغيرات البيئية

**بالتوفيق! 🚀**
