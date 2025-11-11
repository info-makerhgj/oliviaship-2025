# 📦 دليل بناء APK

## 🎯 المتطلبات

قبل البناء، تحتاج:

### 1. Android Studio
- حمل من: https://developer.android.com/studio
- ثبته (حجمه حوالي 1 GB)
- افتحه مرة واحدة لتثبيت SDK

### 2. Java JDK
- يأتي مع Android Studio
- أو حمل من: https://www.oracle.com/java/technologies/downloads/

### 3. متغيرات البيئة
بعد تثبيت Android Studio، أضف:

**ANDROID_HOME:**
```
C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

**Path:**
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

---

## 🚀 بناء APK (طريقتان)

### الطريقة 1: استخدم السكريبت (الأسهل)

1. افتح `بناء_APK.bat`
2. انتظر 10-20 دقيقة
3. ستجد `OliviaShip.apk` في المجلد

### الطريقة 2: يدوياً

```bash
cd OliviaShip-Mobile-App
cd android
gradlew assembleRelease
```

الملف في: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 تثبيت APK على الجوال

### الطريقة 1: عبر USB
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### الطريقة 2: نقل الملف
1. انقل `OliviaShip.apk` للجوال
2. افتحه من File Manager
3. اضغط Install
4. قد تحتاج تفعيل "Install from Unknown Sources"

---

## ⚠️ مشاكل شائعة

### المشكلة: "ANDROID_HOME not set"
**الحل:**
1. افتح System Properties
2. Environment Variables
3. أضف `ANDROID_HOME` = `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`

### المشكلة: "SDK location not found"
**الحل:**
أنشئ ملف `android/local.properties`:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### المشكلة: "Gradle build failed"
**الحل:**
```bash
cd android
gradlew clean
gradlew assembleRelease
```

---

## 🎨 تخصيص APK

قبل البناء، يمكنك:

### 1. تغيير اسم التطبيق
في `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Olivia Ship</string>
```

### 2. تغيير Package Name
في `android/app/build.gradle`:
```gradle
applicationId "com.oliviaship"
```

### 3. تغيير الأيقونة
ضع الأيقونات في:
```
android/app/src/main/res/mipmap-*/
```

---

## 📦 حجم APK

- **Debug APK:** ~50-80 MB
- **Release APK:** ~30-50 MB
- **AAB (للمتجر):** ~20-30 MB

---

## 🚀 الخطوات الكاملة

### 1. ثبت Android Studio
- حمل وثبت
- افتحه مرة واحدة

### 2. أضف متغيرات البيئة
- ANDROID_HOME
- Path

### 3. ابني APK
```bash
cd OliviaShip-Mobile-App
بناء_APK.bat
```

### 4. ثبت على الجوال
- انقل الملف
- ثبته
- شغله

---

## 💡 نصائح

1. **أول بناء يأخذ وقت طويل** (10-20 دقيقة)
2. **البناءات التالية أسرع** (2-5 دقائق)
3. **استخدم WiFi سريع** لتحميل Dependencies
4. **أغلق البرامج الأخرى** لتسريع البناء

---

## 🆘 إذا فشل البناء

1. تأكد من تثبيت Android Studio
2. تأكد من متغيرات البيئة
3. شغل `gradlew clean` ثم حاول مرة أخرى
4. ابحث عن الخطأ في Google

---

**بالتوفيق! 🚀**
