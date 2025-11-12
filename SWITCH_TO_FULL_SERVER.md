# تغيير Render ليستخدم السيرفر الكامل

## المشكلة:
السيرفر الحالي (minimal-server.js) لا يحتوي على routes للـ authentication والـ features الأخرى.

## الحل:

### 1. افتح Render Dashboard
https://dashboard.render.com/

### 2. اذهب إلى مشروعك `oliviaship-2025`

### 3. اضغط على **Settings** (من القائمة اليسارية)

### 4. ابحث عن **Start Command**

### 5. غيّر من:
```
node server/minimal-server.js
```

إلى:
```
node server/index.js
```

### 6. اضغط **Save Changes**

### 7. اذهب إلى **Manual Deploy** (في الأعلى)

### 8. اضغط **Deploy latest commit**

### 9. انتظر 2-3 دقائق

### 10. جرب تسجيل الدخول مرة ثانية

---

## ملاحظة مهمة:

السيرفر الكامل (server/index.js) يحتاج MongoDB متصل.

تأكد من إضافة `MONGODB_URI` في Render Environment Variables:

```
MONGODB_URI=mongodb+srv://oliviaship_user:MRYLvr2TbAEQ9Cex@cluster0.08ndmt2.mongodb.net/oliviaship?retryWrites=true&w=majority&appName=Cluster0
```

إذا ما موجود، أضفه في:
Settings → Environment → Add Environment Variable
