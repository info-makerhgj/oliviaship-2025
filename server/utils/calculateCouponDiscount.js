import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';

/**
 * Get store identifier from cart item (handles local stores by domain)
 */
const getStoreIdentifier = async (item) => {
  // If store is 'local', extract domain from productUrl
  if (item.store === 'local' && item.productUrl) {
    try {
      const settings = await Settings.getSettings();
      if (settings.localStores && settings.localStores.length > 0) {
        const urlLower = item.productUrl.toLowerCase();
        for (const localStore of settings.localStores) {
          if (localStore.enabled && localStore.domain) {
            const domainLower = localStore.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (urlLower.includes(domainLower)) {
              // Return domain as identifier for local stores
              return domainLower;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error identifying local store:', error);
    }
  }
  // Return store as is for known stores
  return item.store;
};

/**
 * Calculate discount from coupons applied to cart
 * @param {Array} coupons - Array of coupon objects from cart
 * @param {Number} cartTotal - Total cart amount before discount
 * @param {Array} cartItems - Cart items for store/category filtering
 * @returns {Object} - Discount summary
 */
export const calculateCouponDiscount = async (coupons, cartTotal, cartItems = []) => {
  if (!coupons || coupons.length === 0) {
    return {
      totalDiscount: 0,
      couponsUsed: 0,
      storeBreakdown: {},
      appliedCoupons: [],
    };
  }

  let totalDiscount = 0;
  const appliedCoupons = [];
  const storeBreakdown = {};

  // Sort coupons by priority (higher priority first)
  const sortedCoupons = [...coupons].sort((a, b) => {
    // We need to fetch coupon details to get priority
    // For now, process in order
    return 0;
  });

  for (const couponData of sortedCoupons) {
    if (!couponData || !couponData.isActive) continue;

    // Get full coupon details
    const couponId = couponData.couponId || couponData._id;
    if (!couponId) continue;

    let coupon;
    try {
      coupon = await Coupon.findById(couponId);
    } catch (error) {
      console.error('Error finding coupon:', error);
      continue;
    }

    if (!coupon || !coupon.isActive) continue;

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) continue;
    if (now > coupon.validUntil) continue;

    // Check minimum order amount (compare with cart total before discount)
    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      continue;
    }

    // Filter items by applicable stores
    let applicableItems = cartItems;
    let applicableTotal = cartTotal;
    
    if (coupon.applicableStores && coupon.applicableStores.length > 0) {
      // Filter items to only include those from applicable stores
      // Need to check both store field and domain for local stores
      const applicableItemsList = [];
      
      for (const item of cartItems) {
        const itemStoreId = await getStoreIdentifier(item);
        
        // Check if item store matches any applicable store
        // For local stores, check if domain matches or if 'local' is in applicableStores
        const matches = coupon.applicableStores.some(applicableStore => {
          // Direct match
          if (applicableStore === itemStoreId || applicableStore === item.store) {
            return true;
          }
          // For local stores, check if domain matches
          if (item.store === 'local' && item.productUrl) {
            // Check if applicableStore is a domain (starts with http or contains .)
            if (applicableStore.includes('.') || applicableStore.startsWith('http')) {
              const domainLower = applicableStore.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
              const urlLower = item.productUrl.toLowerCase();
              return urlLower.includes(domainLower);
            }
            // Check if applicableStore is local_* format
            if (applicableStore.startsWith('local_')) {
              // Extract domain from applicableStore (format: local_domain)
              const storeDomain = applicableStore.replace('local_', '');
              const urlLower = item.productUrl.toLowerCase();
              return urlLower.includes(storeDomain.toLowerCase());
            }
          }
          return false;
        });
        
        if (matches) {
          applicableItemsList.push(item);
        }
      }
      
      applicableItems = applicableItemsList;
      
      if (applicableItems.length === 0) {
        continue; // No items from applicable stores
      }
      
      // Calculate total for applicable items only
      applicableTotal = applicableItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Check minimum order amount against applicable total
      if (coupon.minOrderAmount && applicableTotal < coupon.minOrderAmount) {
        continue;
      }
    } else {
      // No store restriction - check minimum order amount against full cart
      if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
        continue;
      }
    }

    // Calculate discount based on applicable items total
    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = applicableTotal * (coupon.discountValue / 100);
      
      // Apply max discount limit if set
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
      
      // Don't exceed applicable total
      if (discountAmount > applicableTotal) {
        discountAmount = applicableTotal;
      }
    }

    // Apply discount to remaining cart total (after previous discounts)
    const remainingTotal = cartTotal - totalDiscount;
    if (discountAmount > remainingTotal) {
      discountAmount = remainingTotal;
    }

    totalDiscount += discountAmount;

    appliedCoupons.push({
      code: coupon.code,
      couponId: coupon._id,
      discountAmount,
      discountType: coupon.discountType,
      applicableStores: coupon.applicableStores || [],
    });

    // Store breakdown - distribute discount to applicable stores based on their item totals
    if (coupon.applicableStores && coupon.applicableStores.length > 0) {
      // Calculate total for each applicable store
      const storeTotals = {};
      let totalApplicableValue = 0;
      
      // Calculate totals per store (using store identifiers)
      const storeTotalsMap = {};
      for (const item of applicableItems) {
        const itemStoreId = await getStoreIdentifier(item);
        const itemTotal = item.price * item.quantity;
        if (!storeTotalsMap[itemStoreId]) {
          storeTotalsMap[itemStoreId] = 0;
        }
        storeTotalsMap[itemStoreId] += itemTotal;
        totalApplicableValue += itemTotal;
      }
      
      // Distribute discount proportionally based on store totals
      for (const applicableStore of coupon.applicableStores) {
        // Find matching store in storeTotalsMap
        let matchedStoreId = null;
        for (const [storeId, total] of Object.entries(storeTotalsMap)) {
          // Direct match
          if (applicableStore === storeId) {
            matchedStoreId = storeId;
            break;
          }
          // For local stores, check domain match
          if (applicableStore.includes('.') || applicableStore.startsWith('http')) {
            const applicableDomain = applicableStore.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const storeDomain = storeId.toLowerCase();
            if (storeDomain.includes(applicableDomain) || applicableDomain.includes(storeDomain)) {
              matchedStoreId = storeId;
              break;
            }
          }
        }
        
        if (matchedStoreId && storeTotalsMap[matchedStoreId]) {
          const storeKey = applicableStore; // Use original applicableStore as key
          if (!storeBreakdown[storeKey]) {
            storeBreakdown[storeKey] = 0;
          }
          // Distribute discount proportionally
          const storeProportion = storeTotalsMap[matchedStoreId] / totalApplicableValue;
          storeBreakdown[storeKey] += discountAmount * storeProportion;
        }
      }
    } else {
      // No store restriction - apply to all stores proportionally
      const storeTotals = {};
      let totalCartValue = 0;
      
      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (!storeTotals[item.store]) {
          storeTotals[item.store] = 0;
        }
        storeTotals[item.store] += itemTotal;
        totalCartValue += itemTotal;
      });
      
      Object.keys(storeTotals).forEach(store => {
        if (!storeBreakdown[store]) {
          storeBreakdown[store] = 0;
        }
        const storeProportion = storeTotals[store] / totalCartValue;
        storeBreakdown[store] += discountAmount * storeProportion;
      });
    }
  }

  return {
    totalDiscount: Math.round(totalDiscount * 100) / 100, // Round to 2 decimals
    couponsUsed: appliedCoupons.length,
    storeBreakdown,
    appliedCoupons,
  };
};

