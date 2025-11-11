@echo off
chcp 65001 >nul
echo ========================================
echo   إصلاح بيئة التطوير
echo ========================================
echo.

echo [1/4] البحث عن Java...
where java >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Java موجود
    java -version
) else (
    echo ❌ Java غير موجود في PATH
    echo    يجب تثبيت JDK من:
    echo    https://www.oracle.com/java/technologies/downloads/
)

echo.
echo [2/4] البحث عن Android SDK...
if defined ANDROID_HOME (
    echo ✅ ANDROID_HOME: %ANDROID_HOME%
) else (
    echo ❌ ANDROID_HOME غير مضبوط
    echo    يجب فتح Android Studio وإعداده
)

echo.
echo [3/4] البحث عن ADB...
where adb >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ ADB موجود
    adb version
) else (
    echo ❌ ADB غير موجود
    echo    أضف Android SDK platform-tools إلى PATH
)

echo.
echo [4/4] فحص Emulators...
where emulator >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Emulator command موجود
    echo    جاري سرد Emulators المتاحة...
    emulator -list-avds
) else (
    echo ❌ Emulator command غير موجود
    echo    افتح Android Studio وابدأ Emulator يدوياً
)

echo.
echo ========================================
echo   ملخص المشاكل:
echo ========================================
echo.
echo إذا رأيت ❌:
echo   1. افتح Android Studio
echo   2. Tools → SDK Manager → تأكد من التثبيت
echo   3. Tools → Device Manager → ابدأ Emulator
echo   4. File → Project Structure → SDK Location
echo.
pause






