@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل تطبيق Olivia Ship
echo ========================================
echo.

echo [1/6] إعداد متغيرات البيئة...
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set JAVA_HOME=%LOCALAPPDATA%\Android\Sdk\jbr
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\tools;%JAVA_HOME%\bin;%PATH%
echo ✅ تم

echo.
echo [2/6] التحقق من المحاكي...
adb devices
echo.

echo [3/6] تشغيل Metro Bundler...
start "Metro Bundler" cmd /k "npm start"
timeout /t 10 /nobreak >nul

echo.
echo [4/6] بناء وتشغيل التطبيق...
echo هذا قد يستغرق 5-10 دقائق في أول مرة...
echo.

npx react-native run-android

echo.
echo ========================================
echo   انتهى!
echo ========================================
echo.
echo إذا نجح، سترى التطبيق على المحاكي
echo إذا فشل، راجع الأخطاء أعلاه
echo.
pause
