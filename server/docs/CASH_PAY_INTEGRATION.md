# تكامل Cash Pay API

هذا دليل تكامل Cash Pay للدفع الإلكتروني.

## ⚠️ ملاحظة مهمة

هذا نموذج API مبدئي. يجب تحديثه عند الحصول على:
- API Key الحقيقي
- API Secret الحقيقي
- Merchant ID الحقيقي
- Base URL للـ API الحقيقي
- Documentations الرسمية من Cash Pay

## المتغيرات المطلوبة في .env

أضف هذه المتغيرات إلى ملف `.env`:

```env
# Cash Pay Configuration
CASH_PAY_API_KEY=YOUR_API_KEY_HERE
CASH_PAY_API_SECRET=YOUR_API_SECRET_HERE
CASH_PAY_MERCHANT_ID=YOUR_MERCHANT_ID_HERE
CASH_PAY_BASE_URL=https://api.cash.com.ye
CASH_PAY_ENVIRONMENT=sandbox  # أو 'production'
FRONTEND_URL=http://localhost:5173
```

## Endpoints المتاحة

### 1. إنشاء طلب دفع

```http
POST /api/payments/cashpay/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "order_id_here",
  "smartCartOrderId": "smart_cart_order_id_here" // اختياري
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء طلب الدفع بنجاح",
  "payment": {
    "id": "payment_id",
    "paymentNumber": "CP-1234567890",
    "amount": 1000,
    "currency": "YER",
    "status": "pending"
  },
  "paymentUrl": "https://cash.com.ye/payment/...",
  "transactionId": "transaction_id_from_cashpay"
}
```

### 2. التحقق من حالة الدفعة

```http
GET /api/payments/cashpay/verify/:paymentId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "status": "paid",
    "transactionId": "transaction_id"
  },
  "verified": true,
  "cashPayStatus": "paid"
}
```

### 3. Callback URL (للعودة بعد الدفع)

```
GET /api/payments/cashpay/callback?transactionId=xxx&orderId=xxx
```

يتم توجيه المستخدم تلقائياً إلى صفحة النجاح أو الفشل.

### 4. Webhook (للاستدعاءات من Cash Pay)

```
POST /api/payments/cashpay/webhook
Content-Type: application/json
```

يجب إضافة هذا الـ URL في إعدادات Cash Pay Merchant Portal.

### 5. إرجاع دفعة (Admin Only)

```http
POST /api/payments/cashpay/refund/:paymentId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "amount": 1000,  // اختياري - للرجوع الجزئي. إذا لم يتم إرساله، يتم إرجاع المبلغ الكامل
  "reason": "سبب الإرجاع"
}
```

## خطوات التكامل الكاملة

### 1. الحصول على Credentials من Cash Pay

1. سجل في [Cash Pay](https://www.cash.com.ye/ar)
2. ادخل إلى Merchant Portal
3. احصل على:
   - API Key
   - API Secret
   - Merchant ID
   - Base URL للـ API

### 2. تحديث الكود

افتح `server/services/cashPayService.js` وقم بتحديث:

1. **تعديل طريقة التوقيع** (إذا كانت مختلفة):
```javascript
const generateSignature = (params, secret) => {
  // TODO: تعديل حسب طريقة Cash Pay الفعلية
};
```

2. **تعديل Endpoints**:
```javascript
const endpoint = `${CASH_PAY_CONFIG.baseUrl}/api/v1/payments/create`;
// TODO: تأكد من الـ endpoint الصحيح
```

3. **تعديل Response Structure**:
```javascript
paymentUrl: response.data.payment_url, // TODO: تعديل حسب استجابة Cash Pay
transactionId: response.data.transaction_id, // TODO: تعديل حسب استجابة Cash Pay
```

### 3. إعداد Webhook URL

في Merchant Portal، أضف:
```
https://your-domain.com/api/payments/cashpay/webhook
```

### 4. اختبار التكامل

1. استخدم Sandbox environment أولاً
2. اختبر إنشاء دفعة
3. اختبر Callback
4. اختبر Webhook
5. بعد التأكد، غيّر إلى Production

## هيكل البيانات

### Payment Model
```javascript
{
  paymentNumber: String,
  order: ObjectId,
  smartCartOrder: ObjectId,
  user: ObjectId,
  amount: Number,
  currency: String, // 'YER'
  method: 'cash_pay',
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  gateway: 'cash_pay',
  transactionId: String,
  gatewayResponse: Mixed,
  paidAt: Date
}
```

## الأخطاء الشائعة

1. **توقيع غير صحيح**: تأكد من تحديث `generateSignature`
2. **Endpoint خاطئ**: تأكد من Base URL والـ endpoints الصحيحة
3. **Webhook لا يعمل**: تأكد من إضافة URL في Merchant Portal
4. **Currency**: تأكد من استخدام العملة الصحيحة (YER)

## TODO List

عند الحصول على API Documentation من Cash Pay:

- [ ] تحديث `generateSignature` حسب طريقة Cash Pay
- [ ] تحديث جميع الـ endpoints
- [ ] تحديث Response structure parsing
- [ ] تحديث Webhook verification
- [ ] إضافة Error handling محدد
- [ ] تحديث Currency handling
- [ ] إضافة Unit tests
- [ ] إضافة Logging محسن

## الدعم

للحصول على المساعدة:
- راجع [Cash Pay Documentation](https://www.cash.com.ye/ar)
- اتصل بدعم Cash Pay للحصول على API credentials

