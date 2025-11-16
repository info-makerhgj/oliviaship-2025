#!/bin/bash

# 🚀 سكريبت تحديث تلقائي لموقع Olivia Ship
# يحل جميع مشاكل الـ deployment

echo "🚀 بدء عملية التحديث..."

# 1. سحب آخر التحديثات من GitHub
echo "📥 سحب التحديثات من GitHub..."
git fetch --all
git reset --hard origin/main

# 2. التأكد من وجود مجلد dist
if [ ! -d "dist" ]; then
    echo "❌ مجلد dist غير موجود!"
    exit 1
fi

echo "✅ مجلد dist موجود"

# 3. نسخ الملفات إلى مجلد Nginx
echo "📂 نسخ الملفات إلى /var/www/html..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# 4. إعطاء الصلاحيات الصحيحة
echo "🔐 إعطاء الصلاحيات..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo chmod 755 /var/www

# 5. إعادة تشغيل Nginx
echo "🔄 إعادة تشغيل Nginx..."
sudo systemctl restart nginx

# 6. التحقق من النتيجة
echo "✅ التحقق من التحديث..."
if curl -s http://localhost:80 | grep -q "Olivia Ship"; then
    echo "✅ التحديث نجح! الموقع يعمل بشكل صحيح"
else
    echo "⚠️ تحذير: قد تحتاج لمسح cache المتصفح"
fi

echo ""
echo "🎉 انتهى التحديث!"
echo "📝 ملاحظة: امسح cache المتصفح (Ctrl+Shift+Delete)"
echo "🌐 أو افتح الموقع في Incognito Mode"
