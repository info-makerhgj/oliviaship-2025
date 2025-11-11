# 📱 دليل سريع للمطور - Olivia Ship API

## 🚀 البدء السريع

### 1. معلومات الاتصال

**Base URL (للتطوير):**
```
http://localhost:5000/api
```

**Base URL (للإنتاج):**
```
https://your-domain.com/api
```

---

## 🔑 المصادقة (Authentication)

### خطوات التسجيل وتسجيل الدخول:

1. **التسجيل:**
```bash
POST /api/auth/register
Body: {
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "password": "password123",
  "phone": "777123456",
  "address": "صنعاء، اليمن"
}
```

2. **تسجيل الدخول:**
```bash
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

3. **احفظ الـ Token:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

4. **استخدم الـ Token في كل طلب:**
```
Authorization: Bearer {token}
```

---

## 📦 الوظائف الأساسية

### 1. جلب منتج من رابط
```bash
POST /api/products/fetch-from-url
Headers: Authorization: Bearer {token}
Body: {
  "url": "https://www.amazon.sa/dp/B08N5WRWNW"
}
```

### 2. إضافة منتج للسلة
```bash
POST /api/cart/fetch-and-add
Headers: Authorization: Bearer {token}
Body: {
  "url": "https://www.amazon.sa/dp/B08N5WRWNW",
  "quantity": 1
}
```

### 3. عرض السلة
```bash
GET /api/cart
Headers: Authorization: Bearer {token}
```

### 4. إتمام الطلب
```bash
POST /api/cart/checkout
Headers: Authorization: Bearer {token}
Body: {
  "shippingAddress": {
    "fullName": "اسم المستلم",
    "phone": "777123456",
    "city": "صنعاء",
    "address": "العنوان التفصيلي"
  },
  "paymentMethod": "stripe"
}
```

### 5. عرض الطلبات
```bash
GET /api/orders
Headers: Authorization: Bearer {token}
```

### 6. تتبع الطلب
```bash
GET /api/orders/track/{orderNumber}
```

---

## 🛍️ المتاجر المدعومة

- ✅ Amazon (amazon.sa, amazon.ae, amazon.com)
- ✅ Noon (noon.com)
- ✅ AliExpress (aliexpress.com)
- ✅ Shein (shein.com)
- ✅ Temu (temu.com)

---

## 💳 طرق الدفع

1. **Stripe** (بطاقات الائتمان)
2. **Cash Pay** (معطل حالياً)
3. **الدفع عند الاستلام** (معطل حالياً)

---

## 📍 نقاط البيع

### الحصول على أقرب نقطة بيع:
```bash
GET /api/pos/nearest?lat=15.3694&lng=44.1910&radius=10
```

### الحصول على جميع نقاط البيع:
```bash
GET /api/pos/public
```

---

## 💰 المحفظة

### عرض الرصيد:
```bash
GET /api/wallet
Headers: Authorization: Bearer {token}
```

### شحن المحفظة بكود:
```bash
POST /api/wallet/redeem-code
Headers: Authorization: Bearer {token}
Body: {
  "code": "WALLET-CODE-123"
}
```

---

## 🎟️ الكوبونات

### التحقق من كوبون:
```bash
POST /api/coupons/validate
Body: {
  "code": "DISCOUNT10"
}
```

---

## 📱 أمثلة للتطبيق

### مثال React Native:

```javascript
// تسجيل الدخول
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // احفظ الـ Token
      await AsyncStorage.setItem('token', data.token);
      return data.user;
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};

// جلب السلة
const getCart = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    return data.cart;
  } catch (error) {
    console.error('Get cart error:', error);
  }
};

// إضافة منتج للسلة
const addToCart = async (url, quantity = 1) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/cart/fetch-and-add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, quantity }),
    });
    
    const data = await response.json();
    return data.cart;
  } catch (error) {
    console.error('Add to cart error:', error);
  }
};
```

---

## 🧪 اختبار الـ API

### استخدام Postman:
1. استورد ملف `Olivia_Ship_API.postman_collection.json`
2. غير الـ `baseUrl` إلى عنوان السيرفر
3. سجل دخول واحصل على Token
4. ضع الـ Token في متغير `token`
5. جرب جميع الـ endpoints

### استخدام cURL:
```bash
# تسجيل الدخول
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# جلب السلة
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚠️ ملاحظات مهمة

1. **جميع الـ responses بصيغة JSON**
2. **التواريخ بصيغة ISO 8601**
3. **الأسعار بالريال السعودي (SAR)**
4. **اللغة الافتراضية: العربية**
5. **يدعم RTL (من اليمين لليسار)**
6. **الـ Token صالح لمدة 30 يوم**

---

## 🔒 الأمان

- استخدم HTTPS في الإنتاج
- لا تشارك الـ Token
- احفظ الـ Token بشكل آمن (AsyncStorage, SecureStore)
- لا تحفظ كلمات المرور في التطبيق

---

## 📞 الدعم الفني

للمزيد من المعلومات، راجع:
- `API_DOCUMENTATION.md` - التوثيق الكامل
- `Olivia_Ship_API.postman_collection.json` - Postman Collection

---

## ✅ Checklist للمطور

- [ ] قرأت التوثيق الكامل
- [ ] جربت الـ API باستخدام Postman
- [ ] فهمت نظام المصادقة (Authentication)
- [ ] جربت إضافة منتج للسلة
- [ ] جربت إتمام طلب
- [ ] فهمت نظام الأخطاء
- [ ] جاهز للبدء في التطوير! 🚀

---

**آخر تحديث:** 9 يناير 2025
