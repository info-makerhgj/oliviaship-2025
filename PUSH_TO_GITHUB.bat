@echo off
chcp 65001 >nul
echo ========================================
echo   رفع المشروع على GitHub
echo ========================================
echo.

set TOKEN=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
set REPO=info-makerhzj/oliviaship-2025

echo [1/3] إعداد Git...
git config user.name "info-makerhzj"
git config user.email "info.makerhzj@gmail.com"

echo.
echo [2/3] إضافة Remote...
git remote remove origin 2>nul
git remote add origin https://%TOKEN%@github.com/%REPO%.git

echo.
echo [3/3] رفع الكود...
git push -u origin main --force

echo.
if %errorlevel% == 0 (
    echo ✅ تم رفع المشروع بنجاح!
    echo.
    echo افتح الرابط:
    echo https://github.com/%REPO%
) else (
    echo ❌ فشل الرفع!
    echo.
    echo جرب:
    echo 1. تأكد من اتصال الإنترنت
    echo 2. تأكد من صلاحيات الـ Token
    echo 3. تأكد من وجود الـ Repository
)

echo.
pause
