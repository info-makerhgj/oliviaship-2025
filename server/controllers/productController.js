import { scrapeProduct } from '../utils/scrapers/universalScraper.js';
import { calculateCost } from '../utils/calculateCost.js';
import { catchAsync } from '../utils/catchAsync.js';
import Settings from '../models/Settings.js';
import { normalizeUrl } from '../utils/extractUrl.js';

// Get all products (returns empty array since products are fetched on-demand)
export const getAllProducts = catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'المنتجات تُجلب عند الطلب من المتاجر الخارجية'
  });
});

// Get product by ID (not implemented yet)
export const getProductById = catchAsync(async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المنتج غير موجود'
  });
});

export const fetchFromUrl = catchAsync(async (req, res, next) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: 'يرجى إدخال رابط المنتج',
    });
  }

  // استخراج الرابط من النص المختلط (مثل عند نسخ من تطبيق Shein)
  url = normalizeUrl(url);
  
  if (!url) {
    return res.status(400).json({
      message: 'لم يتم العثور على رابط صحيح في النص المدخل',
    });
  }

  // Check store settings
  const settings = await Settings.getSettings();
  const urlLower = url.toLowerCase();
  
  // Detect store from URL - check local stores first
  let detectedStore = 'other';
  let localStoreInfo = null;
  
  // Check local stores first
  if (settings.localStores && settings.localStores.length > 0) {
    for (const localStore of settings.localStores) {
      if (localStore.enabled && localStore.domain) {
        const domainLower = localStore.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (urlLower.includes(domainLower)) {
          detectedStore = 'local';
          localStoreInfo = localStore;
          break;
        }
      }
    }
  }
  
  // If not local store, check known stores
  if (detectedStore === 'other') {
    if (urlLower.includes('amazon')) detectedStore = 'amazon';
    else if (urlLower.includes('noon')) detectedStore = 'noon';
    else if (urlLower.includes('shein')) detectedStore = 'shein';
    else if (urlLower.includes('aliexpress')) detectedStore = 'aliexpress';
    else if (urlLower.includes('temu')) detectedStore = 'temu';
    else if (urlLower.includes('trendyol') || urlLower.includes('ty.gl')) detectedStore = 'trendyol';
    else if (urlLower.includes('iherb')) detectedStore = 'iherb';
    else if (urlLower.includes('niceonesa')) detectedStore = 'niceonesa';
    else if (urlLower.includes('namshi')) detectedStore = 'namshi';
  }

  // Reject unknown stores - only allow known stores (predefined or manually added)
  if (detectedStore === 'other') {
    return res.status(400).json({
      message: 'المتجر غير مدعوم. يرجى استخدام رابط من متجر معرف (Amazon, Noon, Shein, إلخ) أو إضافة المتجر من الإعدادات',
      error: 'المتجر غير مدعوم',
      suggestion: 'يمكنك إضافة هذا المتجر يدوياً من الإعدادات > المتاجر > المتاجر المحلية',
    });
  }

  // Check if store is enabled
  if (detectedStore === 'local' && localStoreInfo) {
    if (!localStoreInfo.enabled) {
      return res.status(400).json({
        message: `المتجر المحلي "${localStoreInfo.name}" معطل حالياً`,
        error: 'المتجر غير متاح',
      });
    }
  } else if (detectedStore !== 'other') {
    const storeSettings = settings.stores?.[detectedStore];
    if (storeSettings && !storeSettings.enabled) {
      return res.status(400).json({
        message: `المتجر ${detectedStore} معطل حالياً`,
        error: 'المتجر غير متاح',
      });
    }
  }

  const product = await scrapeProduct(url);

  if (!product.success) {
    return res.status(400).json({
      message: product.error || 'فشل في جلب بيانات المنتج',
      error: product.error || 'خطأ غير معروف',
      details: product.details || null,
      suggestion: product.suggestion || null,
    });
  }

  // Validate order value limits if store settings exist
  if (detectedStore !== 'other' && product.success && product.price) {
    let storeSettings = null;
    
    if (detectedStore === 'local' && localStoreInfo) {
      storeSettings = localStoreInfo;
    } else {
      storeSettings = settings.stores?.[detectedStore];
    }
    
    if (storeSettings) {
      if (storeSettings.minOrderValue && product.price < storeSettings.minOrderValue) {
        const storeName = detectedStore === 'local' ? localStoreInfo.name : detectedStore;
        return res.status(400).json({
          message: `الحد الأدنى للطلب من ${storeName} هو ${storeSettings.minOrderValue} ${product.currency || 'SAR'}`,
          error: 'قيمة الطلب أقل من الحد الأدنى',
        });
      }
      if (storeSettings.maxOrderValue && product.price > storeSettings.maxOrderValue) {
        const storeName = detectedStore === 'local' ? localStoreInfo.name : detectedStore;
        return res.status(400).json({
          message: `الحد الأقصى للطلب من ${storeName} هو ${storeSettings.maxOrderValue} ${product.currency || 'SAR'}`,
          error: 'قيمة الطلب أعلى من الحد الأقصى',
        });
      }
    }
  }

  res.json({
    success: true,
    product,
  });
});

export const calculateCostForProduct = catchAsync(async (req, res, next) => {
  const { price, currency = 'SAR', quantity = 1, store = 'other' } = req.body;

  const pricing = await calculateCost(price, currency, quantity, store);

  res.json({
    success: true,
    pricing,
  });
});

export const validateUrl = catchAsync(async (req, res, next) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: 'يرجى إدخال رابط المنتج',
    });
  }

  // استخراج الرابط من النص المختلط
  url = normalizeUrl(url);
  
  if (!url) {
    return res.status(400).json({
      success: false,
      isValid: false,
      isSupported: false,
      message: 'لم يتم العثور على رابط صحيح في النص المدخل',
    });
  }

  const isValidUrl = /^https?:\/\/.+/.test(url);
  const supportedStores = ['amazon', 'noon', 'shein', 'aliexpress', 'temu'];

  const urlLower = url.toLowerCase();
  const detectedStore = supportedStores.find(store => urlLower.includes(store)) || 'other';
  const isSupported = detectedStore !== 'other';

  // Check store settings
  const settings = await Settings.getSettings();
  let isEnabled = true;
  let message = '';

  if (detectedStore !== 'other') {
    const storeSettings = settings.stores?.[detectedStore];
    if (storeSettings) {
      isEnabled = storeSettings.enabled !== false;
      if (!isEnabled) {
        message = `المتجر ${detectedStore} معطل حالياً`;
      }
    }
  }

  res.json({
    success: true,
    isValid: isValidUrl,
    isSupported,
    isEnabled,
    message,
    store: detectedStore,
  });
});
