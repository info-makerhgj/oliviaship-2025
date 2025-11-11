# 🔴 المشكلة: MongoDB غير متصل

## ❌ الخطأ:
```
خطأ في الاتصال بقاعدة البيانات
```

**جميع الـ APIs تفشل لأن MongoDB غير متصل.**

---

## ✅ الحل السريع:

### الخطوة 1: شغل MongoDB

```bash
# شغل:
START_MONGODB.bat
```

**أو يدوياً:**

#### الطريقة 1: كخدمة Windows
```bash
net start MongoDB
```

#### الطريقة 2: من Command Prompt
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

**أو ابحث عن mongod.exe في:**
- `C:\Program Files\MongoDB\Server\*\bin\mongod.exe`

---

### الخطوة 2: تحقق من الاتصال

```bash
netstat -an | findstr ":27017"
```

**يجب أن ترى:**
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

---

### الخطوة 3: أعد تشغيل الخادم

```bash
cd server
npm start
```

**راقب الرسائل:**
- ✅ `✅ Connected to MongoDB` → MongoDB متصل
- ❌ `❌ MongoDB connection error` → MongoDB لا يزال غير متصل

---

## 🔍 إذا لم يعمل:

### 1. تحقق من مسار MongoDB

ابحث عن `mongod.exe` في:
- `C:\Program Files\MongoDB\Server\*\bin\mongod.exe`
- `C:\Program Files (x86)\MongoDB\Server\*\bin\mongod.exe`

### 2. شغله يدوياً

```bash
# افتح Command Prompt كمسؤول (Run as Administrator)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod.exe --dbpath "C:\data\db"
```

**ملاحظة:** قد تحتاج إلى إنشاء مجلد `C:\data\db` أولاً

### 3. أو استخدم MongoDB Compass

- MongoDB Compass هو GUI لـ MongoDB
- شغله واتركه يعمل في الخلفية

---

## ✅ بعد تشغيل MongoDB:

1. ✅ MongoDB يعمل على المنفذ 27017
2. ✅ أعد تشغيل الخادم
3. ✅ افتح الموقع
4. ✅ جرب تسجيل الدخول

---

**ابدأ الآن:** `START_MONGODB.bat`






