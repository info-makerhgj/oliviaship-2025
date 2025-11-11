# 📱 API للعميل - تطبيق Olivia Ship

## 🎯 نظرة عامة

هذا التوثيق خاص بتطبيق الجوال للعملاء فقط.
لوحة التحكم (Admin, Agent, Point Manager) تبقى على الويب.

---

## 🌐 Base URL

### للتطوير على الجوال الحقيقي:
```
http://192.168.1.111:5000/api
```

### للتطوير على المحاكي (Emulator):
- **Android Emulator:** `http://10.0.2.2:5000/api`
- **iOS Simulator:** `http://localhost:5000/api`

### للإنتاج:
```
https://your-domain.com/api
```

**⚠️ مهم:** تأكد أن الجوال والكمبيوتر على نفس الشبكة (WiFi)!

---

## 📱 شاشات التطبيق المطلوبة

### 1. التسجيل وتسجيل الدخول
- شاشة التسجيل (Register)
- شاشة تسجيل الدخول (Login)
- شاشة الملف الشخصي (Profile)

### 2. الصفحة الرئيسية
- عرض المتاجر المدعومة
- بحث عن منتج بالرابط
- عرض العروض والكوبونات

### 3. السلة
- عرض المنتجات في السلة
- تعديل الكمية
- حذف منتج
- حساب التكلفة الإجمالية

### 4. الطلبات
- عرض جميع الطلبات
- تفاصيل الطلب
- تتبع الطلب

### 5. المحفظة
- عرض الرصيد
- شحن المحفظة بكود
- سجل المعاملات

### 6. نقاط البيع
- عرض أقرب نقطة بيع
- عرض جميع نقاط البيع
- تفاصيل نقطة البيع

### 7. الدعم
- الدردشة مع الدعم
- إرسال رسالة

---

## 🔐 1. التسجيل وتسجيل الدخول

### 1.1 التسجيل
**POST** `/auth/register`

**Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123",
  "phone": "777123456",
  "address": "صنعاء، شارع الزبيري"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "777123456",
    "role": "customer"
  }
}
```

---

### 1.2 تسجيل الدخول
**POST** `/auth/login`

**Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "customer"
  }
}
```

**⚠️ مهم:** احفظ الـ Token واستخدمه في جميع الطلبات التالية!

---

### 1.3 الحصول على بيانات المستخدم
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "777123456",
    "address": "صنعاء، شارع الزبيري",
    "role": "customer",
    "createdAt": "2025-01-09T10:00:00.000Z"
  }
}
```

---

### 1.4 تحديث الملف الشخصي
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "أحمد محمد علي",
  "phone": "777999888",
  "address": "صنعاء، حي السبعين"
}
```

---

### 1.5 تغيير كلمة المرور
**PUT** `/auth/change-password`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 🏠 2. الصفحة الرئيسية

### 2.1 الحصول على الإعدادات العامة
**GET** `/settings`

**Response:**
```json
{
  "success": true,
  "settings": {
    "general": {
      "siteName": "Olivia Ship",
      "contactEmail": "info@oliviaship.com",
      "contactPhone": "776999080"
    },
    "stores": {
      "amazon": { "enabled": true },
      "noon": { "enabled": true },
      "aliexpress": { "enabled": true },
      "shein": { "enabled": false },
      "temu": { "enabled": false }
    }
  }
}
```

---

### 2.2 جلب منتج من رابط
**POST** `/products/fetch-from-url`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "url": "https://www.amazon.sa/dp/B08N5WRWNW"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "title": "سماعات أبل AirPods Pro",
    "price": 899.00,
    "currency": "SAR",
    "image": "https://m.media-amazon.com/images/I/...",
    "description": "سماعات لاسلكية مع إلغاء الضوضاء",
    "store": "amazon",
    "url": "https://www.amazon.sa/dp/B08N5WRWNW"
  }
}
```

---

### 2.3 حساب تكلفة المنتج
**POST** `/products/calculate-cost`

**Body:**
```json
{
  "price": 899.00,
  "currency": "SAR",
  "weight": 0.5,
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "cost": {
    "productPrice": 899.00,
    "shippingCost": 50.00,
    "commission": 134.85,
    "customs": 44.95,
    "total": 1128.80
  }
}
```

---

## 🛒 3. السلة

### 3.1 عرض السلة
**GET** `/cart`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "_id": "item_id_1",
        "title": "سماعات أبل AirPods Pro",
        "price": 899.00,
        "quantity": 1,
        "image": "https://...",
        "url": "https://www.amazon.sa/dp/B08N5WRWNW",
        "options": {
          "color": "أبيض"
        }
      }
    ],
    "totalItems": 1,
    "subtotal": 899.00,
    "shippingCost": 50.00,
    "commission": 134.85,
    "customs": 44.95,
    "discount": 0,
    "totalPrice": 1128.80
  }
}
```

---

### 3.2 إضافة منتج للسلة
**POST** `/cart/fetch-and-add`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "url": "https://www.amazon.sa/dp/B08N5WRWNW",
  "quantity": 1,
  "options": {
    "color": "أبيض",
    "size": "عادي"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إضافة المنتج إلى السلة بنجاح",
  "cart": { /* نفس بيانات السلة */ }
}
```

---

### 3.3 تحديث كمية المنتج
**PUT** `/cart/items/{itemId}/quantity`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "quantity": 2
}
```

