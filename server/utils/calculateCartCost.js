import Settings from '../models/Settings.js';

/**
 * Calculate total cost for cart items grouped by store
 * Each store's items are calculated separately, and shipping fees are applied
 * if the store total is below the minimum order value
 */
export const calculateCartCost = async (cartItems) => {
  try {
    const settings = await Settings.getSettings();
    const pricing = settings.pricing || {};
    
    // Ensure currencyRates exists
    if (!pricing.currencyRates) {
      pricing.currencyRates = {
        USD: 1,
        SAR: 3.75,
        YER: 67,
      };
    }
    
    // Group items by store
    const itemsByStore = {};
    
    cartItems.forEach(item => {
      const store = item.store || 'other';
      if (!itemsByStore[store]) {
        itemsByStore[store] = [];
      }
      itemsByStore[store].push(item);
    });
    
    let totalProductPrice = 0;
    let totalStoreShippingCost = 0; // Shipping fees per store (if below minimum)
    const storeBreakdown = [];
    
    // First pass: Calculate total product price and store-specific shipping fees
    for (const [store, items] of Object.entries(itemsByStore)) {
      // Calculate store total
      let storeProductPrice = 0;
      let storeQuantity = 0;
      
      items.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        
        // Convert to SAR if needed
        let priceInSAR = itemPrice;
        if (item.currency && item.currency !== 'SAR') {
          const currencyRates = pricing.currencyRates || {};
          const rate = currencyRates[item.currency] || currencyRates.USD || 1;
          const sarRate = currencyRates.SAR || 1;
          priceInSAR = itemPrice * (sarRate / rate);
        }
        
        storeProductPrice += priceInSAR * itemQuantity;
        storeQuantity += itemQuantity;
      });
      
      // Get store settings - check if it's a local store first
      let storeSettings = null;
      let isKnownStore = false;
      
      if (store === 'local') {
        // Find local store by matching domain in items
        const firstItem = items[0];
        if (firstItem && settings.localStores) {
          const urlLower = (firstItem.productUrl || '').toLowerCase();
          for (const localStore of settings.localStores) {
            if (localStore.enabled && localStore.domain) {
              const domainLower = localStore.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
              if (urlLower.includes(domainLower)) {
                storeSettings = localStore;
                isKnownStore = true;
                break;
              }
            }
          }
        }
      } else {
        // Check if it's a known store (not 'other')
        const knownStores = ['amazon', 'noon', 'shein', 'aliexpress', 'temu', 'iherb', 'niceonesa', 'namshi', 'trendyol'];
        if (knownStores.includes(store)) {
          storeSettings = settings.stores[store];
          if (storeSettings) {
            isKnownStore = true;
          }
        }
      }
      
      // Only apply shipping fees if store is known and has settings
      const minOrderValue = (isKnownStore && storeSettings) ? (storeSettings.minOrderValue || 0) : 0;
      const shippingFee = (isKnownStore && storeSettings) ? (storeSettings.shippingFee || 0) : 0;
      
      // Apply shipping fee if below minimum order value (store-specific shipping)
      // Only for known stores with configured settings
      let storeShippingCost = 0;
      if (isKnownStore && minOrderValue > 0 && storeProductPrice < minOrderValue) {
        // Apply shipping fee from store settings
        storeShippingCost = shippingFee;
      }
      
      // Add to totals
      totalProductPrice += storeProductPrice;
      totalStoreShippingCost += storeShippingCost; // Store-specific shipping fees
      
      // Store breakdown for debugging/info (without commission and customs - will be unified)
      // Only show shipping info if store is known
      storeBreakdown.push({
        store,
        itemCount: items.length,
        productPrice: storeProductPrice,
        minOrderValue: isKnownStore ? minOrderValue : 0,
        shippingFee: storeShippingCost,
        belowMinimum: isKnownStore && minOrderValue > 0 && storeProductPrice < minOrderValue,
        isKnownStore: isKnownStore, // Flag to know if store is configured
        message: (isKnownStore && minOrderValue > 0 && storeProductPrice < minOrderValue)
          ? `يتم إضافة رسوم الشحن (${storeShippingCost} ر.س) لأن المجموع (${storeProductPrice.toFixed(2)} ر.س) أقل من الحد الأدنى (${minOrderValue} ر.س)`
          : null,
      });
    }
    
    // Calculate unified fees on total cart (not per store)
    // Get unified percentages from pricing settings
    const unifiedCommissionPercentage = pricing.commissionPercentage || 15;
    const unifiedCustomsPercentage = pricing.customsPercentage || 5;
    const unifiedShippingRate = pricing.shippingRate || 0;
    
    // Calculate unified fees on total product price
    const totalCommission = Math.round((totalProductPrice * (unifiedCommissionPercentage / 100)) * 100) / 100;
    const totalCustomsFees = Math.round((totalProductPrice * (unifiedCustomsPercentage / 100)) * 100) / 100;
    const totalInternationalShipping = unifiedShippingRate; // Fixed amount for entire cart
    
    // Debug log (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Unified Calculation:', {
        totalProductPrice,
        unifiedCommissionPercentage,
        unifiedCustomsPercentage,
        totalCommission,
        totalCustomsFees,
        unifiedShippingRate,
        totalInternationalShipping,
        totalStoreShippingCost,
      });
    }
    
    // Total shipping = store-specific shipping + unified international shipping
    const totalShippingCost = totalStoreShippingCost + totalInternationalShipping;
    
    // Calculate total cost - round to 2 decimal places
    const totalCost = Math.round((totalProductPrice + totalShippingCost + totalCommission + totalCustomsFees) * 100) / 100;
    
    // Debug log for total calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('💰 Total Cost Breakdown:', {
        totalProductPrice,
        totalShippingCost,
        totalCommission,
        totalCustomsFees,
        totalCost,
        calculation: `${totalProductPrice} + ${totalShippingCost} + ${totalCommission} + ${totalCustomsFees} = ${totalCost}`,
      });
    }
    
    // Convert to YER
    const currencyRates = pricing.currencyRates || {};
    const sarToYer = currencyRates.SAR || 67;
    const totalInYER = Math.round(totalCost * sarToYer);
    
    return {
      productPrice: totalProductPrice,
      shippingCost: totalShippingCost, // Total shipping (store-specific + unified)
      storeShippingCost: totalStoreShippingCost, // Store-specific shipping fees only
      internationalShipping: totalInternationalShipping, // Unified international shipping
      commission: totalCommission,
      customsFees: totalCustomsFees,
      totalCost,
      totalInYER,
      currency: 'SAR',
      storeBreakdown, // For debugging/info
    };
  } catch (error) {
    console.error('Cart cost calculation error:', error);
    throw new Error('فشل في حساب تكلفة السلة');
  }
};

