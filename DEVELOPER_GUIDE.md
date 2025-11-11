# 👨‍💻 دليل المطور - منصة التوصيل العالمي

## 📚 نظرة شاملة على المشروع

هذا المشروع هو **منصة توصيل عالمية متكاملة** مبنية بتقنيات حديثة وبنية احترافية قابلة للتوسع.

---

## 🏗️ البنية التقنية (Tech Stack)

### Frontend
```
- React 18 (مكتبة بناء الواجهات)
- React Router v6 (التنقل بين الصفحات)
- Tailwind CSS (التنسيقات - مع دعم RTL)
- Zustand (إدارة الحالة العامة)
- Axios (طلبات API)
- React Hot Toast (الإشعارات)
- React Icons (الأيقونات)
- Vite (أداة البناء - سريعة جداً)
```

### Backend
```
- Node.js (بيئة التشغيل)
- Express.js (إطار العمل)
- MongoDB + Mongoose (قاعدة البيانات)
- JWT (المصادقة)
- Bcrypt (تشفير كلمات المرور)
- Nodemailer (إرسال الإيميلات)
- Multer (رفع الملفات)
- Cheerio (استخراج بيانات المواقع)
- Socket.io (الإشعارات الفورية)
```

---

## 📁 شرح هيكل المشروع بالتفصيل

### مجلد `server/`

#### 1. `models/` - نماذج قاعدة البيانات
كل ملف يمثل جدول (Collection) في MongoDB:

```javascript
User.js         // نموذج المستخدمين
Order.js        // نموذج الطلبات
Product.js      // نموذج المنتجات
Shipment.js     // نموذج الشحنات
Payment.js      // نموذج المدفوعات
Notification.js // نموذج الإشعارات
Settings.js     // نموذج الإعدادات
```

**مثال على User Model:**
```javascript
- اسم المستخدم، الإيميل، الهاتف
- كلمة المرور (مشفرة)
- الدور (عميل، مدير، موظف)
- العنوان الكامل
- إحصائيات (عدد الطلبات، المبالغ المدفوعة)
- حالة الحساب (نشط/معطل)
```

#### 2. `routes/` - المسارات
كل ملف يحتوي على مسارات API لميزة معينة:

```javascript
auth.js         // /api/auth/...
orders.js       // /api/orders/...
products.js     // /api/products/...
users.js        // /api/users/...
payments.js     // /api/payments/...
shipments.js    // /api/shipments/...
notifications.js// /api/notifications/...
settings.js     // /api/settings/...
stats.js        // /api/stats/...
```

#### 3. `controllers/` - منطق العمل
الدوال التي تنفذ العمليات الفعلية:

```javascript
authController.js       // تسجيل، دخول، تحديث
orderController.js      // إنشاء، تحديث، حذف طلبات
productController.js    // جلب منتجات، حساب تكلفة
```

#### 4. `middleware/` - الوسائط
دوال تعمل قبل تنفيذ الطلبات:

```javascript
auth.js          // التحقق من تسجيل الدخول
errorHandler.js  // معالجة الأخطاء
upload.js        // رفع الملفات
validate.js      // التحقق من المدخلات
```

#### 5. `utils/` - دوال مساعدة
دوال قابلة لإعادة الاستخدام:

```javascript
generateToken.js   // إنشاء JWT Token
emailService.js    // إرسال الإيميلات
```

---

### مجلد `src/` (Frontend)

#### 1. `components/` - المكونات

