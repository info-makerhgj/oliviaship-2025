@echo off
echo ========================================
echo   اختبار حالة Railway
echo ========================================
echo.

echo [1/3] فتح Railway Dashboard...
start https://railway.app/

timeout /t 2 /nobreak >nul

echo [2/3] فتح Railway Logs...
echo (اضغط على مشروعك ثم Deployments ثم Logs)

timeout /t 2 /nobreak >nul

echo [3/3] اختبار API Health Check...
start https://oliviaship-2025-production.up.railway.app/api/health

echo.
echo ========================================
echo   ماذا تتوقع ان ترى:
echo ========================================
echo.
echo في صفحة Health Check:
echo   {"status":"OK","message":"Server is running"}
echo.
echo اذا لم تفتح الصفحة او ظهر خطأ:
echo   - السيرفر واقف
echo   - شوف Railway Logs للاخطاء
echo.
echo الاخطاء الشائعة:
echo   1. MongoDB connection failed
echo   2. Missing environment variables
echo   3. Port binding error
echo.
pause
