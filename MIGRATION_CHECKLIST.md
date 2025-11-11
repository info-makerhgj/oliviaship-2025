# قائمة فحص نقل المشروع إلى React Native

## ✅ الملفات الأساسية

### 1. الإعدادات والتهيئة
- [ ] إنشاء مشروع React Native
- [ ] تثبيت المكتبات الأساسية
- [ ] إعداد التنقل (React Navigation)
- [ ] إعداد التخزين (AsyncStorage)

### 2. State Management
- [ ] نقل `src/store/authStore.js` → `src/store/authStore.js`
- [ ] تعديل localStorage → AsyncStorage

### 3. API Calls
- [ ] نقل `src/utils/api.js` → `src/services/api.js`
- [ ] تعديل localStorage → AsyncStorage في interceptors
- [ ] تعديل window.location → Navigation

### 4. Utilities
- [ ] نقل `src/utils/helpers.js` → `src/utils/helpers.js`
- [ ] نقل `src/utils/permissions.js` → `src/utils/permissions.js`

### 5. Contexts
- [ ] نقل `src/contexts/ToastContext.jsx` → `src/contexts/ToastContext.jsx`
- [ ] استخدام react-native-toast-message

---

## 📱 المكونات (Components)

### Layouts
- [ ] `MainLayout.jsx` → `MainLayout.jsx`
- [ ] `DashboardLayout.jsx` → `DashboardLayout.jsx`

### Components
- [ ] `Navbar.jsx` → `Navbar.jsx`
- [ ] `Footer.jsx` → `Footer.jsx` (اختياري للجوال)
- [ ] `CartItemCard.jsx` → `CartItemCard.jsx`

### Modals
- [ ] `ConfirmationModal.jsx` → `ConfirmationModal.jsx`
- [ ] `PromptModal.jsx` → `PromptModal.jsx`
- [ ] `QRCodeModal.jsx` → `QRCodeModal.jsx`
- [ ] `QRScannerModal.jsx` → `QRScannerModal.jsx`
- [ ] `ToastNotification.jsx` → استخدام react-native-toast-message

### Maps
- [ ] `InteractiveMap.jsx` → `InteractiveMap.jsx` (استخدام react-native-maps)

---

## 📄 الصفحات (Pages → Screens)

### Public Pages
- [ ] `HomePage.jsx` → `HomeScreen.jsx`
- [ ] `OrderPage.jsx` → `OrderScreen.jsx`
- [ ] `CartPage.jsx` → `CartScreen.jsx`
- [ ] `TrackingPage.jsx` → `TrackingScreen.jsx`
- [ ] `AboutPage.jsx` → `AboutScreen.jsx`
- [ ] `ContactPage.jsx` → `ContactScreen.jsx`
- [ ] `TermsPage.jsx` → `TermsScreen.jsx`
- [ ] `PrivacyPage.jsx` → `PrivacyScreen.jsx`
- [ ] `CookiesPage.jsx` → `CookiesScreen.jsx`
- [ ] `PointsPage.jsx` → `PointsScreen.jsx`
- [ ] `StoresPage.jsx` → `StoresScreen.jsx`

### Auth Pages
- [ ] `LoginPage.jsx` → `LoginScreen.jsx`
- [ ] `RegisterPage.jsx` → `RegisterScreen.jsx`

### Customer Pages
- [ ] `Dashboard.jsx` → `CustomerDashboardScreen.jsx`
- [ ] `MyOrders.jsx` → `MyOrdersScreen.jsx`
- [ ] `OrderDetails.jsx` → `OrderDetailsScreen.jsx`
- [ ] `WalletPage.jsx` → `WalletScreen.jsx`
- [ ] `ProfilePage.jsx` → `ProfileScreen.jsx`
- [ ] `Chat.jsx` → `ChatScreen.jsx`
- [ ] `ContactReplies.jsx` → `ContactRepliesScreen.jsx`

