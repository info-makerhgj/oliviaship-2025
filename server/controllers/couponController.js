import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

/**
 * Get all coupons (Admin only)
 */
export const getAllCoupons = catchAsync(async (req, res, next) => {
  const { status, search } = req.query;
  
  const query = {};
  
  if (status && status !== 'all') {
    if (status === 'active') {
      query.isActive = true;
      query.validUntil = { $gte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.validUntil = { $lt: new Date() };
    }
  }
  
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();

  // Populate createdBy separately if needed
  if (coupons.length > 0) {
    const userIds = coupons
      .map(c => c.createdBy)
      .filter(id => id != null);
    
    if (userIds.length > 0) {
      const User = (await import('../models/User.js')).default;
      const users = await User.find({ _id: { $in: userIds } })
        .select('name email')
        .lean();
      
      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = user;
      });

      // Add user data to coupons
      coupons.forEach(coupon => {
        const createdById = coupon.createdBy ? coupon.createdBy.toString() : null;
        if (createdById && userMap[createdById]) {
          coupon.createdBy = {
            _id: userMap[createdById]._id,
            name: userMap[createdById].name || null,
            email: userMap[createdById].email || null
          };
        } else {
          coupon.createdBy = null;
        }
      });
    } else {
      // No createdBy users
      coupons.forEach(coupon => {
        coupon.createdBy = null;
      });
    }
  }

  res.json({
    success: true,
    coupons: coupons || [],
  });
});

/**
 * Get active coupons (Public)
 */
export const getActiveCoupons = catchAsync(async (req, res, next) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  }).sort({ priority: -1, createdAt: -1 });

  res.json({
    success: true,
    coupons,
  });
});

/**
 * Get single coupon
 */
export const getCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate({
      path: 'createdBy',
      select: 'name email',
      strictPopulate: false
    });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود',
    });
  }

  // Convert to plain object
  const couponObj = coupon.toObject ? coupon.toObject() : coupon;
  const couponData = {
    ...couponObj,
    createdBy: coupon.createdBy && coupon.createdBy._id ? {
      _id: coupon.createdBy._id,
      name: coupon.createdBy.name || null,
      email: coupon.createdBy.email || null
    } : null
  };

  res.json({
    success: true,
    coupon: couponData,
  });
});

/**
 * Create coupon (Admin only)
 */
export const createCoupon = catchAsync(async (req, res, next) => {
  const {
    code,
    name,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    applicableStores,
    customSites,
    storeTypes,
    validFrom,
    validUntil,
    usageLimit,
    usageLimitPerUser,
    priority,
    conditions,
  } = req.body;

  if (!code || !name || !discountType || !discountValue || !validUntil) {
    return res.status(400).json({
      success: false,
      message: 'جميع الحقول المطلوبة يجب ملؤها',
    });
  }

  // Check if code already exists
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existingCoupon) {
    return res.status(400).json({
      success: false,
      message: 'كود الكوبون مستخدم بالفعل',
    });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    name,
    description,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountAmount,
    applicableStores: applicableStores || [],
    customSites: customSites || [],
    storeTypes: storeTypes || [],
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: new Date(validUntil),
    usageLimit: usageLimit || null,
    usageLimitPerUser: usageLimitPerUser || 1,
    priority: priority || 0,
    conditions: conditions || {},
    createdBy: req.user.id,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    coupon,
  });
});

/**
 * Update coupon (Admin only)
 */
export const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود',
    });
  }

  res.json({
    success: true,
    coupon,
  });
});

/**
 * Delete coupon (Admin only)
 */
export const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود',
    });
  }

  res.json({
    success: true,
    message: 'تم حذف الكوبون بنجاح',
  });
});

/**
 * Validate coupon
 */
export const validateCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const userId = req.user?.id;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إدخال كود الكوبون',
    });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'كود الكوبون غير صحيح',
    });
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return res.status(400).json({
      success: false,
      message: 'هذا الكوبون غير نشط',
    });
  }

  // Check validity dates
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return res.status(400).json({
      success: false,
      message: 'هذا الكوبون لم يبدأ بعد',
    });
  }

  if (now > coupon.validUntil) {
    return res.status(400).json({
      success: false,
      message: 'هذا الكوبون منتهي الصلاحية',
    });
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'تم استخدام هذا الكوبون بالكامل',
    });
  }

  // Check usage limit per user
  if (userId && coupon.usageLimitPerUser) {
    const userOrders = await Order.countDocuments({
      user: userId,
      'coupons.code': coupon.code,
    });
    
    const userSmartCartOrders = await SmartCartOrder.countDocuments({
      user: userId,
      'coupons.code': coupon.code,
    });

    if (userOrders + userSmartCartOrders >= coupon.usageLimitPerUser) {
      return res.status(400).json({
        success: false,
        message: 'لقد استخدمت هذا الكوبون بالفعل',
      });
    }
  }

  res.json({
    success: true,
    coupon,
    message: 'الكوبون صالح للاستخدام',
  });
});

/**
 * Apply coupon to cart
 */
