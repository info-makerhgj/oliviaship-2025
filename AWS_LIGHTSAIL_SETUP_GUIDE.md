# 🚀 دليل نقل المشروع إلى AWS Lightsail (Bahrain)

## 🎯 لماذا AWS Lightsail Bahrain؟

### المميزات:
- ✅ **الأقرب لليمن** (Bahrain - البحرين)
- ✅ **سريع جداً** (50-200ms من اليمن)
- ✅ **رخيص** ($3.50/شهر فقط)
- ✅ **Always-on** (لا ينام أبداً)
- ✅ **نفس الكود** (Node.js + MongoDB)
- ✅ **Full control** (تحكم كامل)

### المقارنة:
| المنصة | المنطقة | السرعة من اليمن | السعر |
|--------|---------|-----------------|-------|
| **AWS Lightsail** | **Bahrain** | **50-200ms** ⚡⚡⚡⚡⚡ | **$3.50** |
| Railway | US/EU | 2000-5000ms | $5 |
| Render | Singapore | 500-1000ms | $7 |

---

## 📋 المتطلبات:

1. ✅ حساب AWS (مجاني للتسجيل)
2. ✅ بطاقة ائتمان (للتفعيل فقط، لن يُخصم إلا $3.50/شهر)
3. ✅ 30 دقيقة من وقتك

---

## 🔧 الخطوات التفصيلية:

### الخطوة 1: إنشاء حساب AWS

1. اذهب إلى: https://aws.amazon.com/
2. اضغط "Create an AWS Account"
3. املأ البيانات:
   - Email
   - Password
   - Account name
4. أدخل معلومات الدفع (بطاقة ائتمان)
   - لن يُخصم إلا $3.50/شهر
   - AWS Free Tier متاح لـ 12 شهر
5. تحقق من الهاتف
6. اختر "Basic Support Plan" (مجاني)

---

### الخطوة 2: إنشاء Lightsail Instance

1. بعد تسجيل الدخول، اذهب إلى:
   https://lightsail.aws.amazon.com/

2. اضغط "Create instance"

3. **اختر المنطقة:**
   - Instance location: **Bahrain (me-south-1)**
   - ⚠️ مهم جداً: اختر Bahrain للسرعة القصوى!

4. **اختر Platform:**
   - Select a platform: **Linux/Unix**

5. **اختر Blueprint:**
   - Select a blueprint: **Node.js**
   - أو اختر "OS Only" → Ubuntu 22.04 LTS

6. **اختر الخطة:**
   - $3.50/month:
     - 512 MB RAM
     - 1 vCPU
     - 20 GB SSD
     - 1 TB Transfer
   - ✅ كافي للمشروع

7. **اسم Instance:**
   - Name: `oliviaship-backend`

8. اضغط **"Create instance"**

9. انتظر 2-3 دقائق حتى يصبح "Running"

---

### الخطوة 3: إعداد الـ Instance

#### 3.1 الاتصال بالـ Instance

1. في Lightsail Dashboard، اضغط على Instance
2. اضغط "Connect using SSH"
3. ستفتح نافذة Terminal

#### 3.2 تحديث النظام