---

### 3.4 حذف منتج من السلة
**DELETE** `/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {token}
```

---

### 3.5 مسح السلة بالكامل
**DELETE** `/cart/clear`

**Headers:**
```
Authorization: Bearer {token}
```

---

### 3.6 إتمام الطلب (Checkout)
**POST** `/cart/checkout`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "shippingAddress": {
    "fullName": "أحمد محمد علي",
    "phone": "777123456",
    "city": "صنعاء",
    "address": "شارع الزبيري، بجوار مستشفى الثورة"
  },
  "paymentMethod": "stripe",
  "couponCode": "DISCOUNT10",
  "notes": "يرجى التوصيل في المساء"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "orderNumber": "ORD-2025-001",
    "status": "pending",
    "totalAmount": 1128.80,
    "paymentStatus": "pending"
  },
  "paymentUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**ملاحظة:** إذا كان `paymentMethod` هو `stripe`, سيتم إرجاع `paymentUrl` لفتحه في المتصفح.

---

## 📦 4. الطلبات

### 4.1 عرض جميع الطلبات
**GET** `/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): رقم الصفحة (default: 1)
- `limit` (optional): عدد النتائج (default: 10)
- `status` (optional): حالة الطلب (pending, processing, shipped, delivered, cancelled)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-2025-001",
      "status": "processing",
      "totalAmount": 1128.80,
      "itemsCount": 1,
      "createdAt": "2025-01-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalOrders": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 4.2 تفاصيل الطلب
**GET** `/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "orderNumber": "ORD-2025-001",
    "status": "processing",
    "items": [
      {
        "title": "سماعات أبل AirPods Pro",
        "price": 899.00,
        "quantity": 1,
        "image": "https://...",
        "url": "https://www.amazon.sa/dp/B08N5WRWNW"
      }
    ],
    "shippingAddress": {
      "fullName": "أحمد محمد علي",
      "phone": "777123456",
      "city": "صنعاء",
      "address": "شارع الزبيري، بجوار مستشفى الثورة"
    },
    "subtotal": 899.00,
    "shippingCost": 50.00,
    "commission": 134.85,
    "customs": 44.95,
    "discount": 0,
    "totalAmount": 1128.80,
    "paymentMethod": "stripe",
    "paymentStatus": "paid",
    "notes": "يرجى التوصيل في المساء",
    "createdAt": "2025-01-09T10:00:00.000Z"
  }
}
```

---

### 4.3 تتبع الطلب
**GET** `/orders/track/{orderNumber}`

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-2025-001",
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2025-01-15",
    "currentLocation": "مركز التوزيع - صنعاء",
    "timeline": [
      {
        "status": "pending",
        "date": "2025-01-09T10:00:00.000Z",
        "description": "تم استلام الطلب"
      },
      {
        "status": "processing",
        "date": "2025-01-10T14:00:00.000Z",
        "description": "جاري معالجة الطلب"
      },
      {
        "status": "shipped",
        "date": "2025-01-11T09:00:00.000Z",
        "description": "تم شحن الطلب"
      }
    ]
  }
}
```

---

## 💰 5. المحفظة

### 5.1 عرض رصيد المحفظة
**GET** `/wallet`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "balance": 500.00,
    "currency": "SAR"
  }
}
```

---

### 5.2 سجل المعاملات
**GET** `/wallet/transactions`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): رقم الصفحة
- `limit` (optional): عدد النتائج

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "transaction_id",
      "type": "credit",
      "amount": 100.00,
      "description": "شحن المحفظة بكود",
      "balanceAfter": 600.00,
      "date": "2025-01-09T10:00:00.000Z"
    },
    {
      "_id": "transaction_id_2",
      "type": "debit",
      "amount": 50.00,
      "description": "دفع طلب ORD-2025-001",
      "balanceAfter": 550.00,
      "date": "2025-01-08T15:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalTransactions": 15
  }
}
```

---

