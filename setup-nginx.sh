#!/bin/bash

echo "🔧 إعداد Nginx لـ oliviaship.com..."

# إنشاء ملف إعدادات oliviaship.com
sudo tee /etc/nginx/sites-available/oliviaship.com > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name oliviaship.com www.oliviaship.com;

    root /var/www/html;
    index index.html;

    # Frontend - React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - توجيه إلى Node.js
    location /api/ {
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

    # Uploads folder
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ تم إنشاء ملف الإعدادات"

# إنشاء symlink
echo "🔗 إنشاء symlink..."
sudo ln -sf /etc/nginx/sites-available/oliviaship.com /etc/nginx/sites-enabled/

# حذف default إذا موجود
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️ حذف default..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# اختبار الإعدادات
echo "🧪 اختبار إعدادات Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ الإعدادات صحيحة!"
    echo "🔄 إعادة تشغيل Nginx..."
    sudo systemctl restart nginx
    echo "✅ تم إعادة تشغيل Nginx بنجاح!"
    echo ""
    echo "🎉 الآن جرب الموقع!"
else
    echo "❌ خطأ في الإعدادات!"
fi
