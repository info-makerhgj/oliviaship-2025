@echo off
chcp 65001 >nul
echo ========================================
echo   فحص حالة الخادم وقاعدة البيانات
echo ========================================
echo.

echo [1/3] فحص MongoDB...
netstat -an | findstr ":27017" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB يعمل على المنفذ 27017
) else (
    echo ❌ MongoDB غير متصل على المنفذ 27017
    echo    تأكد من تشغيل MongoDB
)

echo.
echo [2/3] فحص الخادم...
netstat -an | findstr ":5000" >nul
if %errorlevel% == 0 (
    echo ✅ الخادم يعمل على المنفذ 5000
) else (
    echo ❌ الخادم غير متصل على المنفذ 5000
    echo    شغل الخادم: cd server && npm start
)

echo.
echo [3/3] فحص Frontend...
netstat -an | findstr ":5173" >nul
if %errorlevel% == 0 (
    echo ✅ Frontend يعمل على المنفذ 5173
) else (
    echo ❌ Frontend غير متصل على المنفذ 5173
    echo    شغل Frontend: npm run dev
)

echo.
echo ========================================
echo   للحصول على تفاصيل أكثر:
echo ========================================
echo.
echo 1. افتح Terminal في مجلد server
echo 2. شغل: npm start
echo 3. راقب الأخطاء في Terminal
echo.
pause






