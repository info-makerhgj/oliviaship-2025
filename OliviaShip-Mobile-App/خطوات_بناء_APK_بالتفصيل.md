# 📱 خطوات بناء APK بالتفصيل

## ✅ الخطوة 1: تأكد من تثبيت Android Studio

### افتح Command Prompt واكتب:
```bash
adb version
```

إذا ظهرت معلومات ADB = Android Studio مثبت ✅
إذا ظهر خطأ = يحتاج إعداد

---

## ⚙️ الخطوة 2: إعداد متغيرات البيئة

### 1. افتح System Properties:
- اضغط Windows + R
- اكتب: `sysdm.cpl`
- اضغط Enter

### 2. اذهب إلى Environment Variables:
- اضغط على "Advanced" tab
- اضغط "Environment Variables"

### 3. أضف ANDROID_HOME:
- في System Variables، اضغط "New"
- Variable name: `ANDROID_HOME`
- Variable value: `C:\Users\cct33\AppData\Local\Android\Sdk`
- اضغط OK

### 4. أضف إلى Path:
- في System Variables، اختر "Path"
- اضغط "Edit"
- اضغط "New" وأضف:
  ```
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\tools
  %ANDROID_HOME%\build-tools
  ```
- اضغط OK

### 5. أعد تشغيل Command Prompt

---

## 🚀 الخطوة 3: بناء APK

### الطريقة السهلة (استخدم السكريبت):

1. افتح Command Prompt
2. اذهب للمجلد:
   ```bash
   cd C:\Users\cct33\Downloads\2yam\OliviaShip-Mobile-App
   ```
3. شغل السكريبت:
   ```bash
   بناء_APK.bat
   ```
4. انتظر 10-20 دقيقة
5. ستجد `OliviaShip.apk` في المجلد

---

### الطريقة اليدوية:

```bash
cd C:\Users\cct33\Downloads\2yam\OliviaShip-Mobile-App

# 1. تثبيت الحزم (إذا لم تكن مثبتة)
npm install

# 2. إنشاء مجلد Android
npx react-native init TempApp
xcopy TempApp\android android /E /I /Y
rmdir /s /q TempApp

# 3. بناء APK
cd android
gradlew assembleRelease
cd ..

# 4. نسخ APK
copy android\app\build\outputs\apk\release\app-release.apk OliviaShip.apk
```

---

## 🔧 الخطوة 4: إذا فشل البناء

### المشكلة 1: "ANDROID_HOME not set"
**الحل:** راجع الخطوة 2 أعلاه

### المشكلة 2: "SDK location not found"
**الحل:** أنشئ ملف `android/local.properties`:
```
sdk.dir=C:\\Users\\cct33\\AppData\\Local\\Android\\Sdk
```

### المشكلة 3: "Gradle not found"
**الحل:** 
1. افتح Android Studio
2. اذهب إلى Tools > SDK Manager
3. تأكد من تثبيت:
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

### المشكلة 4: "Build failed"
**الحل:**
```bash
cd android
gradlew clean
gradlew assembleRelease
```

---

## 📱 الخطوة 5: تثبيت APK على الجوال

### الطريقة 1: عبر USB
```bash
adb install OliviaShip.apk
```

### الطريقة 2: نقل الملف
1. انقل `OliviaShip.apk` للجوال (عبر USB أو WhatsApp)
2. افتح الملف من File Manager
3. اضغط Install
4. قد تحتاج تفعيل "Install from Unknown Sources"

---

## ⚡ الطريقة الأسرع (بدون بناء!)

إذا كنت تريد فقط تجربة التطبيق:

### استخدم Expo:
```bash
npm install -g expo-cli
cd OliviaShip-Mobile-App
npx expo start
```

ثم امسح QR Code من جوالك باستخدام تطبيق Expo Go.

---

## 🆘 إذا ما اشتغل

### الحل البديل: استخدم خدمة سحابية

#### 1. EAS Build (Expo)
```bash
npm install -g eas-cli
eas build --platform android
```
سيبني APK على السحابة وينزله لك.

#### 2. AppCenter (Microsoft)
- ارفع الكود على GitHub
- اربطه بـ AppCenter
- سيبني APK تلقائياً

---

## 📞 تحتاج مساعدة؟

إذا واجهت مشاكل:

1. **تأكد من تثبيت Android Studio بشكل صحيح**
2. **تأكد من متغيرات البيئة**
3. **أعد تشغيل Command Prompt**
4. **جرب الطريقة اليدوية**
5. **ابحث عن الخطأ في Google**

---

## ✅ Checklist

- [ ] Android Studio مثبت
- [ ] متغيرات البيئة مضبوطة
- [ ] `adb version` يعمل
- [ ] الحزم مثبتة (`npm install`)
- [ ] مجلد `android` موجود
- [ ] شغلت `بناء_APK.bat`
- [ ] انتظرت 10-20 دقيقة
- [ ] حصلت على `OliviaShip.apk`
- [ ] ثبته على الجوال
- [ ] يعمل! 🎉

---

**بالتوفيق! 🚀**
