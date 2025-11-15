@echo off
echo ========================================
echo   بناء APK لتطبيق أوليفيا شيب
echo   Build APK for Olivia Ship App
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] التحقق من EAS CLI...
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo EAS CLI غير مثبت. جاري التثبيت...
    call npm install -g eas-cli
    echo.
)

echo.
echo [2/4] تسجيل الدخول لحساب Expo...
echo ملاحظة: إذا لم يكن لديك حساب، سجل من: https://expo.dev/signup
echo.
call eas login

echo.
echo [3/4] إعداد المشروع...
call eas build:configure

echo.
echo [4/4] بناء APK...
echo ملاحظة: هذه العملية قد تستغرق 5-10 دقائق
echo.
call eas build -p android --profile preview

echo.
echo ========================================
echo   تم! ✅
echo   سيتم إعطاؤك رابط لتحميل APK
echo ========================================
echo.

pause
