#!/bin/bash

echo "🔧 تطبيق إصلاح Nginx..."
echo ""

# نسخ الملف الجديد
sudo cp nginx-oliviaship-fixed.conf /etc/nginx/sites-available/oliviaship

# اختبار الإعدادات
echo "🧪 اختبار إعدادات Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ الإعدادات صحيحة!"
    echo ""
    echo "🔄 إعادة تحميل Nginx..."
    sudo systemctl reload nginx
    
    echo ""
    echo "✅ تم الإصلاح بنجاح!"
    echo ""
    echo "🧪 اختبر الآن:"
    echo "   curl -I https://api.oliviaship.com/api/health"
else
    echo ""
    echo "❌ خطأ في الإعدادات!"
    echo "لم يتم تطبيق التغييرات"
fi
