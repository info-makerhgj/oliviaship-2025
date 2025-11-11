@echo off
chcp 65001 >nul
echo ========================================
echo   بناء APK - Olivia Ship
echo ========================================
echo.

echo [1/5] التحقق من Android SDK...
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ❌ Android SDK غير مثبت!
    echo.
    echo يرجى تثبيت Android Studio من:
    echo https://developer.android.com/studio
    echo.
    pause
    exit /b 1
)
echo ✅ Android SDK موجود

echo.
echo [2/5] التحقق من الحزم...
if not exist "node_modules" (
    echo جاري تثبيت الحزم...
    call npm install
)
echo ✅ الحزم جاهزة

echo.
echo [3/5] تنظيف البناء السابق...
cd android
call gradlew clean
cd ..
echo ✅ تم التنظيف

echo.
echo [4/5] بناء APK...
echo هذا قد يستغرق 10-20 دقيقة...
cd android
call gradlew.bat assembleRelease
cd ..

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo ========================================
    echo   ✅ تم بناء APK بنجاح!
    echo ========================================
    echo.
    echo الملف في:
    echo android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo [5/5] نسخ APK إلى المجلد الرئيسي...
    copy "android\app\build\outputs\apk\release\app-release.apk" "OliviaShip.apk"
    echo.
    echo ✅ تم! الملف: OliviaShip.apk
    echo.
    echo يمكنك الآن:
    echo 1. نقل الملف للجوال
    echo 2. تثبيته
    echo 3. تشغيل التطبيق
) else (
    echo.
    echo ❌ فشل البناء!
    echo راجع الأخطاء أعلاه
)

echo.
pause
