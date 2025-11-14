#!/bin/bash

# 🔒 سكريبت تثبيت SSL + Nginx لـ AWS Lightsail
# Domain: api.oliviaship.com

echo "🚀 بدء تثبيت SSL + Nginx..."
echo "================================"

# 1. تحديث النظام
echo ""
echo "📦 تحديث النظام..."
sudo apt update

# 2. تثبيت Nginx و Certbot
echo ""
echo "📦 تثبيت Nginx و Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. إنشاء ملف Nginx config
echo ""
echo "⚙️ إعداد Nginx..."
sudo tee /etc/nginx/sites-available/oliviaship > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.oliviaship.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://oliviaship-2025-olivia-ships-projects.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://oliviaship-2025-olivia-ships-projects.vercel.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }

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
}
EOF

# 4. تفعيل الموقع
echo ""
echo "✅ تفعيل الموقع..."
sudo ln -sf /etc/nginx/sites-available/oliviaship /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 5. اختبار Nginx config
echo ""
echo "🧪 اختبار إعدادات Nginx..."
sudo nginx -t

# 6. إعادة تشغيل Nginx
echo ""
echo "🔄 إعادة تشغيل Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 7. فتح Port 80 و 443 في UFW (إن وجد)
echo ""
echo "🔓 فتح Ports..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

# 8. تثبيت SSL Certificate
echo ""
echo "🔒 تثبيت SSL Certificate..."
echo "⚠️  سيطلب منك إدخال email address"
echo ""
sudo certbot --nginx -d api.oliviaship.com --non-interactive --agree-tos --email info@oliviaship.com --redirect

# 9. إعداد تجديد تلقائي
echo ""
echo "⏰ إعداد تجديد تلقائي للـ SSL..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 10. اختبار التجديد
echo ""
echo "🧪 اختبار تجديد SSL..."
sudo certbot renew --dry-run

echo ""
echo "================================"
echo "✅ تم الانتهاء بنجاح!"
echo ""
echo "🎉 الموقع الآن متاح على:"
echo "   https://api.oliviaship.com"
echo ""
echo "📝 للتحقق:"
echo "   curl https://api.oliviaship.com/api/health"
echo ""
echo "🔄 إذا لم يشتغل، انتظر 5 دقائق (DNS propagation)"
echo "================================"
