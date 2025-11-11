# 🍎 بناء IPA للآيفون

## ⚠️ تحذير مهم

**بناء IPA يحتاج Mac فقط!**
لا يمكن بناؤه على Windows أبداً.

---

## 🎯 المتطلبات

### 1. جهاز Mac
- MacBook, iMac, أو Mac Mini
- macOS 12 أو أحدث

### 2. Xcode
- حمل من App Store (مجاني)
- حجمه حوالي 12 GB

### 3. حساب Apple Developer
- التكلفة: $99 سنوياً
- التسجيل: https://developer.apple.com

### 4. iPhone للاختبار
- iOS 12 أو أحدث

---

## 🚀 خطوات البناء

### الخطوة 1: تثبيت الحزم
```bash
cd OliviaShip-Mobile-App
npm install
```

### الخطوة 2: تثبيت CocoaPods
```bash
cd ios
pod install
cd ..
```

### الخطوة 3: فتح Xcode
```bash
open ios/OliviaShip.xcworkspace
```

**⚠️ مهم:** افتح `.xcworkspace` وليس `.xcodeproj`

### الخطوة 4: إعداد Signing
في Xcode:
1. اختر المشروع من الشريط الجانبي
2. اختر Target > OliviaShip
3. اذهب إلى Signing & Capabilities
4. اختر Team (حساب Apple Developer)
5. غير Bundle Identifier إلى: `com.yourcompany.oliviaship`

### الخطوة 5: بناء Archive
1. في Xcode، اختر: Product > Archive
2. انتظر 5-10 دقائق
3. عند الانتهاء، سيفتح Organizer

### الخطوة 6: Export IPA
في Organizer:
1. اختر Archive الذي بنيته
2. اضغط Distribute App
3. اختر:
   - **Ad Hoc:** للتوزيع المحدود (100 جهاز)
   - **App Store:** للرفع على App Store
   - **Development:** للاختبار فقط
4. اتبع الخطوات
5. احفظ IPA

---

## 📱 تثبيت IPA على iPhone

### الطريقة 1: عبر Xcode
1. وصل iPhone بالـ Mac
2. في Xcode: Window > Devices and Simulators
3. اسحب IPA إلى الجهاز

### الطريقة 2: عبر TestFlight (الأفضل)
1. ارفع IPA على App Store Connect
2. أضف المستخدمين كـ Testers
3. سيحملون التطبيق من TestFlight

### الطريقة 3: عبر أدوات خارجية
- **Diawi:** https://www.diawi.com
- **TestApp.io:** https://testapp.io
- **InstallOnAir:** https://www.installonair.com

---

## 🔧 إعدادات مهمة

### 1. تغيير اسم التطبيق
في `ios/OliviaShip/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>Olivia Ship</string>
```

### 2. تغيير Bundle ID
في Xcode > Signing & Capabilities:
```
com.yourcompany.oliviaship
```

### 3. إضافة الأيقونة
1. في Xcode، افتح Assets.xcassets
2. اضغط على AppIcon
3. اسحب الأيقونات بالأحجام المطلوبة

### 4. إضافة Splash Screen
1. في Xcode، افتح LaunchScreen.storyboard
2. صمم شاشة البداية

---

## 🆘 مشاكل شائعة

### المشكلة: "No signing certificate found"
**الحل:**
1. اذهب إلى Xcode > Preferences > Accounts
2. أضف حساب Apple Developer
3. اضغط Download Manual Profiles

### المشكلة: "Pod install failed"
**الحل:**
```bash
cd ios
pod deintegrate
pod install
```

### المشكلة: "Build failed"
**الحل:**
1. في Xcode: Product > Clean Build Folder
2. أعد البناء

---

## 💰 التكاليف

### حساب Apple Developer:
- **$99 سنوياً** (إجباري)
- يسمح بـ:
  - الرفع على App Store
  - TestFlight
  - Push Notifications

### بدون حساب Developer:
- يمكنك البناء للاختبار فقط
- لمدة 7 أيام فقط
- لا يمكن الرفع على App Store

---

## 🌐 بدائل بدون Mac

### 1. Expo EAS Build
- يبني IPA على السحابة
- **$29/شهر**
- https://expo.dev/eas

### 2. Codemagic
- CI/CD كامل
- **$40/شهر**
- https://codemagic.io

### 3. استأجر Mac في السحابة
- MacinCloud: **$30/شهر**
- MacStadium: **$79/شهر**

### 4. PWA (مجاني!)
- يعمل على iPhone
- لا يحتاج App Store
- لا يحتاج Mac

---

## 📝 ملاحظات مهمة

1. **أول بناء يأخذ وقت طويل** (10-20 دقيقة)
2. **تحتاج اتصال إنترنت جيد** لتحميل Dependencies
3. **IPA حجمه أكبر من APK** (عادة 50-100 MB)
4. **مراجعة App Store تأخذ 1-7 أيام**

---

## ✅ Checklist

- [ ] عندي Mac
- [ ] ثبت Xcode
- [ ] عندي حساب Apple Developer ($99)
- [ ] ثبت الحزم (`npm install`)
- [ ] ثبت Pods (`pod install`)
- [ ] فتحت `.xcworkspace` في Xcode
- [ ] أعددت Signing
- [ ] بنيت Archive
- [ ] صدرت IPA
- [ ] جاهز! 🚀

---

## 🆘 إذا ما عندك Mac

**الحل الأفضل:** استخدم PWA
- يعمل على iPhone
- لا يحتاج Mac
- لا يحتاج App Store
- مجاني تماماً

**هل تريد أن أحول الموقع إلى PWA؟**

---

**بالتوفيق! 🍎**
