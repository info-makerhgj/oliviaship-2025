# 📱 API Documentation - Olivia Ship

## 🌐 Base URL
```
http://localhost:5000/api
```
للإنتاج، استبدل `localhost:5000` بعنوان السيرفر الخاص بك.

---

## 🔐 Authentication

### Register
**POST** `/auth/register`

**Body:**
```json
{
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "password": "password123",
  "phone": "777123456",
  "address": "صنعاء، اليمن"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

---

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

---

### Get Current User
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
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "phone": "777123456",
    "address": "صنعاء، اليمن",
    "role": "customer"
  }
}
```

---

## 🛒 Products

### Fetch Product from URL
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
    "title": "اسم المنتج",
    "price": 299.99,
    "currency": "SAR",
    "image": "https://...",
    "description": "وصف المنتج",
    "store": "amazon"
  }
}
```

---

### Calculate Product Cost
**POST** `/products/calculate-cost`

**Body:**
```json
{
  "price": 299.99,
  "currency": "SAR",
  "weight": 1.5,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "cost": {
    "productPrice": 299.99,
    "shippingCost": 50,
    "commission": 44.99,
    "customs": 14.99,
    "total": 409.97
  }
}
```

---

## 🛍️ Cart

### Get Cart
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
        "_id": "item_id",
        "title": "اسم المنتج",
        "price": 299.99,
        "quantity": 2,
        "image": "https://...",
        "url": "https://..."
      }
    ],
    "totalItems": 2,
    "totalPrice": 599.98
  }
}
```

---

### Add to Cart (Fetch and Add)
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
    "color": "أسود",
    "size": "كبير"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إضافة المنتج إلى السلة",
  "cart": { /* cart object */ }
}
```

---

### Update Item Quantity
**PUT** `/cart/items/{itemId}/quantity`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "quantity": 3
}
```

---

### Remove Item from Cart
**DELETE** `/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {token}
```

---

### Clear Cart
**DELETE** `/cart/clear`

**Headers:**
```
Authorization: Bearer {token}
```

---

### Checkout
**POST** `/cart/checkout`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "shippingAddress": {
    "fullName": "اسم المستلم",
    "phone": "777123456",
    "city": "صنعاء",
    "address": "العنوان التفصيلي"
  },
  "paymentMethod": "stripe",
  "couponCode": "DISCOUNT10"
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
    "totalAmount": 599.98
  },
  "paymentUrl": "https://checkout.stripe.com/..."
}
```

---

## 📦 Orders

### Get All Orders
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
      "items": [ /* items */ ],
      "totalAmount": 599.98,
      "createdAt": "2025-01-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalOrders": 50
  }
}
```

---

### Get Single Order
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
        "title": "اسم المنتج",
        "price": 299.99,
        "quantity": 2,
        "image": "https://..."
      }
    ],
    "shippingAddress": {
      "fullName": "اسم المستلم",
      "phone": "777123456",
      "city": "صنعاء",
      "address": "العنوان التفصيلي"
    },
    "totalAmount": 599.98,
    "createdAt": "2025-01-09T10:00:00.000Z"
  }
}
```

---

### Track Order
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

## 💳 Payments

### Get Payment Methods
**GET** `/payments/methods`

**Response:**
```json
{
  "success": true,
  "methods": [
    {
      "id": "stripe",
      "name": "بطاقة ائتمان",
      "enabled": true
    },
    {
      "id": "cashpay",
      "name": "كاش باي",
      "enabled": false
    },
    {
      "id": "cod",
      "name": "الدفع عند الاستلام",
      "enabled": false
    }
  ]
}
```

---

### Verify Stripe Payment
**GET** `/stripe/verify-session/{sessionId}`

**Response:**
```json
{
  "success": true,
  "payment": {
    "status": "paid",
    "amount": 599.98,
    "orderId": "order_id"
  }
}
```

---

## 🎟️ Coupons

### Get Active Coupons
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
      "description": "خصم 10% على جميع المنتجات"
    }
  ]
}
```

---

### Validate Coupon
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
    "valid": true
  }
}
```

---

## 📍 Points of Sale

### Get Nearest Points
**GET** `/pos/nearest`

**Query Parameters:**
- `lat`: خط العرض
- `lng`: خط الطول
- `radius`: نطاق البحث بالكيلومتر (default: 10)

**Response:**
```json
{
  "success": true,
  "points": [
    {
      "_id": "point_id",
      "name": "نقطة البيع - صنعاء",
      "address": "شارع الزبيري، صنعاء",
      "phone": "777123456",
      "location": {
        "lat": 15.3694,
        "lng": 44.1910
      },
      "distance": 2.5,
      "workingHours": "9:00 AM - 9:00 PM"
    }
  ]
}
```

---

### Get Public Points
**GET** `/pos/public`

**Response:**
```json
{
  "success": true,
  "points": [
    {
      "_id": "point_id",
      "name": "نقطة البيع - صنعاء",
      "address": "شارع الزبيري، صنعاء",
      "phone": "777123456",
      "city": "صنعاء",
      "workingHours": "9:00 AM - 9:00 PM"
    }
  ]
}
```

---

## 💰 Wallet

### Get Wallet Balance
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

### Get Wallet Transactions
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
      "description": "شحن المحفظة",
      "date": "2025-01-09T10:00:00.000Z"
    }
  ]
}
```

---

### Redeem Wallet Code
**POST** `/wallet/redeem-code`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "code": "WALLET-CODE-123"
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

## 💬 Chat

### Get My Chat
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
        "sender": "user",
        "message": "مرحباً",
        "timestamp": "2025-01-09T10:00:00.000Z"
      },
      {
        "sender": "admin",
        "message": "أهلاً بك، كيف يمكنني مساعدتك؟",
        "timestamp": "2025-01-09T10:01:00.000Z"
      }
    ]
  }
}
```

---

### Send Message
**POST** `/chat/send`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "chatId": "chat_id",
  "message": "أحتاج مساعدة في طلبي"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الرسالة"
}
```

---

## ⚙️ Settings

### Get Settings
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
    "pricing": {
      "shippingRate": 10,
      "commissionPercentage": 5,
      "customsPercentage": 5
    },
    "stores": {
      "amazon": { "enabled": true },
      "noon": { "enabled": true },
      "aliexpress": { "enabled": true }
    }
  }
}
```

---

## 📝 Error Responses

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

## 🔒 Authentication

معظم الـ endpoints تحتاج إلى Token في الـ Header:

```
Authorization: Bearer {your_jwt_token}
```

احصل على الـ Token من `/auth/login` أو `/auth/register`

---

## 📱 للمطور

### Base URL للتطوير:
```
http://localhost:5000/api
```

### Base URL للإنتاج:
```
https://your-domain.com/api
```

### ملاحظات مهمة:
1. جميع الـ responses بصيغة JSON
2. التواريخ بصيغة ISO 8601
3. الأسعار بالريال السعودي (SAR)
4. اللغة الافتراضية: العربية
5. يدعم RTL (من اليمين لليسار)

---

## 🧪 Testing

يمكنك اختبار الـ API باستخدام:
- Postman
- Insomnia
- cURL
- أي HTTP Client

### مثال cURL:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Cart (with token)
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📞 الدعم

للمزيد من المعلومات أو المساعدة، تواصل مع فريق التطوير.

---

**آخر تحديث:** 9 يناير 2025
