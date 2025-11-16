#!/bin/bash

echo "🔍 فحص إعدادات Nginx..."
echo ""

# عرض إعدادات oliviaship
echo "📄 إعدادات oliviaship.com:"
sudo cat /etc/nginx/sites-available/oliviaship.com
echo ""
echo "---"
echo ""

# عرض إعدادات api.oliviaship
echo "📄 إعدادات api.oliviaship.com:"
if [ -f /etc/nginx/sites-available/api.oliviaship.com ]; then
    sudo cat /etc/nginx/sites-available/api.oliviaship.com
else
    echo "❌ ملف api.oliviaship.com غير موجود!"
fi
echo ""
echo "---"
echo ""

# فحص الـ symlinks
echo "🔗 الـ symlinks في sites-enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""

# فحص حالة Nginx
echo "✅ حالة Nginx:"
sudo systemctl status nginx --no-pager | head -10
