# ⚙️ إعدادات الـ API للمطور

## 🌐 عناوين الـ API

### 1. للجوال الحقيقي (Real Device)
```javascript
const API_URL = 'http://192.168.1.111:5000/api';
```

**الشروط:**
- ✅ الجوال والكمبيوتر على نفس الشبكة (WiFi)
- ✅ السيرفر يعمل على الكمبيوتر
- ✅ جدار الحماية (Firewall) يسمح بالاتصال

---

### 2. للمحاكي Android (Android Emulator)
```javascript
const API_URL = 'http://10.0.2.2:5000/api';
```

**ملاحظة:** `10.0.2.2` هو عنوان خاص يشير إلى `localhost` من داخل المحاكي

---

### 3. للمحاكي iOS (iOS Simulator)
```javascript
const API_URL = 'http://localhost:5000/api';
```

---

### 4. للإنتاج (Production)
```javascript
const API_URL = 'https://your-domain.com/api';
```

---

## 🔧 كيفية الاستخدام

### React Native:

#### الطريقة 1: ملف Config منفصل
أنشئ ملف `config.js`:

```javascript
// config.js
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.111:5000/api', // للجوال الحقيقي
  },
  staging: {
    apiUrl: 'https://staging.your-domain.com/api',
  },
  prod: {
    apiUrl: 'https://your-domain.com/api',
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars;
```

استخدمه:
```javascript
// api.js
import getEnvVars from './config';

const { apiUrl } = getEnvVars();

export const login = async (email, password) => {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  return response.json();
};
```

---

#### الطريقة 2: استخدام Platform
```javascript
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (__DEV__) {
    // في وضع التطوير
    if (Platform.OS === 'android') {
      // للمحاكي Android
      return 'http://10.0.2.2:5000/api';
    } else {
      // للمحاكي iOS أو الجوال الحقيقي
      return 'http://192.168.1.111:5000/api';
    }
  } else {
    // في وضع الإنتاج
    return 'https://your-domain.com/api';
  }
};

export const API_URL = getApiUrl();
```

---

## 🧪 اختبار الاتصال

### 1. اختبر من المتصفح على الجوال
افتح المتصفح على الجوال واذهب إلى:
```
http://192.168.1.111:5000/api/settings
```

إذا ظهرت البيانات، الاتصال يعمل! ✅

---

### 2. اختبر من التطبيق
```javascript
// TestConnection.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

const TestConnection = () => {
  const [status, setStatus] = useState('جاري الاختبار...');
  
  const testConnection = async () => {
    try {
      const response = await fetch('http://192.168.1.111:5000/api/settings');
      const data = await response.json();
      
      if (data.success) {
        setStatus('✅ الاتصال يعمل!');
      } else {
        setStatus('❌ خطأ في البيانات');
      }
    } catch (error) {
      setStatus(`❌ خطأ في الاتصال: ${error.message}`);
    }
  };
  
  useEffect(() => {
    testConnection();
  }, []);
  
  return (
    <View style={{ padding: 20 }}>
      <Text>{status}</Text>
      <Button title="إعادة الاختبار" onPress={testConnection} />
    </View>
  );
};

export default TestConnection;
```

---

## 🔥 حل المشاكل الشائعة

### المشكلة 1: "Network request failed"
**الحل:**
1. تأكد أن الجوال والكمبيوتر على نفس الشبكة
2. تأكد أن السيرفر يعمل على الكمبيوتر
3. جرب فتح `http://192.168.1.111:5000/api/settings` في متصفح الجوال

---

### المشكلة 2: "Connection refused"
**الحل:**
1. تأكد أن السيرفر يعمل:
   ```bash
   npm run server
   ```
2. تأكد أن السيرفر يستمع على `0.0.0.0` وليس `localhost` فقط

---

### المشكلة 3: جدار الحماية (Firewall)
**الحل:**
1. افتح Windows Firewall
2. أضف استثناء للمنفذ 5000
3. أو أوقف جدار الحماية مؤقتاً للاختبار

---

### المشكلة 4: عنوان IP تغير
**الحل:**
1. احصل على عنوان IP الجديد:
   ```bash
   ipconfig
   ```
2. ابحث عن `IPv4 Address` تحت `Wireless LAN adapter Wi-Fi`
3. حدث عنوان الـ API في التطبيق

---

## 📱 أمثلة كاملة

### مثال 1: Login
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.111:5000/api';

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
      // احفظ الـ Token
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

---

### مثال 2: Get Cart
```javascript
const API_URL = 'http://192.168.1.111:5000/api';

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
    console.error('Get cart error:', error);
    throw error;
  }
};
```

---

### مثال 3: Add to Cart
```javascript
const API_URL = 'http://192.168.1.111:5000/api';

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
    console.error('Add to cart error:', error);
    throw error;
  }
};
```

---

## ✅ Checklist

- [ ] السيرفر يعمل على الكمبيوتر (`npm run server`)
- [ ] الجوال والكمبيوتر على نفس الشبكة (WiFi)
- [ ] عنوان IP صحيح (`192.168.1.111`)
- [ ] جربت فتح الـ API في متصفح الجوال
- [ ] جدار الحماية يسمح بالاتصال
- [ ] الـ API_URL في التطبيق صحيح
- [ ] جاهز للتطوير! 🚀

---

**آخر تحديث:** 9 يناير 2025
