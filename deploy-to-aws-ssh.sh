#!/bin/bash

# 🚀 سكريبت النشر التلقائي على AWS Lightsail
# يتم تشغيله على السيرفر مباشرة

echo "========================================"
echo "  🚀 نشر التحديثات على AWS Lightsail"
echo "========================================"
echo ""

# الانتقال لمجلد المشروع
cd /home/ubuntu/yemen-global-delivery || {
    echo "❌ خطأ: مجلد المشروع غير موجود"
    exit 1
}

echo "[1/5] 📥 جلب التحديثات من GitHub..."
git fetch origin main
if [ $? -ne 0 ]; then
    echo "❌ فشل في جلب التحديثات"
    exit 1
fi

echo ""
echo "[2/5] 🔄 تطبيق التحديثات..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ فشل في تطبيق التحديثات"
    exit 1
fi

echo ""
echo "[3/5] 📦 تثبيت Dependencies الجديدة (إن وجدت)..."
npm install --production
if [ $? -ne 0 ]; then
    echo "⚠️ تحذير: مشكلة في تثبيت Dependencies"
fi

echo ""
echo "[4/5] 🔄 إعادة تشغيل السيرفر..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ تم إعادة تشغيل PM2"
else
    sudo systemctl restart oliviaship-backend
    echo "✅ تم إعادة تشغيل systemd service"
fi

echo ""
echo "[5/5] 📊 فحص حالة السيرفر..."
sleep 3

if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    echo "📝 لعرض الـ logs:"
    echo "   pm2 logs"
else
    sudo systemctl status oliviaship-backend --no-pager
fi

echo ""
echo "========================================"
echo "✅ تم النشر بنجاح!"
echo "========================================"
echo ""
echo "🔗 اختبر API:"
echo "   curl https://api.oliviaship.com/api/health"
echo ""
