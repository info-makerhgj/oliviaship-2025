#!/bin/bash

echo "🚀 نشر المشروع من الصفر مع حفظ البيانات..."
echo ""

# 1. حفظ البيانات المهمة
echo "💾 حفظ البيانات المهمة..."
mkdir -p ~/oliviaship-backup
cp ~/oliviaship-2025/.env ~/oliviaship-backup/.env 2>/dev/null || echo "⚠️ ملف .env غير موجود"
sudo cp -r ~/oliviaship-2025/uploads ~/oliviaship-backup/ 2>/dev/null || echo "⚠️ مجلد uploads غير موجود"
echo "✅ تم حفظ البيانات في ~/oliviaship-backup"
echo ""

# 2. إيقاف العمليات القديمة
echo "⏹️ إيقاف العمليات القديمة..."
pm2 delete all 2>/dev/null || echo "لا توجد عمليات pm2"
echo ""

# 3. التحديث من GitHub (بدون حذف)
echo "📥 تحديث المشروع من GitHub..."
cd ~/oliviaship-2025
git fetch --all
git reset --hard origin/main
git pull origin main
echo "✅ تم تحديث المشروع"
echo ""

# 5. استرجاع البيانات المهمة
echo "📂 استرجاع البيانات المهمة..."
cp ~/oliviaship-backup/.env ~/oliviaship-2025/.env 2>/dev/null || echo "⚠️ لم يتم العثور على .env"
cp -r ~/oliviaship-backup/uploads ~/oliviaship-2025/ 2>/dev/null || mkdir -p ~/oliviaship-2025/uploads
echo "✅ تم استرجاع البيانات"
echo ""

# 6. تثبيت المكتبات
echo "📦 تثبيت المكتبات..."
npm install
echo "✅ تم تثبيت المكتبات"
echo ""

# 7. بناء المشروع
echo "🔨 بناء المشروع..."
npm run build
echo "✅ تم بناء المشروع"
echo ""

# 8. نسخ الملفات إلى Nginx
echo "📋 نسخ الملفات إلى /var/www/html..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
echo "✅ تم نسخ الملفات"
echo ""

# 9. إعداد Nginx
echo "🔧 إعداد Nginx..."
sudo tee /etc/nginx/sites-available/oliviaship.com > /dev/null <<'EOF'
server {
    listen 80;
    server_name oliviaship.com www.oliviaship.com;
    root /var/www/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:5000;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/oliviaship.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
echo "✅ تم إعداد Nginx"
echo ""

# 10. تشغيل Backend
echo "🚀 تشغيل Backend..."
cd ~/oliviaship-2025
pm2 start server/index.js --name oliviaship-backend
pm2 startup
pm2 save
echo "✅ تم تشغيل Backend"
echo ""

# 11. التحقق من النتيجة
echo "🎉 انتهى النشر!"
echo ""
echo "📊 حالة العمليات:"
pm2 status
echo ""
echo "🌐 الموقع: http://oliviaship.com"
echo "📝 ملاحظة: امسح cache Cloudflare من لوحة التحكم"
echo "🔄 أو افتح الموقع في Incognito Mode"
