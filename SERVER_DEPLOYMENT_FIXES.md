# 🚀 حل مشاكل السكريبر على السيرفر الحقيقي

## المشكلة
السكريبر يعمل على المحلي (localhost) لكن لا يعمل على السيرفر الحقيقي.

---

## ✅ الحلول السريعة

### 1. تأكد من وجود SCRAPERAPI_KEY في السيرفر

**المشكلة**: ملف `.env` موجود محلياً لكن غير موجود على السيرفر

**الحل**:
```bash
# على السيرفر، أضف المتغيرات في environment variables
export SCRAPERAPI_KEY=ccd1fedfdc9165e69d0107b15f455040
export NODE_ENV=production
export MONGODB_URI=your-mongodb-uri
export JWT_SECRET=your-jwt-secret
```

**أو إذا كنت تستخدم PM2**:
```bash
# في ملف ecosystem.config.js
module.exports = {
  apps: [{
    name: 'yemen-delivery',
    script: './server/index.js',
    env: {
      NODE_ENV: 'production',
      SCRAPERAPI_KEY: 'ccd1fedfdc9165e69d0107b15f455040',
      MONGODB_URI: 'your-mongodb-uri',
      JWT_SECRET: 'your-jwt-secret'
    }
  }]
}
```

**أو إذا كنت تستخدم Docker**:
```dockerfile
# في Dockerfile أو docker-compose.yml
ENV SCRAPERAPI_KEY=ccd1fedfdc9165e69d0107b15f455040
ENV NODE_ENV=production
```

---

### 2. تحقق من أن ScraperAPI يعمل

**اختبار سريع على السيرفر**:
```bash
# على السيرفر، جرب هذا الأمر
curl "http://api.scraperapi.com?api_key=ccd1fedfdc9165e69d0107b15f455040&url=https://httpbin.org/json"
```

إذا نجح، معناها ScraperAPI يعمل ✅

---

### 3. تحقق من Firewall والـ Network

**المشكلة**: السيرفر قد يحظر الاتصالات الخارجية

**الحل**:
```bash
# تأكد من أن السيرفر يسمح بالاتصالات الخارجية
# على Linux/Ubuntu
sudo ufw allow out 80/tcp
sudo ufw allow out 443/tcp

# أو تعطيل firewall مؤقتاً للاختبار
sudo ufw disable
```

---

### 4. استخدم ScraperAPI دائماً على السيرفر

**المشكلة**: Direct requests تفشل على السيرفرات بسبب IP blocking

**الحل**: تأكد من أن ScraperAPI مفعّل دائماً:

```javascript
// في server/index.js أو في بداية التطبيق
console.log('🔑 ScraperAPI Key:', process.env.SCRAPERAPI_KEY ? 'Found ✅' : 'Missing ❌');
console.log('🌍 Environment:', process.env.NODE_ENV);
```

---

### 5. زيادة Timeout على السيرفر

**المشكلة**: السيرفرات قد تكون أبطأ من المحلي

**الحل**: تم تحديث الكود ليستخدم timeout أطول (30 ثانية)

---

### 6. تحقق من Logs على السيرفر

**كيف تشوف الأخطاء**:
```bash
# إذا كنت تستخدم PM2
pm2 logs yemen-delivery

# إذا كنت تستخدم systemd
journalctl -u yemen-delivery -f

# أو ببساطة
tail -f /var/log/yemen-delivery.log
```

**ابحث عن هذه الرسائل**:
- `⚠️ SCRAPERAPI_KEY not found` → المفتاح مفقود
- `⚠️ ScraperAPI failed` → مشكلة في ScraperAPI
- `⚠️ Direct request failed` → المواقع تحظر السيرفر

---

## 🔧 حلول متقدمة

### إذا كان ScraperAPI لا يعمل

**1. تحقق من الرصيد**:
- اذهب إلى https://dashboard.scraperapi.com/
- تأكد من وجود رصيد كافٍ

**2. تحقق من API Key**:
- انسخ المفتاح من Dashboard
- تأكد من عدم وجود مسافات أو أحرف إضافية

**3. جرب Premium Proxies**:
```javascript
// في universalScraper.js
scraperParams.premium = true; // للمواقع المحمية
```

---

### إذا كانت المشكلة في MongoDB

**المشكلة**: السيرفر لا يستطيع الاتصال بـ MongoDB

**الحل**:
```bash
# تحقق من MONGODB_URI
echo $MONGODB_URI

# إذا كنت تستخدم MongoDB Atlas
# تأكد من إضافة IP السيرفر في Whitelist:
# 1. اذهب إلى MongoDB Atlas Dashboard
# 2. Network Access → Add IP Address
# 3. أضف IP السيرفر أو استخدم 0.0.0.0/0 (للاختبار فقط)
```

---

### إذا كانت المشكلة في CORS

**المشكلة**: Frontend لا يستطيع الاتصال بـ Backend

**الحل**:
```javascript
// في server/index.js
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:5173'],
  credentials: true
}));
```

---

## 📊 اختبار شامل على السيرفر

**1. اختبر Environment Variables**:
```bash
node -e "console.log('SCRAPERAPI_KEY:', process.env.SCRAPERAPI_KEY)"
```

**2. اختبر ScraperAPI**:
```bash
curl "http://api.scraperapi.com?api_key=YOUR_KEY&url=https://httpbin.org/json"
```

**3. اختبر MongoDB**:
```bash
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB OK')).catch(e => console.log('MongoDB Error:', e.message))"
```

**4. اختبر السكريبر**:
```bash
# على السيرفر، جرب endpoint السكريبر
curl -X POST http://localhost:5000/api/products/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.amazon.sa/dp/B08N5WRWNW"}'
```

---

## 🎯 الخلاصة

**الأسباب الشائعة**:
1. ❌ SCRAPERAPI_KEY مفقود على السيرفر
2. ❌ Firewall يحظر الاتصالات
3. ❌ IP السيرفر محظور من المواقع
4. ❌ MongoDB URI خاطئ
5. ❌ Timeout قصير جداً

**الحل الأسرع**:
1. ✅ تأكد من SCRAPERAPI_KEY موجود
2. ✅ استخدم ScraperAPI دائماً (لا تعتمد على direct requests)
3. ✅ زيادة timeout إلى 30 ثانية
4. ✅ تحقق من logs للأخطاء

---

## 📞 إذا استمرت المشكلة

**شارك هذه المعلومات**:
```bash
# على السيرفر، شغل هذا الأمر
echo "=== Environment ==="
echo "NODE_ENV: $NODE_ENV"
echo "SCRAPERAPI_KEY: ${SCRAPERAPI_KEY:0:10}..." # أول 10 أحرف فقط
echo ""
echo "=== Network Test ==="
curl -I https://www.amazon.sa
echo ""
echo "=== ScraperAPI Test ==="
curl "http://api.scraperapi.com?api_key=$SCRAPERAPI_KEY&url=https://httpbin.org/json" | head -20
```

وأرسل النتيجة للمساعدة في حل المشكلة.
