# 📱 Olivia Ship - تطبيق الجوال (WebView)

تطبيق جوال بسيط يعرض موقع Olivia Ship داخل WebView.

---

## 🚀 البدء السريع

### المتطلبات:
- Node.js (v18 أو أحدث)
- React Native CLI
- Android Studio (للأندرويد)
- Xcode (للآيفون - Mac فقط)

---

## 📦 التثبيت

### 1. تثبيت الحزم
```bash
cd OliviaShip-Mobile-App
npm install
```

### 2. للأندرويد
```bash
# تشغيل Metro Bundler
npm start

# في نافذة أخرى، شغل التطبيق
npm run android
```

### 3. للآيفون (Mac فقط)
```bash
# تثبيت CocoaPods
cd ios
pod install
cd ..

# تشغيل التطبيق
npm run ios
```

---

## ⚙️ الإعدادات

### تغيير عنوان الموقع:
افتح ملف `App.js` وغير السطر:
```javascript
const WEBSITE_URL = 'http://192.168.1.111:5173';
```

إلى:
```javascript
const WEBSITE_URL = 'https://your-domain.com';
```

---

## 🎨 تخصيص التطبيق

### 1. تغيير الاسم:
في ملف `app.json`:
```json
{
  "name": "OliviaShip",
  "displayName": "Olivia Ship"
}
```

### 2. تغيير الأيقونة:
- **Android:** ضع الأيقونات في `android/app/src/main/res/`
- **iOS:** استخدم Xcode لإضافة الأيقونات

### 3. تغيير Splash Screen:
- استخدم مكتبة `react-native-splash-screen`
- أو استخدم أدوات مثل [App Icon Generator](https://appicon.co/)

---

## 📱 المميزات

- ✅ يعمل على Android و iOS
- ✅ دعم الكاميرا والموقع
- ✅ حفظ الـ Token تلقائياً
- ✅ معالجة زر الرجوع (Android)
- ✅ شاشة تحميل
- ✅ معالجة الأخطاء
- ✅ دعم RTL (العربية)
- ✅ Cache للصفحات

---

## 🔧 حل المشاكل

### المشكلة: "Unable to load script"
**الحل:**
```bash
npm start -- --reset-cache
```

### المشكلة: "SDK location not found"
**الحل:**
أنشئ ملف `android/local.properties`:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### المشكلة: "Command not found: react-native"
**الحل:**
```bash
npm install -g react-native-cli
```

---

## 📦 بناء التطبيق للإنتاج

### Android (APK):
```bash
cd android
./gradlew assembleRelease
```
الملف في: `android/app/build/outputs/apk/release/app-release.apk`

### Android (AAB للـ Play Store):
```bash
cd android
./gradlew bundleRelease
```
الملف في: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS (Mac فقط):
1. افتح `ios/OliviaShip.xcworkspace` في Xcode
2. اختر Product > Archive
3. اتبع خطوات Xcode للرفع على App Store

---

## 🚀 الرفع على المتاجر

### Google Play Store:
1. أنشئ حساب مطور ($25 مرة واحدة)
2. ارفع ملف AAB
3. املأ بيانات التطبيق
4. انتظر المراجعة (1-3 أيام)

### Apple App Store:
1. أنشئ حساب مطور ($99 سنوياً)
2. استخدم Xcode للرفع
3. املأ بيانات التطبيق في App Store Connect
4. انتظر المراجعة (1-7 أيام)

---

## 📝 ملاحظات مهمة

1. **HTTPS مطلوب للإنتاج:**
   - غير `WEBSITE_URL` إلى `https://your-domain.com`
   - لا تستخدم `http://` في الإنتاج

2. **الأذونات:**
   - الكاميرا: مطلوبة لمسح QR
   - الموقع: مطلوبة لنقاط البيع
   - التخزين: لحفظ البيانات

3. **الاختبار:**
   - اختبر على أجهزة حقيقية
   - اختبر جميع المميزات
   - اختبر الاتصال البطيء

---

## 🆘 الدعم

إذا واجهت مشاكل:
1. راجع [React Native Docs](https://reactnative.dev/docs/getting-started)
2. راجع [WebView Docs](https://github.com/react-native-webview/react-native-webview)
3. ابحث في [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## 📄 الترخيص

MIT License

---

**آخر تحديث:** 9 يناير 2025
