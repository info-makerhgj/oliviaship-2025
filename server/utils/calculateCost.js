import Settings from '../models/Settings.js';

export const calculateCost = async (productPrice, currency = 'SAR', quantity = 1, store = 'other') => {
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
    
    // Store settings only used for validation, not for commission calculation
    const storeSettings = (settings.stores && settings.stores[store]) || (settings.stores && settings.stores.amazon);

    // Convert to SAR if needed
    let priceInSAR = productPrice;
    if (currency !== 'SAR') {
      const currencyRates = pricing.currencyRates || {};
      const rate = currencyRates[currency] || currencyRates.USD || 1;
      const sarRate = currencyRates.SAR || 3.75;
      priceInSAR = productPrice * (sarRate / rate);
    }

    const subtotal = priceInSAR * quantity;

    // Calculate fees - العمولة والجمارك موحدة من إعدادات الأسعار العامة
    // Commission is unified from pricing settings (not per store)
    const unifiedCommissionPercentage = pricing.commissionPercentage || 15;
    const commission = subtotal * (unifiedCommissionPercentage / 100);
    const customsFees = subtotal * (pricing.customsPercentage / 100);
    // Shipping is a fixed amount for the entire order, not per item
    const shippingCost = pricing.shippingRate || 0;

    // Total in SAR
    const totalCost = subtotal + commission + customsFees + shippingCost;

    // Convert to YER using SAR rate
    const currencyRates = pricing.currencyRates || {};
    const sarToYer = currencyRates.SAR || 67;
    const totalInYER = totalCost * sarToYer;

    return {
      productPrice: subtotal,
      shippingCost,
      commission,
      customsFees,
      totalCost,
      totalInYER: Math.round(totalInYER),
      currency: 'SAR',
    };
  } catch (error) {
    console.error('Cost calculation error:', error);
    throw new Error('فشل في حساب التكلفة');
  }
};
