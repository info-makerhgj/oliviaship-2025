#!/bin/bash

# 🔧 سكريبت إصلاح CORS في Nginx
# شغله على السيرفر مباشرة

echo "🔧 إصلاح مشكلة CORS في Nginx..."
echo ""

# إنشاء ملف Nginx جديد بدون CORS headers
sudo tee /etc/nginx/sites-available/oliviaship > /dev/null <<'EOF'
server {
    server_name api.oliviaship.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.oliviaship.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.oliviaship.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.oliviaship.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name api.oliviaship.com;
    return 404;
}
EOF

echo "✅ تم إنشاء ملف Nginx جديد"
echo ""

# اختبار الإعدادات
echo "🧪 اختبار إعدادات Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ الإعدادات صحيحة!"
    echo ""
    echo "🔄 إعادة تحميل Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "════════════════════════════════════"
        echo "✅ تم الإصلاح بنجاح!"
        echo "════════════════════════════════════"
        echo ""
        echo "🧪 اختبر الآن:"
        echo "   https://www.oliviaship.com"
        echo ""
    else
        echo ""
        echo "❌ فشل في إعادة تحميل Nginx"
    fi
else
    echo ""
    echo "❌ خطأ في إعدادات Nginx!"
    echo "لم يتم تطبيق التغييرات"
fi
