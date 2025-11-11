@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل MongoDB
echo ========================================
echo.

echo [1/3] فحص MongoDB...
netstat -an | findstr ":27017" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB يعمل بالفعل على المنفذ 27017
    echo.
    pause
    exit /b 0
)

echo ❌ MongoDB غير متصل
echo.

echo [2/3] محاولة تشغيل MongoDB كخدمة...
net start MongoDB 2>nul
if %errorlevel% == 0 (
    echo ✅ تم تشغيل MongoDB كخدمة
    echo.
    timeout /t 3 /nobreak >nul
    goto :check
)

echo ⚠️  لم يتم العثور على خدمة MongoDB
echo.

echo [3/3] طرق بديلة لتشغيل MongoDB:
echo.
echo 1. من Command Prompt:
echo    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
echo.
echo 2. أو من مجلد التثبيت:
echo    cd "C:\Program Files\MongoDB\Server\7.0\bin"
echo    mongod.exe
echo.
echo 3. أو استخدم MongoDB Compass (GUI)
echo.

:check
echo [فحص] التحقق من حالة MongoDB...
timeout /t 2 /nobreak >nul
netstat -an | findstr ":27017" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB يعمل الآن على المنفذ 27017
    echo.
    echo الآن يمكنك تشغيل الخادم:
    echo   cd server
    echo   npm start
) else (
    echo ❌ MongoDB لا يزال غير متصل
    echo.
    echo يرجى تشغيل MongoDB يدوياً من:
    echo   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
    echo.
    echo أو تأكد من تثبيت MongoDB
)

echo.
pause






