# 🚨 حل سريع: السكريبر لا يعمل على السيرفر

## المشكلة
السكريبر يعمل على المحلي ✅ لكن لا يعمل على السيرفر ❌

---

## ✅ الحل السريع (5 دقائق)

### 1️⃣ على السيرفر، شغل هذا الأمر للفحص:
```bash
npm run check:server
```

هذا الأمر سيفحص:
- ✅ Environment Variables
- ✅ الاتصال بالإنترنت
- ✅ ScraperAPI
- ✅ MongoDB
- ✅ الوصول للمواقع

---

### 2️⃣ إذا كان SCRAPERAPI_KEY مفقود:

**على السيرفر، أضف المتغيرات**:

#### إذا كنت تستخدم PM2:
```bash
# أنشئ ملف ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'yemen-delivery',
    script: './server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      SCRAPERAPI_KEY: 'ccd1fedfdc9165e69d0107b15f455040',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/yemen-delivery',
      JWT_SECRET: 'your-super-secret-key-change-this-12345'
    }
  }]
}
EOF

# أعد تشغيل التطبيق
pm2 restart yemen-delivery
pm2 logs yemen-delivery
```

#### إذا كنت تستخدم systemd:
```bash
# عدّل ملف الخدمة
sudo nano /etc/systemd/system/yemen-delivery.service

# أضف هذه الأسطر في قسم [Service]:
Environment="SCRAPERAPI_KEY=ccd1fedfdc9165e69d0107b15f455040"
Environment="NODE_ENV=production"
Environment="MONGODB_URI=mongodb://127.0.0.1:27017/yemen-delivery"
Environment="JWT_SECRET=your-super-secret-key-change-this-12345"

# أعد تحميل وتشغيل
sudo systemctl daemon-reload
sudo systemctl restart yemen-delivery
sudo journalctl -u yemen-delivery -f
```

#### إذا كنت تستخدم Docker:
```bash
# عدّل docker-compose.yml
nano docker-compose.yml

# أضف environment variables:
environment:
  - SCRAPERAPI_KEY=ccd1fedfdc9165e69d0107b15f455040
  - NODE_ENV=production
  - MONGODB_URI=mongodb://mongo:27017/yemen-delivery
  - JWT_SECRET=your-super-secret-key-change-this-12345

# أعد بناء وتشغيل
docker-compose down
docker-compose up -d
docker-compose logs -f
```

#### أو ببساطة، أنشئ ملف .env على السيرفر:
```bash
# على السيرفر
cd /path/to/your/app
nano .env

# أضف هذه الأسطر:
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/yemen-delivery
JWT_SECRET=your-super-secret-key-change-this-12345
SCRAPERAPI_KEY=ccd1fedfdc9165e69d0107b15f455040

# احفظ واخرج (Ctrl+X, Y, Enter)

# أعد تشغيل التطبيق
pm2 restart yemen-delivery
# أو
sudo systemctl restart yemen-delivery
```

---

### 3️⃣ تحقق من أن ScraperAPI يعمل:
```bash
# على السيرفر
curl "http://api.scraperapi.com?api_key=ccd1fedfdc9165e69d0107b15f455040&url=https://httpbin.org/json"
```

إذا رجع JSON، معناها ScraperAPI يعمل ✅

---

### 4️⃣ إذا كان MongoDB لا يعمل:

#### إذا كنت تستخدم MongoDB Atlas:
```bash
# أضف IP السيرفر في Whitelist:
# 1. اذهب إلى https://cloud.mongodb.com/
# 2. Network Access → Add IP Address
# 3. أضف IP السيرفر أو 0.0.0.0/0 (للاختبار)
```

#### إذا كنت تستخدم MongoDB محلي:
```bash
# تأكد من تشغيل MongoDB
sudo systemctl status mongod

# إذا لم يكن يعمل
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

### 5️⃣ اختبر السكريبر:
```bash
# على السيرفر، جرب جلب منتج
curl -X POST http://localhost:5000/api/products/scrape \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url":"https://www.amazon.sa/dp/B08N5WRWNW"}'
```

---

## 🎯 الخلاصة

**المشكلة الأساسية**: SCRAPERAPI_KEY مفقود على السيرفر

**الحل**:
1. أضف SCRAPERAPI_KEY في environment variables
2. أعد تشغيل التطبيق
3. شغل `npm run check:server` للتأكد

---

## 📞 إذا استمرت المشكلة

**شارك نتيجة هذا الأمر**:
```bash
npm run check:server
```

**أو شارك logs**:
```bash
# إذا كنت تستخدم PM2
pm2 logs yemen-delivery --lines 50

# إذا كنت تستخدم systemd
sudo journalctl -u yemen-delivery -n 50
```

---

## 📚 للمزيد من التفاصيل

راجع ملف `SERVER_DEPLOYMENT_FIXES.md` للحلول المتقدمة.
