@echo off
chcp 65001 >nul
echo ========================================
echo   فحص حالة الخدمات
echo ========================================
echo.

echo [1/3] فحص الخادم (Port 5000)...
netstat -an | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ الخادم يعمل على البورت 5000
) else (
    echo ❌ الخادم غير يعمل
    echo    شغّل: START_SERVER.bat
)

echo.
echo [2/3] فحص Metro Bundler (Port 8081)...
netstat -an | findstr ":8081" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Metro Bundler يعمل على البورت 8081
) else (
    echo ❌ Metro Bundler غير يعمل
    echo    شغّل: mobile-app\OliviaShipApp\RUN_APP.bat
)

echo.
echo [3/3] فحص Android Emulator...
adb devices | findstr "device" >nul
if %errorlevel% == 0 (
    echo ✅ يوجد جهاز/محاكي متصل
    adb devices
) else (
    echo ⚠️  لا يوجد جهاز/محاكي متصل
    echo    افتح Android Studio وابدأ Emulator
)

echo.
echo ========================================
pause