**layouts/** - هياكل الصفحات
```javascript
MainLayout.jsx       // الهيكل العام (Navbar + Content + Footer)
DashboardLayout.jsx  // هيكل لوحة التحكم (Sidebar + Content)
```

**dashboard/** - مكونات لوحة التحكم
```javascript
Sidebar.jsx          // القائمة الجانبية
DashboardNavbar.jsx  // شريط التنقل العلوي
```

**عامة:**
```javascript
Navbar.jsx           // شريط التنقل الرئيسي
Footer.jsx           // ذيل الصفحة
PrivateRoute.jsx     // حماية الصفحات (يجب تسجيل الدخول)
AdminRoute.jsx       // حماية صفحات الإدارة
```

#### 2. `pages/` - الصفحات

**public/** - صفحات عامة
```javascript
HomePage.jsx         // الصفحة الرئيسية
OrderPage.jsx        // صفحة طلب منتج
TrackingPage.jsx     // صفحة تتبع الطلب
AboutPage.jsx        // من نحن
ContactPage.jsx      // اتصل بنا
```

**auth/** - صفحات المصادقة
```javascript
LoginPage.jsx        // تسجيل الدخول
RegisterPage.jsx     // إنشاء حساب
```

**customer/** - صفحات العميل
```javascript
Dashboard.jsx        // لوحة التحكم
MyOrders.jsx         // طلباتي
OrderDetails.jsx     // تفاصيل الطلب
ProfilePage.jsx      // الملف الشخصي
```

**admin/** - صفحات الإدارة
```javascript
Dashboard.jsx        // لوحة تحكم المدير
Orders.jsx           // إدارة الطلبات
OrderDetails.jsx     // تفاصيل طلب
Users.jsx            // إدارة المستخدمين
Shipments.jsx        // إدارة الشحنات
Payments.jsx         // إدارة المدفوعات
Settings.jsx         // الإعدادات
Reports.jsx          // التقارير
```

#### 3. `store/` - إدارة الحالة العامة
```javascript
authStore.js         // حالة المصادقة (المستخدم، Token)
```

#### 4. `utils/` - دوال مساعدة
```javascript
api.js              // جميع دوال الاتصال بـ API
helpers.js          // دوال عامة (تنسيق، تواريخ، إلخ)
```

---

## 🔄 كيف يعمل النظام؟

### 1. المصادقة (Authentication Flow)

```
المستخدم → يسجل الدخول
    ↓
Backend → يتحقق من البيانات
    ↓
Backend → ينشئ JWT Token
    ↓
Frontend → يحفظ Token في localStorage
    ↓
Frontend → يضيف Token لكل طلب API
    ↓
Backend → يتحقق من Token في كل طلب
```

**كود المثال:**
```javascript
// في authStore.js
setAuth: (user, token) => {
  set({ user, token, isAuthenticated: true });
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
```

### 2. تدفق الطلب (Order Flow)

```
1. العميل يلصق رابط المنتج
   ↓
2. Frontend يرسل الرابط لـ /api/products/fetch-from-url
   ↓
3. Backend يجلب بيانات المنتج (Web Scraping)
   ↓
4. Frontend يعرض بيانات المنتج للعميل
   ↓
5. العميل يدخل الكمية والتفاصيل
   ↓
6. Frontend يحسب التكلفة عبر /api/products/calculate-cost
   ↓
7. Backend يحسب (سعر + شحن + عمولة + جمارك)
   ↓
8. Frontend يعرض التكلفة الإجمالية
   ↓
9. العميل يؤكد الطلب
   ↓
10. Frontend يرسل لـ /api/orders (POST)
   ↓
11. Backend ينشئ الطلب في قاعدة البيانات
   ↓
12. Backend يرسل إيميل تأكيد
```

### 3. نظام الصلاحيات (Authorization)

```javascript
// في auth.js middleware

// التحقق من تسجيل الدخول
protect → يتحقق من Token

// التحقق من الصلاحية
restrictTo('admin', 'purchasing') → يسمح فقط لهذه الأدوار
```

**مثال استخدام:**
```javascript
router.put('/:id/status', 
  protect,  // يجب تسجيل الدخول
  restrictTo('admin', 'purchasing'),  // يجب أن يكون مدير أو موظف مشتريات
  updateOrderStatus
);
```

---

## 📊 قاعدة البيانات (Database Schema)

### Order Schema (مبسط)
```javascript
{
  orderNumber: "YD250100001",  // يتم إنشاؤه تلقائياً
  user: ObjectId,              // ربط بجدول المستخدمين
  product: {
    url: "https://...",
    name: "اسم المنتج",
    price: 100,
    quantity: 2,
    store: "amazon"
  },
  pricing: {
    productPrice: 200,
    shippingCost: 50,
    commission: 30,
    customsFees: 10,
    totalCost: 290,
    totalInYER: 72500
  },
  status: "pending",           // الحالة الحالية
  statusHistory: [             // سجل كل التغييرات
    {
      status: "pending",
      timestamp: Date,
      note: "تم إنشاء الطلب"
    }
  ],
  payment: {
    method: "cash_on_delivery",
    status: "pending",
    paidAmount: 0
  }
}
```

---

## 🎨 التصميم (Styling)

### Tailwind CSS Classes

**الألوان:**
```css
bg-primary-600    // خلفية زرقاء
text-primary-600  // نص أزرق
hover:bg-primary-700  // عند التمرير
```

**RTL Support:**
```css
mr-4   // margin-right (في RTL)
ml-4   // margin-left (في RTL)
pr-4   // padding-right
```

**Responsive:**
```css
md:grid-cols-2    // شبكة عمودين على الشاشات المتوسطة
lg:grid-cols-4    // 4 أعمدة على الشاشات الكبيرة
```

---

## 🔧 دوال مهمة

### 1. formatCurrency (في helpers.js)
تنسيق الأرقام للعملة:
```javascript
formatCurrency(72500)           // "72,500 ر.ي"
formatCurrency(100, 'USD')      // "100 $"
```

### 2. getStatusLabel (في helpers.js)
ترجمة الحالات للعربية:
```javascript
getStatusLabel('pending')       // "في انتظار التأكيد"
getStatusLabel('delivered')     // "تم التوصيل"
```

### 3. getStatusColor (في helpers.js)
ألوان Tailwind حسب الحالة:
```javascript
getStatusColor('pending')       // "bg-yellow-100 text-yellow-800"
getStatusColor('delivered')     // "bg-green-100 text-green-800"
```

---

## 🚀 كيفية إضافة ميزة جديدة

### مثال: إضافة نظام التقييمات

**1. إنشاء Model:**
```javascript
// server/models/Review.js
const reviewSchema = new mongoose.Schema({
  order: { type: ObjectId, ref: 'Order' },
  user: { type: ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});
```

**2. إنشاء Routes:**
```javascript
// server/routes/reviews.js
router.post('/', protect, createReview);
router.get('/:orderId', getReviews);
```

**3. إنشاء Controller:**
```javascript
// server/controllers/reviewController.js
export const createReview = async (req, res) => {
  const review = await Review.create({
    ...req.body,
    user: req.user.id
  });
  res.status(201).json({ success: true, data: { review } });
};
```

**4. إضافة في API Utils:**
```javascript
// src/utils/api.js
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByOrder: (orderId) => api.get(`/reviews/${orderId}`)
};
```

**5. إنشاء Component:**
```javascript
// src/components/ReviewForm.jsx
function ReviewForm({ orderId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await reviewAPI.create({ order: orderId, rating, comment });
    toast.success('تم إضافة التقييم');
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 🐛 معالجة الأخطاء

### في Backend:
```javascript
// استخدام AppError
if (!user) {
  return next(new AppError('المستخدم غير موجود', 404));
}

// أو استخدام try-catch
try {
  const order = await Order.findById(id);
} catch (error) {
  next(error);  // يتم معالجته تلقائياً في errorHandler
}
```

### في Frontend:
```javascript
// Axios Interceptor يعالج الأخطاء تلقائياً
// في api.js - يظهر toast للمستخدم
```

---

## 📝 أفضل الممارسات (Best Practices)

### 1. استخدام async/await
```javascript
// ✅ صحيح
const order = await Order.findById(id);

// ❌ خطأ
Order.findById(id).then(order => { ... });
```

### 2. التحقق من الصلاحيات دائماً
```javascript
// ✅ صحيح
router.delete('/:id', protect, restrictTo('admin'), deleteOrder);

// ❌ خطأ (أي شخص يمكنه الحذف)
router.delete('/:id', deleteOrder);
```

### 3. استخدام try-catch
```javascript
// ✅ صحيح
try {
  const data = await api.getOrders();
} catch (error) {
  console.error(error);
}
```

### 4. عدم تسريب معلومات حساسة
```javascript
// ✅ صحيح
user.password = undefined;  // إخفاء كلمة المرور

// أو في Model
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
```

---

## 🔍 نصائح للتطوير

### 1. استخدام React DevTools
- تثبيت إضافة المتصفح
- فحص Components والـ State

### 2. استخدام Postman
- اختبار API Endpoints
- حفظ الـ Requests

### 3. MongoDB Compass
- عرض البيانات بشكل مرئي
- تنفيذ استعلامات مخصصة

### 4. VS Code Extensions المفيدة
- ES7 React/Redux/GraphQL/React-Native snippets
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client (بديل Postman)

---

## 🎯 الخلاصة

هذا المشروع مبني بطريقة احترافية مع:
- ✅ بنية واضحة ومنظمة
- ✅ أكواد نظيفة وقابلة للصيانة
- ✅ أمان قوي
- ✅ توثيق شامل
- ✅ قابل للتوسع بسهولة

يمكنك البناء عليه وإضافة مزيد من المميزات حسب احتياجاتك! 🚀

---

## 📚 موارد إضافية

- [React Docs](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT.io](https://jwt.io/)

---

**حظاً موفقاً في التطوير! 💪**