### Admin Pages
- [ ] `Dashboard.jsx` → `AdminDashboardScreen.jsx`
- [ ] `Orders.jsx` → `AdminOrdersScreen.jsx`
- [ ] `Users.jsx` → `AdminUsersScreen.jsx`
- [ ] `Settings.jsx` → `AdminSettingsScreen.jsx`
- [ ] `Payments.jsx` → `AdminPaymentsScreen.jsx`
- [ ] `Roles.jsx` → `AdminRolesScreen.jsx`
- [ ] `ContactMessages.jsx` → `AdminContactMessagesScreen.jsx`
- [ ] `AdminChat.jsx` → `AdminChatScreen.jsx`
- [ ] `Coupons.jsx` → `AdminCouponsScreen.jsx`
- [ ] `WalletCodes.jsx` → `WalletCodesScreen.jsx`
- [ ] `Wallets.jsx` → `WalletsScreen.jsx`
- [ ] `PointsOfSale.jsx` → `PointsOfSaleScreen.jsx`
- [ ] `Agents.jsx` → `AgentsScreen.jsx`
- [ ] `AgentPayments.jsx` → `AgentPaymentsScreen.jsx`

### Agent Pages
- [ ] `AgentDashboard.jsx` → `AgentDashboardScreen.jsx`
- [ ] `AgentCustomers.jsx` → `AgentCustomersScreen.jsx`
- [ ] `AgentOrders.jsx` → `AgentOrdersScreen.jsx`
- [ ] `AgentCommissions.jsx` → `AgentCommissionsScreen.jsx`

### POS Pages
- [ ] `PointDashboard.jsx` → `PointDashboardScreen.jsx`
- [ ] `PointManagerRedirect.jsx` → `PointManagerRedirectScreen.jsx`

---

## 🧭 التنقل (Navigation)

### Stack Navigators
- [ ] MainStack (Public routes)
- [ ] AuthStack (Login/Register)
- [ ] CustomerStack (Dashboard routes)
- [ ] AdminStack (Admin routes)
- [ ] AgentStack (Agent routes)
- [ ] POSStack (Point routes)

### Tab Navigators
- [ ] CustomerTabs (Dashboard, Orders, Wallet, Profile)
- [ ] AdminTabs (Dashboard, Orders, Users, Settings)

---

## 🎨 التصميم

### Icons
- [ ] استبدال react-icons → react-native-vector-icons
- [ ] تثبيت الأيقونات المطلوبة

### Styling
- [ ] إعداد NativeWind (Tailwind للـ React Native)
- [ ] أو استخدام StyleSheet

### Colors & Theme
- [ ] نقل الألوان من index.css
- [ ] إنشاء theme.js

---

## 🔧 الميزات الخاصة

### Socket.io
- [ ] إعداد socket.io-client للـ React Native
- [ ] نقل Chat functionality

### Maps
- [ ] تثبيت react-native-maps
- [ ] نقل InteractiveMap

### QR Code
- [ ] تثبيت react-native-qrcode-scanner
- [ ] نقل QRScannerModal

### Image Picker
- [ ] تثبيت react-native-image-picker (لرفع الصور)

---

## 📦 المكتبات المطلوبة

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# State
npm install zustand

# API
npm install axios

# Storage
npm install @react-native-async-storage/async-storage

# UI
npm install react-native-paper react-native-vector-icons
npm install react-native-toast-message

# Maps
npm install react-native-maps

# QR Code
npm install react-native-qrcode-scanner

# Socket
npm install socket.io-client

# Image
npm install react-native-image-picker

# Styling (اختياري)
npm install nativewind tailwindcss
```

---

## ✅ الاختبار

- [ ] اختبار على Android
- [ ] اختبار على iOS
- [ ] اختبار جميع الصفحات
- [ ] اختبار API calls
- [ ] اختبار Authentication
- [ ] اختبار Navigation
- [ ] اختبار Permissions

---

## 📱 النشر

- [ ] إعداد Android signing
- [ ] إعداد iOS certificates
- [ ] بناء APK/AAB
- [ ] بناء IPA
- [ ] رفع لـ Google Play
- [ ] رفع لـ App Store






