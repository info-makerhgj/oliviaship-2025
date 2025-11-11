@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل MongoDB بسرعة
echo ========================================
echo.

echo [1/4] فحص MongoDB...
netstat -an | findstr ":27017" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB يعمل بالفعل!
    echo.
    pause
    exit /b 0
)

echo ❌ MongoDB غير متصل
echo.

echo [2/4] محاولة تشغيل MongoDB كخدمة...
net start MongoDB 2>nul
if %errorlevel% == 0 (
    echo ✅ تم تشغيل MongoDB
    timeout /t 2 /nobreak >nul
    goto :check
)

echo ⚠️  لم يتم العثور على خدمة MongoDB
echo.

echo [3/4] البحث عن mongod.exe...
set MONGODB_PATH=
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    set MONGODB_PATH=C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe
) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
    set MONGODB_PATH=C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe
) else if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" (
    set MONGODB_PATH=C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe
)

if "%MONGODB_PATH%"=="" (
    echo ❌ لم يتم العثور على MongoDB
    echo.
    echo يرجى تثبيت MongoDB من:
    echo   https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo ✅ تم العثور على MongoDB: %MONGODB_PATH%
echo.

echo [4/4] تشغيل MongoDB...
start "MongoDB" "%MONGODB_PATH%"
echo ✅ تم بدء تشغيل MongoDB في نافذة منفصلة
echo.

:check
echo [انتظار] انتظر 3 ثواني...
timeout /t 3 /nobreak >nul

echo [فحص] التحقق من حالة MongoDB...
netstat -an | findstr ":27017" >nul
if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo   ✅ MongoDB يعمل الآن!
    echo ========================================
    echo.
    echo الآن يمكنك:
    echo   1. شغل الخادم: cd server && npm start
    echo   2. افتح الموقع: http://localhost:5173
    echo.
) else (
    echo.
    echo ========================================
    echo   ⚠️  MongoDB لا يزال غير متصل
    echo ========================================
    echo.
    echo حاول:
    echo   1. شغل Command Prompt كمسؤول
    echo   2. شغل: net start MongoDB
    echo   3. أو شغل MongoDB Compass
    echo.
)

pause






