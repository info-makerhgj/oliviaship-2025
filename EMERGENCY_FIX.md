# 🚨 حل مشكلة التثبيت - خطوة بخطوة

## 🔴 المشكلة:
```
Error: Cannot find package 'cors'
code: 'ERR_MODULE_NOT_FOUND'
```

**السبب:** المساحة خلصت أثناء تثبيت `node_modules`

---

## ✅ الحل السريع (5 دقائق):

### الطريقة 1: تنظيف وإعادة التثبيت

```bash
# 1. SSH إلى السيرفر
ssh -i your-key.pem ubuntu@YOUR_IP

# 2. إيقاف التطبيق
pm2 stop all
pm2 delete all

# 3. الذهاب للمشروع
cd ~/oliviaship-2025

# 4. حذف node_modules القديمة
rm -rf node_modules
rm -rf package-lock.json

# 5. تنظيف npm cache
npm cache clean --force

# 6. تنظيف المساحة
sudo apt clean
sudo apt autoremove -y
sudo journalctl --vacuum-time=3d

# 7. فحص المساحة
df -h /
# يجب أن يكون عندك على الأقل 2GB متاحة

# 8. تثبيت dependencies (بدون dev)
npm install --production --no-optional

# 9. تشغيل التطبيق
pm2 start server/index.js --name oliviaship
pm2 save

# 10. التحقق
pm2 logs oliviaship
```

---

## 🔧 الطريقة 2: استخدام السكريبت الجاهز

```bash
# 1. SSH إلى السيرفر
ssh -i your-key.pem ubuntu@YOUR_IP

# 2. تحميل السكريبت
cd ~/oliviaship-2025
# (انسخ محتوى fix-installation.sh)

# 3. تشغيل السكريبت
chmod +x fix-installation.sh
./fix-installation.sh
```

---

## 🚨 إذا لم ينجح (المساحة غير كافية):

### الحل النهائي: ترقية الخطة

```bash
# المساحة الحالية: 20GB (ممتلئة)
# الحل: ترقية إلى $5/شهر (40GB)
```

### خطوات الترقية السريعة:

#### 1️⃣ أخذ Snapshot (نسخة احتياطية)
```bash
1. اذهب إلى: https://lightsail.aws.amazon.com/
2. اختر instance: oliviaship-backend
3. اضغط "Snapshots" tab
4. اضغط "Create snapshot"
5. الاسم: "before-upgrade"
6. انتظر 5 دقائق
```

#### 2️⃣ ترقية الخطة
```bash
1. ارجع لصفحة Instance
2. اضغط النقاط الثلاث (⋮)
3. اختر "Change plan"
4. اختر: $5/month (1GB RAM, 40GB SSD)
5. اضغط "Change plan"
6. انتظر 5-10 دقائق
```

#### 3️⃣ إعادة التثبيت
```bash
# SSH إلى السيرفر:
ssh -i your-key.pem ubuntu@YOUR_IP

# تحقق من المساحة الجديدة:
df -h /
# يجب أن تشوف 40GB

# إعادة التثبيت:
cd ~/oliviaship-2025
rm -rf node_modules
npm install --production

# تشغيل:
pm2 start server/index.js --name oliviaship
pm2 save
pm2 logs
```

---

## 📊 فحص المساحة:

```bash
# المساحة الكلية:
df -h /

# أكبر المجلدات:
du -h --max-depth=1 ~ | sort -hr

# حجم node_modules:
du -sh ~/oliviaship-2025/node_modules

# حجم logs:
du -sh /var/log
```

---

## 🧹 تنظيف المساحة (إذا كانت ممتلئة):

```bash
# 1. حذف logs القديمة:
sudo journalctl --vacuum-time=3d
pm2 flush

# 2. حذف apt cache:
sudo apt clean
sudo apt autoremove -y

# 3. حذف npm cache:
npm cache clean --force

# 4. حذف ملفات مؤقتة:
sudo rm -rf /tmp/*

# 5. حذف snapshots قديمة (إن وجدت):
# في AWS Console → Snapshots → Delete old ones

# 6. فحص المساحة:
df -h /
```

---

## ⚠️ نصائح مهمة:

### لتجنب المشكلة مستقبلاً:

1. **استخدم `--production`:**
   ```bash
   npm install --production
   # هذا يثبت فقط dependencies الضرورية
   ```

2. **نظف بشكل دوري:**
   ```bash
   # كل أسبوع:
   npm cache clean --force
   sudo journalctl --vacuum-time=7d
   ```

3. **راقب المساحة:**
   ```bash
   # أضف cron job:
   echo "0 0 * * * df -h / | mail -s 'Disk Space' your@email.com" | crontab -
   ```

4. **رقي الخطة:**
   - إذا كان المشروع يكبر، رقي إلى $5 أو $10

---

## 🎯 الخلاصة:

### المشكلة:
- `node_modules` غير مثبتة بشكل كامل
- المساحة خلصت أثناء التثبيت

### الحل السريع:
1. نظف المساحة
2. احذف `node_modules`
3. أعد التثبيت بـ `--production`

### الحل النهائي:
- رقي الخطة إلى $5/شهر (40GB)

---

## 🚀 الأوامر السريعة (نسخ ولصق):

```bash
# إيقاف التطبيق
pm2 stop all && pm2 delete all

# تنظيف
cd ~/oliviaship-2025
rm -rf node_modules package-lock.json
npm cache clean --force
sudo apt clean && sudo apt autoremove -y

# إعادة التثبيت
npm install --production --no-optional

# تشغيل
pm2 start server/index.js --name oliviaship
pm2 save
pm2 logs
```

---

## 📞 إذا لم ينجح:

قل لي:
1. **"المساحة كم؟"** - نفحص المساحة المتاحة
2. **"رقي الخطة"** - نرقي إلى 40GB
3. **"ما اشتغل"** - نجرب حل آخر

**أنا جاهز! 🔥**
