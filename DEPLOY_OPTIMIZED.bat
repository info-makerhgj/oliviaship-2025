@echo off
echo ========================================
echo   نشر النسخة المحسنة على Vercel
echo ========================================
echo.

echo [1/4] بناء المشروع...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ فشل البناء!
    pause
    exit /b 1
)
echo ✅ البناء نجح
echo.

echo [2/4] إضافة الملفات...
git add .
echo ✅ تم إضافة الملفات
echo.

echo [3/4] حفظ التغييرات...
git commit -m "⚡ تحسينات السرعة: Code Splitting + Lazy Loading + Caching"
echo ✅ تم حفظ التغييرات
echo.

echo [4/4] رفع على GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ فشل الرفع!
    pause
    exit /b 1
)
echo ✅ تم الرفع بنجاح
echo.

echo ========================================
echo   ✅ تم النشر بنجاح!
echo ========================================
echo.
echo Vercel سيقوم بالنشر تلقائياً خلال 2-3 دقائق
echo تابع التقدم على: https://vercel.com/dashboard
echo.
pause
