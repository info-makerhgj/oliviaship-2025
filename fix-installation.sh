#!/bin/bash

# 🔧 حل مشكلة التثبيت على AWS Lightsail

echo "🔍 فحص المشكلة..."
echo "================================"

# 1. فحص المساحة
echo ""
echo "📊 المساحة المتاحة:"
df -h /

# 2. فحص الذاكرة
echo ""
echo "💾 الذاكرة المتاحة:"
free -h

# 3. إيقاف التطبيق
echo ""
echo "⏸️  إيقاف التطبيق..."
pm2 stop all
pm2 delete all

# 4. حذف node_modules القديمة
echo ""
echo "🗑️  حذف node_modules القديمة..."
cd ~/oliviaship-2025
rm -rf node_modules
rm -rf package-lock.json

# 5. تنظيف npm cache
echo ""
echo "🧹 تنظيف npm cache..."
npm cache clean --force

# 6. تنظيف المساحة
echo ""
echo "🧹 تنظيف المساحة..."
sudo apt clean
sudo apt autoremove -y
sudo journalctl --vacuum-time=3d

# 7. فحص المساحة بعد التنظيف
echo ""
echo "📊 المساحة بعد التنظيف:"
df -h /

# 8. تثبيت dependencies بشكل صحيح
echo ""
echo "📦 تثبيت dependencies..."
echo "⚠️  هذا قد يأخذ 5-10 دقائق..."

# تثبيت بدون dev dependencies لتوفير المساحة
npm install --production --no-optional

# 9. التحقق من التثبيت
echo ""
echo "✅ التحقق من التثبيت..."
if [ -d "node_modules/cors" ]; then
    echo "✅ cors مثبت بنجاح"
else
    echo "❌ cors غير مثبت - المساحة غير كافية!"
    echo ""
    echo "🚨 الحل: ترقية الخطة إلى $5/شهر (40GB)"
    exit 1
fi

# 10. تشغيل التطبيق
echo ""
echo "🚀 تشغيل التطبيق..."
pm2 start server/index.js --name oliviaship
pm2 save

# 11. التحقق من الحالة
echo ""
echo "📊 حالة التطبيق:"
pm2 status

echo ""
echo "================================"
echo "✅ تم الإصلاح بنجاح!"
echo ""
echo "📝 للتحقق من logs:"
echo "pm2 logs oliviaship"
