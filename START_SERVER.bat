@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل الخادم
echo ========================================
echo.

cd /d "%~dp0"
cd server
if not exist "package.json" (
    echo خطأ: مجلد server غير موجود!
    pause
    exit /b 1
)

echo [1/2] التحقق من التبعيات...
call npm install

echo.
echo [2/2] تشغيل الخادم على البورت 5000...
echo.
call npm start

pause