\`\`\`bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تحقق من النسخة
node --version  # يجب أن يكون v20.x
npm --version   # يجب أن يكون v10.x

# تثبيت PM2 (لإدارة التطبيق)
sudo npm install -g pm2

# تثبيت Git
sudo apt install -y git
\`\`\`

#### 3.3 رفع الكود

**الطريقة 1: من GitHub (موصى بها)**

\`\`\`bash
# Clone المشروع
cd /home/ubuntu
git clone https://github.com/info-makerhgj/oliviaship-2025.git
cd oliviaship-2025

# تثبيت Dependencies
npm install

# إنشاء ملف .env
nano .env
\`\`\`

**محتوى ملف .env:**
\`\`\`env
# MongoDB (استخدم MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oliviaship

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (Vercel)
FRONTEND_URL=https://oliviaship-2025-olivia-ships-projects.vercel.app

# Email (اختياري)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe (اختياري)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ

#### 3.4 تشغيل التطبيق

\`\`\`bash
# تشغيل بـ PM2
pm2 start server/index.js --name oliviaship

# حفظ التطبيق ليعمل تلقائياً عند إعادة التشغيل
pm2 save
pm2 startup

# تحقق من الحالة
pm2 status
pm2 logs oliviaship
\`\`\`

---

### الخطوة 4: إعداد Firewall

1. في Lightsail Dashboard
2. اذهب إلى "Networking" tab
3. في "Firewall" section، أضف:
   - Application: Custom
   - Protocol: TCP
   - Port: 5000
   - اضغط "Create"

---

### الخطوة 5: الحصول على IP Address

1. في Lightsail Dashboard
2. انسخ "Public IP" (مثال: 15.185.xxx.xxx)
3. جرب في المتصفح:
   \`\`\`
   http://15.185.xxx.xxx:5000/api/health
   \`\`\`
4. يجب أن ترى: \`{"status":"ok"}\`

---

### الخطوة 6: إعداد Domain (اختياري)

#### 6.1 إنشاء Static IP

1. في Lightsail Dashboard
2. اذهب إلى "Networking" tab
3. اضغط "Create static IP"
4. اختر Instance: oliviaship-backend
5. Name: oliviaship-ip
6. اضغط "Create"

#### 6.2 ربط Domain

إذا كان عندك domain (مثل: api.oliviaship.com):

1. في Lightsail، اذهب إلى "Domains & DNS"
2. اضغط "Create DNS zone"
3. أدخل domain الخاص بك
4. أضف A Record:
   - Subdomain: api
   - Resolves to: اختر Static IP
5. في مزود الـ Domain (Namecheap, GoDaddy, etc.)
   - أضف Nameservers من Lightsail

---

### الخطوة 7: إعداد SSL (HTTPS)

\`\`\`bash
# تثبيت Nginx
sudo apt install -y nginx

# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# إعداد Nginx
sudo nano /etc/nginx/sites-available/oliviaship
\`\`\`

**محتوى ملف Nginx:**
\`\`\`nginx
server {
    listen 80;
    server_name api.oliviaship.com;  # غير هذا لـ domain الخاص بك

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

\`\`\`bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/oliviaship /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# الحصول على SSL Certificate
sudo certbot --nginx -d api.oliviaship.com

# تجديد تلقائي
sudo certbot renew --dry-run
\`\`\`

---

### الخطوة 8: تحديث Frontend (Vercel)

في مشروع Frontend، حدث ملف `.env`:

\`\`\`env
# قبل
VITE_API_URL=https://oliviaship-production.up.railway.app/api

# بعد
VITE_API_URL=https://api.oliviaship.com/api
# أو إذا لم يكن عندك domain:
VITE_API_URL=http://15.185.xxx.xxx:5000/api
\`\`\`

ثم:
\`\`\`bash
git add .
git commit -m "Update API URL to AWS Lightsail"
git push origin main
\`\`\`

Vercel سينشر تلقائياً خلال دقيقتين.

---

## 🎯 MongoDB Atlas (Mumbai)

للسرعة القصوى، استخدم MongoDB Atlas في Mumbai (قريب من Bahrain):

1. اذهب إلى: https://www.mongodb.com/cloud/atlas
2. سجل حساب مجاني
3. Create Cluster:
   - Provider: AWS
   - Region: **Mumbai (ap-south-1)**
   - Tier: M0 (Free)
4. Create Database User
5. Whitelist IP: 0.0.0.0/0 (للسماح من أي مكان)
6. Get Connection String
7. ضعه في `.env` على Lightsail

---

## 📊 النتائج المتوقعة:

### قبل (Railway):
\`\`\`
API Response Time: 2000-5000ms ⏳
Location: US/EU (بعيد جداً)
Uptime: 99% (ينام أحياناً)
\`\`\`

### بعد (Lightsail Bahrain):
\`\`\`
API Response Time: 50-200ms ⚡⚡⚡⚡⚡
Location: Bahrain (قريب جداً من اليمن)
Uptime: 99.99% (Always-on)
\`\`\`

**التحسن: 95%!**

---

## 🔧 أوامر مفيدة:

\`\`\`bash
# عرض logs
pm2 logs oliviaship

# إعادة تشغيل
pm2 restart oliviaship

# إيقاف
pm2 stop oliviaship

# حالة التطبيق
pm2 status

# تحديث الكود
cd /home/ubuntu/oliviaship-2025
git pull
npm install
pm2 restart oliviaship

# مراقبة الموارد
pm2 monit
\`\`\`

---

## 💰 التكلفة:

\`\`\`
AWS Lightsail: $3.50/month
MongoDB Atlas: $0 (Free Tier)
Domain (اختياري): $10/year
SSL Certificate: $0 (Let's Encrypt مجاني)

المجموع: $3.50/month = $42/year
\`\`\`

---

## 🎊 الخلاصة:

بعد النقل إلى AWS Lightsail Bahrain:
- ✅ السرعة: من 5 ثواني إلى 0.2 ثانية (تحسن 96%)
- ✅ الموقع: قريب جداً من اليمن
- ✅ التكلفة: $3.50/شهر فقط
- ✅ Always-on: لا ينام أبداً
- ✅ Full control: تحكم كامل

**موقعك سيكون أسرع موقع في اليمن! 🚀**

---

## 📞 الدعم:

إذا واجهت أي مشكلة:
1. تحقق من logs: \`pm2 logs oliviaship\`
2. تحقق من Firewall: Port 5000 مفتوح؟
3. تحقق من MongoDB: الاتصال يعمل؟
4. تحقق من .env: كل المتغيرات صحيحة؟

---

## 🚀 جاهز للبدء؟

اتبع الخطوات أعلاه خطوة بخطوة، وسأكون معك في كل خطوة!
