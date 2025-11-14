@echo off
echo ========================================
echo   اصلاح مشكلة CORS ونشر التحديثات
echo ========================================
echo.

echo [1/3] اضافة التغييرات...
git add server/index.js
if errorlevel 1 (
    echo ❌ فشل في اضافة الملفات
    pause
    exit /b 1
)

echo.
echo [2/3] حفظ التغييرات...
git commit -m "fix: Remove duplicate CORS headers causing multiple Access-Control-Allow-Origin values"
if errorlevel 1 (
    echo ⚠️ لا توجد تغييرات جديدة او فشل الحفظ
)

echo.
echo [3/3] رفع التحديثات...
git push origin main
if errorlevel 1 (
    echo ❌ فشل في رفع التحديثات
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ تم اصلاح مشكلة CORS بنجاح!
echo ========================================
echo.
echo التغييرات:
echo - ازالة middleware المكرر للـ CORS
echo - اضافة www.oliviaship.com للنطاقات المسموحة
echo.
echo ⏳ انتظر 2-3 دقائق حتى يتم نشر التحديثات على Railway
echo.
pause
