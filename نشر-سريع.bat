@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 نشر التحديثات - خطوة بخطوة    ║
echo ╚════════════════════════════════════════╝
echo.

:MENU
echo اختر الخطوة:
echo.
echo [1] رفع التحديثات إلى GitHub
echo [2] عرض أوامر SSH للسيرفر
echo [3] عرض الدليل الكامل
echo [4] خروج
echo.
set /p choice="اختر رقم (1-4): "

if "%choice%"=="1" goto PUSH
if "%choice%"=="2" goto SSH
if "%choice%"=="3" goto GUIDE
if "%choice%"=="4" goto END
goto MENU

:PUSH
echo.
echo ════════════════════════════════════════
echo   📤 رفع التحديثات إلى GitHub
echo ════════════════════════════════════════
echo.
echo [1/3] إضافة التغييرات...
git add .
if errorlevel 1 (
    echo ❌ خطأ في Git
    pause
    goto MENU
)

echo.
echo [2/3] حفظ التغييرات...
git commit -m "fix: Remove duplicate CORS headers"

echo.
echo [3/3] رفع إلى GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo ❌ فشل الرفع!
    echo.
    echo 💡 تأكد من:
    echo    - اتصالك بالإنترنت
    echo    - تسجيل دخولك إلى Git
    echo    - صلاحياتك على المشروع
    pause
    goto MENU
)

echo.
echo ✅ تم رفع التحديثات بنجاح!
echo.
echo 📋 الخطوة التالية: اختر [2] لعرض أوامر السيرفر
echo.
pause
goto MENU

:SSH
echo.
echo ════════════════════════════════════════
echo   🖥️ أوامر السيرفر
echo ════════════════════════════════════════
echo.
echo 📝 انسخ هذه الأوامر وشغلها على السيرفر:
echo.
echo ┌────────────────────────────────────────┐
echo │ 1. الاتصال بالسيرفر:                  │
echo └────────────────────────────────────────┘
echo.
echo ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP
echo.
echo ┌────────────────────────────────────────┐
echo │ 2. بعد الاتصال، شغل:                  │
echo └────────────────────────────────────────┘
echo.
echo cd /home/ubuntu/yemen-global-delivery
echo git pull origin main
echo npm install
echo pm2 restart all
echo pm2 logs
echo.
echo ┌────────────────────────────────────────┐
echo │ 3. اختبار API:                        │
echo └────────────────────────────────────────┘
echo.
echo curl https://api.oliviaship.com/api/health
echo.
echo ════════════════════════════════════════
echo.
pause
goto MENU

:GUIDE
echo.
echo ════════════════════════════════════════
echo   📖 فتح الدليل الكامل
echo ════════════════════════════════════════
echo.
start دليل-النشر-خطوة-بخطوة.md
echo.
echo ✅ تم فتح الدليل!
echo.
pause
goto MENU

:END
echo.
echo 👋 مع السلامة!
echo.
exit /b 0
