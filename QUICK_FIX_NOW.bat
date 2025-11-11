@echo off
chcp 65001 >nul
echo ========================================
echo   الحل السريع
echo ========================================
echo.

echo ⚠️  المشاكل الموجودة:
echo   1. JAVA_HOME غير مضبوط
echo   2. ADB غير موجود في PATH
echo   3. لا يوجد Emulator يعمل
echo.

echo ========================================
echo   الحل الأسهل: استخدم Android Studio
echo ========================================
echo.
echo الخطوات:
echo   1. افتح Android Studio
echo   2. File → Open
echo   3. اختر: mobile-app\OliviaShipApp\android
echo   4. انتظر Gradle Sync
echo   5. Run → Run 'app'
echo.

echo ========================================
echo   أو أصلح البيئة يدوياً:
echo ========================================
echo.
echo 1. تثبيت JDK 17
echo    https://www.oracle.com/java/technologies/downloads/
echo.
echo 2. ضبط JAVA_HOME في Environment Variables
echo    C:\Program Files\Java\jdk-17
echo.
echo 3. ضبط ANDROID_HOME في Environment Variables
echo    C:\Users\%USERNAME%\AppData\Local\Android\Sdk
echo.
echo 4. أضف إلى PATH:
echo    %%ANDROID_HOME%%\platform-tools
echo    %%ANDROID_HOME%%\tools
echo    %%ANDROID_HOME%%\emulator
echo.
echo 5. افتح Android Studio
echo    Tools → Device Manager → Start Emulator
echo.

pause






