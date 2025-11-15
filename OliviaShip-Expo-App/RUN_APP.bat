@echo off
echo ========================================
echo   تشغيل تطبيق أوليفيا شيب
echo   Olivia Ship App
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] التحقق من التثبيت...
if not exist "node_modules" (
    echo.
    echo تثبيت المكتبات...
    call npm install
)

echo.
echo [2/2] تشغيل التطبيق...
echo.
echo ملاحظة: سيفتح Expo في المتصفح
echo امسح QR Code بتطبيق Expo Go على جوالك
echo.

call npm start

pause
