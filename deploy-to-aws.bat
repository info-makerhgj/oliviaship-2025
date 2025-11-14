@echo off
chcp 65001 >nul
echo ========================================
echo   🚀 نشر التحديثات على AWS Lightsail
echo ========================================
echo.

REM التحقق من وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت! يرجى تثبيت Git أولاً
    pause
    exit /b 1
)

echo [1/4] 📝 حفظ التغييرات محلياً...
git add .
git commit -m "fix: Remove duplicate CORS headers"
if errorlevel 1 (
    echo ⚠️ لا توجد تغييرات جديدة
)

echo.
echo [2/4] ⬆️ رفع التحديثات إلى GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ فشل في رفع التحديثات
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ تم رفع التحديثات إلى GitHub بنجاح!
echo ========================================
echo.
echo 📋 الخطوات التالية:
echo.
echo 1️⃣ افتح SSH إلى AWS Lightsail:
echo    ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP
echo.
echo 2️⃣ على السيرفر، شغل:
echo    cd /home/ubuntu/yemen-global-delivery
echo    git pull origin main
echo    npm install
echo    pm2 restart all
echo.
echo 3️⃣ تحقق من الـ logs:
echo    pm2 logs
echo.
echo ⏳ أو استخدم السكريبت التلقائي: deploy-to-aws-ssh.bat
echo.
pause
