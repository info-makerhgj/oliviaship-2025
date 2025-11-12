@echo off
echo ========================================
echo   فتح لوحات التحكم
echo ========================================
echo.

echo [1/4] فتح Vercel Dashboard...
start https://vercel.com/dashboard

timeout /t 2 /nobreak >nul

echo [2/4] فتح Railway Dashboard...
start https://railway.app/

timeout /t 2 /nobreak >nul

echo [3/4] فتح الموقع...
start https://oliviaship-2025-olivia-ships-projects.vercel.app

timeout /t 2 /nobreak >nul

echo [4/4] فتح API Health Check...
start https://oliviaship-2025-production.up.railway.app/api/health

echo.
echo ========================================
echo   تم فتح جميع الصفحات!
echo ========================================
echo.
echo الخطوات التالية:
echo.
echo 1. في Vercel:
echo    - Settings ^> Environment Variables
echo    - اضف: VITE_API_URL
echo    - القيمة: https://oliviaship-2025-production.up.railway.app/api
echo    - اختر: Production, Preview, Development
echo    - Save ثم Redeploy
echo.
echo 2. في Railway:
echo    - Variables
echo    - اضف/حدث:
echo      FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
echo      CLIENT_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app
echo      NODE_ENV=production
echo    - Redeploy
echo.
pause
