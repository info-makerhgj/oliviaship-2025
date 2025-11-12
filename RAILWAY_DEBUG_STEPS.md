# خطوات تشخيص مشكلة Railway

## المشكلة:
السيرفر لا يستجيب - "Application failed to respond"

---

## الخطوات المطلوبة منك:

### 1️⃣ افتح Railway Dashboard
https://railway.app/

### 2️⃣ اذهب إلى مشروعك → Deployments

### 3️⃣ اضغط على آخر Deployment

### 4️⃣ افتح تبويب **"Logs"** أو **"Deploy Logs"**

### 5️⃣ ابحث عن الأخطاء:

#### أخطاء شائعة:

**أ) MongoDB Connection Error:**
```
❌ MongoDB connection error
MongooseServerSelectionError: connect ECONNREFUSED
```
**الحل:** أضف MongoDB (شرح أدناه)

**ب) Missing Environment Variable:**
```
❌ Error: JWT_SECRET is required
❌ Error: MONGODB_URI is required
```
**الحل:** أضف المتغيرات الناقصة في Variables

**ج) Port Error:**
```
❌ Error: listen EADDRINUSE
```
**الحل:** احذف متغير PORT من Variables (Railway يحدده تلقائياً)

**د) Module Not Found:**
```
❌ Error: Cannot find module 'express'
```
**الحل:** مشكلة في npm install

**هـ) Syntax Error:**
```
❌ SyntaxError: Unexpected token
```
**الحل:** خطأ في الكود

---

## حل مشكلة MongoDB (الأكثر احتمالاً):

### الطريقة السريعة - MongoDB Atlas (مجاني):

#### 1. اذهب إلى MongoDB Atlas:
https://www.mongodb.com/cloud/atlas/register

#### 2. أنشئ حساب مجاني

#### 3. أنشئ Cluster مجاني (M0)

#### 4. اضغط **"Connect"** → **"Connect your application"**

#### 5. انسخ Connection String:
```
mongodb+srv://username:password@cluster.mongodb.net/oliviaship?retryWrites=true&w=majority
```

#### 6. في Railway → Variables → أضف:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oliviaship?retryWrites=true&w=majority
```
⚠️ استبدل `username` و `password` بالبيانات الصحيحة

#### 7. اضغط **Redeploy**

---

### الطريقة البديلة - Railway MongoDB Plugin:

#### 1. في Railway Dashboard

#### 2. اضغط **"+ New"**

#### 3. اختر **"Database"** → **"Add MongoDB"**

#### 4. سيضيف متغير `MONGO_URL` تلقائياً

#### 5. أضف متغير جديد:
```
Name: MONGODB_URI
Value: ${{MONGO_URL}}
```

#### 6. اضغط **Redeploy**

---

## المتغيرات المطلوبة على Railway:

تأكد من وجود هذه المتغيرات في **Variables**:

```
MONGODB_URI=mongodb+srv://...  (مطلوب!)
JWT_SECRET=your-secret-key-here  (مطلوب!)
NODE_ENV=production
FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
CLIENT_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
```

⚠️ **لا تضيف متغير PORT** - Railway يحدده تلقائياً

---

## بعد إضافة المتغيرات:

1. اضغط **Redeploy**
2. انتظر 2-3 دقائق
3. افتح Logs وشوف إذا في أخطاء
4. جرب Health Check:
   ```
   https://oliviaship-2025-production.up.railway.app/api/health
   ```

---

## إذا لسه ما اشتغل:

صور لي:
1. ✅ Railway Logs (كامل)
2. ✅ Railway Variables (اخفي القيم الحساسة)
3. ✅ Deployment Status

وأنا أساعدك أكثر!
