# ❌ المشكلة: MongoDB غير متصل

## 🔴 الخطأ:
```
خطأ في الاتصال بقاعدة البيانات
```

**جميع الـ APIs تفشل لأن MongoDB غير متصل.**

---

## ✅ الحل:

### الخطوة 1: تحقق من MongoDB

```bash
# شغل:
START_MONGODB.bat

# أو يدوياً:
netstat -an | findstr ":27017"
```

---

### الخطوة 2: شغل MongoDB

#### الطريقة 1: كخدمة Windows
```bash
net start MongoDB
```

#### الطريقة 2: يدوياً من Command Prompt
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

#### الطريقة 3: من مجلد التثبيت
```bash
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod.exe
```

---

### الخطوة 3: تحقق من الاتصال

بعد تشغيل MongoDB:
```bash
netstat -an | findstr ":27017"
```

يجب أن ترى:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

---

### الخطوة 4: أعد تشغيل الخادم

```bash
cd server
npm start
```

راقب الرسائل:
- ✅ `Connected to MongoDB` → MongoDB متصل
- ❌ `MongoDB connection error` → MongoDB لا يزال غير متصل

---

## 🔍 إذا لم يكن MongoDB مثبتاً:

### تثبيت MongoDB:

1. **تحميل MongoDB:**
   - اذهب إلى: https://www.mongodb.com/try/download/community
   - اختر: Windows, MSI

2. **التثبيت:**
   - شغل الملف `.msi`
   - اختر "Complete" installation
   - اختر "Install MongoDB as a Service"
   - اضغط Next حتى يكتمل التثبيت

3. **التحقق:**
   ```bash
   net start MongoDB
   ```

---

## 📝 ملاحظات:

- **MongoDB يجب أن يعمل قبل تشغيل الخادم**
- **المنفذ الافتراضي:** 27017
- **الاتصال:** `mongodb://localhost:27017/yemen-delivery`

---

## ✅ بعد تشغيل MongoDB:

1. ✅ شغل MongoDB
2. ✅ تحقق من الاتصال (`netstat -an | findstr ":27017"`)
3. ✅ أعد تشغيل الخادم (`cd server && npm start`)
4. ✅ افتح الموقع (`http://localhost:5173`)

---

**ابدأ بـ:** `START_MONGODB.bat`