export const applyCouponToCart = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إدخال كود الكوبون',
    });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'كود الكوبون غير صحيح',
    });
  }

  // Validate coupon
  const now = new Date();
  if (!coupon.isActive || now > coupon.validUntil || (coupon.validFrom && now < coupon.validFrom)) {
    return res.status(400).json({
      success: false,
      message: 'هذا الكوبون غير صالح للاستخدام',
    });
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'تم استخدام هذا الكوبون بالكامل',
    });
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'السلة فارغة',
    });
  }

  // Check if coupon already applied
  const alreadyApplied = cart.coupons.some(
    c => c.couponId?.toString() === coupon._id.toString() || c.code === coupon.code
  );

  if (alreadyApplied) {
    return res.status(400).json({
      success: false,
      message: 'هذا الكوبون مطبق بالفعل',
    });
  }

  // Check usage limit per user
  if (coupon.usageLimitPerUser) {
    const userOrders = await Order.countDocuments({
      user: req.user.id,
      'coupons.code': coupon.code,
    });
    
    const userSmartCartOrders = await SmartCartOrder.countDocuments({
      user: req.user.id,
      'coupons.code': coupon.code,
    });

    if (userOrders + userSmartCartOrders >= coupon.usageLimitPerUser) {
      return res.status(400).json({
        success: false,
        message: 'لقد استخدمت هذا الكوبون بالفعل',
      });
    }
  }

  // Check if coupon is store-specific and if cart has items from those stores
  if (coupon.applicableStores && coupon.applicableStores.length > 0) {
    const Settings = (await import('../models/Settings.js')).default;
    const settings = await Settings.getSettings();
    
    // Helper function to get store identifier from cart item
    const getStoreIdentifier = async (item) => {
      if (item.store === 'local' && item.productUrl) {
        const urlLower = item.productUrl.toLowerCase();
        if (settings.localStores && settings.localStores.length > 0) {
          for (const localStore of settings.localStores) {
            if (localStore.enabled && localStore.domain) {
              const domainLower = localStore.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
              if (urlLower.includes(domainLower)) {
                return domainLower;
              }
            }
          }
        }
      }
      return item.store;
    };
    
    // Check if any cart item matches the applicable stores
    let hasMatchingStore = false;
    const storeNames = {
      amazon: 'Amazon',
      noon: 'Noon',
      shein: 'Shein',
      aliexpress: 'AliExpress',
      temu: 'Temu',
      iherb: 'iHerb',
      niceonesa: 'Nice One',
      namshi: 'Namshi',
      trendyol: 'Trendyol',
      other: 'متاجر أخرى',
    };
    
    for (const item of cart.items) {
      const itemStoreId = await getStoreIdentifier(item);
      
      // Check if item store matches any applicable store
      const matches = coupon.applicableStores.some(applicableStore => {
        // Direct match
        if (applicableStore === itemStoreId || applicableStore === item.store) {
          return true;
        }
        // For local stores, check if domain matches
        if (item.store === 'local' && item.productUrl) {
          if (applicableStore.includes('.') || applicableStore.startsWith('http')) {
            const domainLower = applicableStore.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const urlLower = item.productUrl.toLowerCase();
            return urlLower.includes(domainLower);
          }
        }
        return false;
      });
      
      if (matches) {
        hasMatchingStore = true;
        break;
      }
    }
    
    if (!hasMatchingStore) {
      // Build store names list for the error message
      const applicableStoreNames = coupon.applicableStores.map(store => {
        // Check if it's a known store
        if (storeNames[store]) {
          return storeNames[store];
        }
        // Check if it's a local store
        if (settings.localStores) {
          const localStore = settings.localStores.find(ls => {
            const lsDomain = (ls.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const storeDomain = store.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            return lsDomain && storeDomain && (storeDomain.includes(lsDomain) || lsDomain.includes(storeDomain));
          });
          if (localStore) {
            return localStore.name;
          }
        }
        // Fallback: extract domain name
        try {
          const domain = store.replace(/^https?:\/\//, '').split('/')[0];
          return domain.split('.')[0] || domain;
        } catch (e) {
          return store;
        }
      });
      
      return res.status(400).json({
        success: false,
        message: `هذا الكوبون مخصص للمتاجر التالية: ${applicableStoreNames.join('، ')}. السلة الحالية لا تحتوي على منتجات من هذه المتاجر.`,
        applicableStores: applicableStoreNames,
      });
    }
  }

  // Calculate cart total (we'll recalculate discount later)
  const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Check minimum order amount
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `الحد الأدنى للطلب هو ${coupon.minOrderAmount} ${cart.currency || 'SAR'}`,
    });
  }

  // Add coupon to cart
  cart.coupons.push({
    code: coupon.code,
    couponId: coupon._id,
    appliedAt: new Date(),
    discountType: coupon.discountType,
    applicableStores: coupon.applicableStores || [],
    isActive: true,
  });

  // Calculate and update discount summary
  const { calculateCouponDiscount } = await import('../utils/calculateCouponDiscount.js');
  const discountSummary = await calculateCouponDiscount(
    cart.coupons,
    cartTotal,
    cart.items
  );
  cart.discountSummary = discountSummary;

  await cart.save();

  res.json({
    success: true,
    message: 'تم تطبيق الكوبون بنجاح',
    cart,
    discountSummary,
  });
});

/**
 * Remove coupon from cart
 */
export const removeCouponFromCart = catchAsync(async (req, res, next) => {
  const { couponId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'السلة غير موجودة',
    });
  }

  cart.coupons = cart.coupons.filter(
    c => c._id.toString() !== couponId && c.couponId?.toString() !== couponId
  );

  // Recalculate discount summary
  const { calculateCouponDiscount } = await import('../utils/calculateCouponDiscount.js');
  const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountSummary = await calculateCouponDiscount(
    cart.coupons,
    cartTotal,
    cart.items
  );
  cart.discountSummary = discountSummary;

  await cart.save();

  res.json({
    success: true,
    message: 'تم إزالة الكوبون بنجاح',
    cart,
    discountSummary,
  });
});

/**
 * Toggle coupon status (Admin only)
 */
export const toggleCouponStatus = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود',
    });
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json({
    success: true,
    coupon,
  });
});