### 5.3 شحن المحفظة بكود
**POST** `/wallet/redeem-code`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "code": "WALLET-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم شحن المحفظة بنجاح",
  "amount": 100.00,
  "newBalance": 600.00
}
```

---

## 📍 6. نقاط البيع

### 6.1 الحصول على أقرب نقطة بيع
**GET** `/pos/nearest`

**Query Parameters:**
- `lat`: خط العرض (مثال: 15.3694)
- `lng`: خط الطول (مثال: 44.1910)
- `radius`: نطاق البحث بالكيلومتر (default: 10)

**Response:**
```json
{
  "success": true,
  "points": [
    {
      "_id": "point_id",
      "name": "نقطة البيع - صنعاء المركزية",
      "address": "شارع الزبيري، بجوار مستشفى الثورة",
      "phone": "777123456",
      "city": "صنعاء",
      "location": {
        "lat": 15.3694,
        "lng": 44.1910
      },
      "distance": 2.5,
      "workingHours": "9:00 صباحاً - 9:00 مساءً",
      "status": "active"
    }
  ]
}
```

---

### 6.2 عرض جميع نقاط البيع
**GET** `/pos/public`

**Query Parameters:**
- `city` (optional): تصفية حسب المدينة

**Response:**
```json
{
  "success": true,
  "points": [
    {
      "_id": "point_id",
      "name": "نقطة البيع - صنعاء المركزية",
      "address": "شارع الزبيري، بجوار مستشفى الثورة",
      "phone": "777123456",
      "city": "صنعاء",
      "workingHours": "9:00 صباحاً - 9:00 مساءً",
      "status": "active"
    }
  ]
}
```

---

## 🎟️ 7. الكوبونات

### 7.1 عرض الكوبونات النشطة
**GET** `/coupons/active`

**Response:**
```json
{
  "success": true,
  "coupons": [
    {
      "_id": "coupon_id",
      "code": "DISCOUNT10",
      "type": "percentage",
      "value": 10,
      "description": "خصم 10% على جميع المنتجات",
      "minOrderAmount": 100,
      "maxDiscount": 50,
      "expiryDate": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### 7.2 التحقق من كوبون
**POST** `/coupons/validate`

**Body:**
```json
{
  "code": "DISCOUNT10"
}
```

**Response:**
```json
{
  "success": true,
  "coupon": {
    "code": "DISCOUNT10",
    "type": "percentage",
    "value": 10,
    "valid": true,
    "message": "الكوبون صالح للاستخدام"
  }
}
```

---

## 💬 8. الدعم (الدردشة)

### 8.1 الحصول على محادثتي
**GET** `/chat/my-chat`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "_id": "chat_id",
    "messages": [
      {
        "_id": "msg_id_1",
        "sender": "customer",
        "senderName": "أحمد محمد",
        "message": "مرحباً، أحتاج مساعدة في طلبي",
        "timestamp": "2025-01-09T10:00:00.000Z",
        "read": true
      },
      {
        "_id": "msg_id_2",
        "sender": "admin",
        "senderName": "فريق الدعم",
        "message": "أهلاً بك، كيف يمكنني مساعدتك؟",
        "timestamp": "2025-01-09T10:01:00.000Z",
        "read": true
      }
    ],
    "status": "open",
    "unreadCount": 0
  }
}
```

---

### 8.2 إرسال رسالة
**POST** `/chat/send`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "chatId": "chat_id",
  "message": "طلبي رقم ORD-2025-001 لم يصل بعد"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح"
}
```

---

## 📞 9. التواصل

### 9.1 إرسال رسالة تواصل
**POST** `/contact`

**Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "777123456",
  "subject": "استفسار عن الشحن",
  "message": "أريد معرفة تكلفة الشحن إلى عدن"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً"
}
```

---

## ⚠️ معالجة الأخطاء

جميع الأخطاء تُرجع بالصيغة التالية:

```json
{
  "success": false,
  "message": "رسالة الخطأ بالعربية"
}
```

### HTTP Status Codes:
- `200` - نجاح
- `201` - تم الإنشاء بنجاح
- `400` - خطأ في البيانات المرسلة
- `401` - غير مصرح (يحتاج تسجيل دخول)
- `403` - ممنوع (لا يملك الصلاحيات)
- `404` - غير موجود
- `500` - خطأ في السيرفر

---

## 🔒 الأمان

1. **احفظ الـ Token بشكل آمن:**
   - استخدم AsyncStorage أو SecureStore
   - لا تشارك الـ Token مع أي شخص

2. **استخدم HTTPS في الإنتاج**

3. **لا تحفظ كلمات المرور في التطبيق**

4. **تحقق من صلاحية الـ Token:**
   - الـ Token صالح لمدة 30 يوم
   - إذا انتهت صلاحيته، اطلب من المستخدم تسجيل الدخول مرة أخرى

---

## 📱 مثال كود React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// للجوال الحقيقي (تأكد أن الجوال والكمبيوتر على نفس الشبكة)
const API_URL = 'http://192.168.1.111:5000/api';

// للمحاكي Android
// const API_URL = 'http://10.0.2.2:5000/api';

// للمحاكي iOS
// const API_URL = 'http://localhost:5000/api';

// تسجيل الدخول
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    throw error;
  }
};

// جلب السلة
export const getCart = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.cart;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    throw error;
  }
};

// إضافة منتج للسلة
export const addToCart = async (url, quantity = 1, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/cart/fetch-and-add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, quantity, options }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.cart;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    throw error;
  }
};
```

---

## ✅ Checklist للمطور

- [ ] فهمت نظام المصادقة (Login/Register)
- [ ] جربت جلب منتج من رابط
- [ ] جربت إضافة منتج للسلة
- [ ] جربت عرض السلة
- [ ] جربت إتمام طلب
- [ ] جربت عرض الطلبات
- [ ] جربت تتبع طلب
- [ ] جربت المحفظة
- [ ] جربت نقاط البيع
- [ ] جربت الدردشة
- [ ] جاهز للبدء! 🚀

---

**آخر تحديث:** 9 يناير 2025
