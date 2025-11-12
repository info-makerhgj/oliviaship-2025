@echo off
echo ========================================
echo   اصلاح مشكلة CORS ورفع التغييرات
echo ========================================
echo.

echo [1/3] اضافة التغييرات...
git add .

echo.
echo [2/3] حفظ التغييرات...
git commit -m "Fix CORS for new Vercel domain and manifest.json routing"

echo.
echo [3/3] رفع التغييرات الى GitHub...
git push origin main

echo.
echo ========================================
echo   تم رفع التغييرات بنجاح!
echo ========================================
echo.
echo الخطوات التالية:
echo 1. Railway سيعيد النشر تلقائيا
echo 2. انتظر 2-3 دقائق
echo 3. افتح الموقع وتحقق من عمله
echo.
echo رابط الموقع:
echo https://oliviaship-2025-olivia-ships-projects.vercel.app
echo.
pause
