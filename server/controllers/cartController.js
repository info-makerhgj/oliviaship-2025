import Cart from '../models/Cart.js';
import { scrapeProduct } from '../utils/scrapers/universalScraper.js';
import { normalizeUrl } from '../utils/extractUrl.js';
import { calculateCost } from '../utils/calculateCost.js';
import { catchAsync } from '../utils/catchAsync.js';
import Settings from '../models/Settings.js';

export const getCart = catchAsync(async (req, res, next) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح',
    });
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    // Create new cart if doesn't exist
    cart = await Cart.create({
      user: req.user.id,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }

  res.json({
    success: true,
    cart,
  });
});

export const fetchAndAdd = catchAsync(async (req, res, next) => {
  let { url, quantity = 1, color, size } = req.body;

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

  // Check store settings before scraping
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
    if (urlLower.includes('amazon') || urlLower.includes('amzn.')) detectedStore = 'amazon';
    else if (urlLower.includes('noon')) detectedStore = 'noon';
    else if (urlLower.includes('shein')) detectedStore = 'shein';
    else if (urlLower.includes('aliexpress')) detectedStore = 'aliexpress';
    else if (urlLower.includes('temu')) detectedStore = 'temu';
    else if (urlLower.includes('iherb')) detectedStore = 'iherb';
    else if (urlLower.includes('niceonesa')) detectedStore = 'niceonesa';
    else if (urlLower.includes('namshi')) detectedStore = 'namshi';
    else if (urlLower.includes('trendyol') || urlLower.includes('ty.gl')) detectedStore = 'trendyol';
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

  // Scrape product
  const scrapedProduct = await scrapeProduct(url);

  if (!scrapedProduct.success) {
    return res.status(400).json({
      message: scrapedProduct.error || 'فشل في جلب بيانات المنتج',
      error: scrapedProduct.error || 'خطأ غير معروف',
      details: scrapedProduct.details || null,
      suggestion: scrapedProduct.suggestion || null,
    });
  }

  // Extract product data (scrapedProduct should have .product property)
  const productData = scrapedProduct.product || scrapedProduct;
  
  // Validate product data
  if (!productData) {
    return res.status(400).json({
      message: 'فشل في جلب بيانات المنتج',
      error: 'بيانات المنتج غير موجودة',
    });
  }
  
  // Get name from productData (try name or title)
  const productName = productData.name || productData.title || 'منتج بدون اسم';
  const productPrice = parseFloat(productData.price) || 0;
  
  if (productPrice === 0) {
    return res.status(400).json({
      message: 'لم يتم العثور على سعر المنتج',
      error: 'يرجى التأكد من صحة رابط المنتج',
    });
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }

  // Normalize URL for comparison (remove query params and fragments)
  let normalizedUrl;
  try {
    // Try to use URL object for better parsing
    const urlObj = new URL(url);
    normalizedUrl = urlObj.pathname.trim(); // Use only pathname, ignore query and hash
  } catch (e) {
    // Fallback to simple string manipulation if URL parsing fails
    normalizedUrl = url.split('?')[0].split('#')[0].trim();
  }
  
  const normalizedColor = (color || '').trim().toLowerCase();
  const normalizedSize = (size || '').trim().toLowerCase();

  // Check if product already exists in cart (same URL path, color, and size)
  const existingItemIndex = cart.items.findIndex(item => {
    try {
      let itemPath;
      try {
        const itemUrlObj = new URL(item.productUrl);
        itemPath = itemUrlObj.pathname.trim();
      } catch (e) {
        // Fallback to simple string manipulation
        itemPath = item.productUrl.split('?')[0].split('#')[0].trim();
      }
      
      const itemColor = (item.options?.color || '').trim().toLowerCase();
      const itemSize = (item.options?.size || '').trim().toLowerCase();
      
      // Same product if: same path, same color, same size, AND same store
      return itemPath === normalizedUrl && 
             itemColor === normalizedColor && 
             itemSize === normalizedSize &&
             (item.store || 'local') === (productData.store || 'local');
    } catch (e) {
      // Fallback to old method if anything fails
      const itemUrl = item.productUrl.split('?')[0].split('#')[0].trim();
      const itemColor = (item.options?.color || '').trim().toLowerCase();
      const itemSize = (item.options?.size || '').trim().toLowerCase();
      
      return itemUrl === normalizedUrl && 
             itemColor === normalizedColor && 
             itemSize === normalizedSize;
    }
  });

  if (existingItemIndex !== -1) {
    // Product exists, increase quantity
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = parseInt(existingItem.quantity) + (parseInt(quantity) || 1);
    existingItem.quantity = newQuantity;
    
    // Update cart totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.lastUpdated = new Date();

    await cart.save();

    res.json({
      success: true,
      cart,
      message: `تم تحديث الكمية إلى ${newQuantity}`,
      itemUpdated: true,
    });
  } else {
    // Product doesn't exist, add new item
    const cartItem = {
      productUrl: url,
      store: productData.store || 'other',
      name: productName,
      price: productPrice,
      currency: productData.currency || 'SAR',
      image: productData.image || '',
      quantity: parseInt(quantity) || 1,
      options: {
        color: color || '',
        size: size || '',
      },
      addedAt: new Date(),
    };

    cart.items.push(cartItem);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.lastUpdated = new Date();

    await cart.save();

    res.json({
      success: true,
      cart,
      message: 'تم إضافة المنتج إلى السلة',
      itemUpdated: false,
    });
  }
});

export const updateQuantity = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      message: 'السلة غير موجودة',
    });
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({
      message: 'المنتج غير موجود في السلة',
    });
  }

  item.quantity = parseInt(quantity);
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cart.lastUpdated = new Date();

  await cart.save();

  res.json({
    success: true,
    cart,
  });
});

export const updateItemOptions = catchAsync(async (req, res, next) => {
  const { color, size, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      message: 'السلة غير موجودة',
    });
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({
      message: 'المنتج غير موجود في السلة',
    });
  }

  // Update options
  if (color !== undefined) item.options.color = color || '';
  if (size !== undefined) item.options.size = size || '';
  if (notes !== undefined) item.options.specifications = notes || '';
  
  cart.lastUpdated = new Date();

  await cart.save();

  res.json({
    success: true,
    cart,
  });
});

export const removeItem = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      message: 'السلة غير موجودة',
    });
  }

  cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cart.lastUpdated = new Date();

  await cart.save();

  res.json({
    success: true,
    cart,
  });
});

export const getCartPricing = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart || cart.items.length === 0) {
    return res.json({
      success: true,
      pricing: {
        productPrice: 0,
        shippingCost: 0,
        commission: 0,
        customsFees: 0,
        totalCost: 0,
        totalInYER: 0,
        storeBreakdown: [],
      },
    });
  }

  // Get settings
  const settings = await Settings.getSettings();

  // Calculate total pricing using new store-based calculation
  const { calculateCartCost } = await import('../utils/calculateCartCost.js');
  const pricing = await calculateCartCost(cart.items);

  // Calculate shipping cost (check free shipping threshold)
  let shippingCost = pricing.shippingCost;
  const freeShippingThreshold = settings.shipping?.freeShippingThreshold;
  const hasFreeShipping = freeShippingThreshold && pricing.productPrice >= freeShippingThreshold;
  
  // Recalculate total cost if free shipping is applied
  let adjustedTotalCost = pricing.totalCost; // Default: includes all costs (product + shipping + commission + customs)
  let adjustedStoreShippingCost = pricing.storeShippingCost || 0;
  // الشحن الدولي الموحد يبقى كما هو دائماً (يظهر في الواجهة حتى لو كان مجاني)
  let adjustedInternationalShipping = pricing.internationalShipping || 0;
  
  if (hasFreeShipping) {
    // Free shipping - لا نحسب الشحن في المجموع لكن نعرضه في الواجهة
    shippingCost = 0; // Total shipping cost = 0 (for calculation)
    adjustedStoreShippingCost = 0; // Store shipping = 0
    // adjustedInternationalShipping يبقى كما هو (للعرض فقط)
    // Recalculate total cost without shipping fees
    adjustedTotalCost = pricing.productPrice + pricing.commission + pricing.customsFees;
    // Update storeBreakdown to reflect free shipping
    if (pricing.storeBreakdown) {
      pricing.storeBreakdown = pricing.storeBreakdown.map(store => ({
        ...store,
        shippingFee: 0,
        message: store.belowMinimum ? `تم إلغاء رسوم الشحن بسبب الشحن المجاني العام` : null,
      }));
    }
  } else {
    // No free shipping - ensure adjustedTotalCost includes all costs
    // pricing.totalCost already includes: productPrice + shippingCost + commission + customsFees
    adjustedTotalCost = pricing.totalCost;
  }

  // Calculate coupon discounts
  let discountSummary = {
    totalDiscount: 0,
    couponsUsed: 0,
    storeBreakdown: {},
    appliedCoupons: [],
  };

  if (cart.coupons && cart.coupons.length > 0) {
    try {
      const { calculateCouponDiscount } = await import('../utils/calculateCouponDiscount.js');
      const cartTotalBeforeDiscount = adjustedTotalCost;
      discountSummary = await calculateCouponDiscount(
        cart.coupons,
        cartTotalBeforeDiscount,
        cart.items
      );

      // Update cart discount summary
      cart.discountSummary = discountSummary;
      await cart.save();
    } catch (error) {
      console.error('Error calculating coupon discount:', error);
      // Continue without discount if there's an error
      cart.discountSummary = discountSummary;
      await cart.save();
    }
  } else {
    // No coupons, reset discount summary
    cart.discountSummary = discountSummary;
    await cart.save();
  }

  const finalPricing = {
    productPrice: pricing.productPrice,
    shippingCost: shippingCost, // Total shipping (store-specific + international)
    storeShippingCost: adjustedStoreShippingCost, // Store-specific shipping only
    internationalShipping: adjustedInternationalShipping, // Unified international shipping
    commission: pricing.commission,
    customsFees: pricing.customsFees,
    totalDiscount: discountSummary.totalDiscount || 0,
    totalCost: adjustedTotalCost - (discountSummary.totalDiscount || 0),
    totalInYER: Math.round((adjustedTotalCost - (discountSummary.totalDiscount || 0)) * (settings.pricing?.currencyRates?.SAR || 67)),
    storeBreakdown: pricing.storeBreakdown,
    hasFreeShipping: hasFreeShipping,
    appliedCoupons: discountSummary.appliedCoupons || [],
  };

  res.json({
    success: true,
    pricing: finalPricing,
  });
});

export const clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      message: 'السلة غير موجودة',
    });
  }

  cart.items = [];
  cart.totalItems = 0;
  cart.totalPrice = 0;
  cart.coupons = [];
  cart.discountSummary = {
    totalDiscount: 0,
    couponsUsed: 0,
    storeBreakdown: {},
  };
  cart.lastUpdated = new Date();

  await cart.save();

  res.json({
    success: true,
    cart,
  });
});

export const checkout = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('coupons.couponId');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      message: 'السلة فارغة',
    });
  }

  // Get settings
  const Settings = (await import('../models/Settings.js')).default;
  const settings = await Settings.getSettings();

  // Validate payment method
  const paymentMethod = req.body.paymentMethod || 'cash_on_delivery';
  if (paymentMethod === 'cash_on_delivery' && !settings.payment?.cashOnDeliveryEnabled) {
    return res.status(400).json({
      message: 'الدفع عند الاستلام غير مفعل حالياً',
    });
  }
  if (paymentMethod === 'stripe' && !settings.payment?.stripeEnabled) {
    return res.status(400).json({
      message: 'الدفع عبر Stripe غير مفعل حالياً',
    });
  }
  if (paymentMethod === 'cash_pay' && !settings.payment?.cashPayEnabled) {
    return res.status(400).json({
      message: 'الدفع عبر Cash Pay غير مفعل حالياً',
    });
  }
  if (paymentMethod === 'wallet') {
    // Check wallet balance (will be done after calculating total)
  }

  // Import SmartCartOrder here to avoid circular dependency
  const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
  const { generateOrderNumber } = await import('../utils/generateOrderNumber.js');

  // Calculate total pricing using new store-based calculation
  const { calculateCartCost } = await import('../utils/calculateCartCost.js');
  const pricing = await calculateCartCost(cart.items);
  
  // Calculate shipping cost (check free shipping threshold)
  let shippingCost = pricing.shippingCost;
  const freeShippingThreshold = settings.shipping?.freeShippingThreshold;
  if (freeShippingThreshold && pricing.productPrice >= freeShippingThreshold) {
    shippingCost = 0; // Free shipping
  }
  
  const finalPricing = {
    subtotal: pricing.productPrice,
    productPrice: pricing.productPrice,
    shippingCost: shippingCost,
    commission: pricing.commission,
    customsFees: pricing.customsFees,
    totalDiscount: cart.discountSummary?.totalDiscount || 0,
    totalCost: pricing.totalCost,
    totalInYER: pricing.totalInYER,
    storeBreakdown: pricing.storeBreakdown, // Store breakdown info
  };

  // Apply coupons discount if any
  if (cart.discountSummary?.totalDiscount > 0) {
    finalPricing.totalCost -= cart.discountSummary.totalDiscount;
  }

  // Convert to YER using settings currency rates
  const sarToYer = settings.pricing?.currencyRates?.SAR || 67;
  finalPricing.totalInYER = Math.round(finalPricing.totalCost * sarToYer);

  // Handle wallet payment BEFORE creating order
  if (paymentMethod === 'wallet') {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(400).json({
        message: 'المحفظة غير موجودة',
      });
    }

    if (wallet.balance < finalPricing.totalCost) {
      return res.status(400).json({
        message: `رصيدك الحالي (${wallet.balance.toFixed(2)} ${wallet.currency}) غير كافٍ. المطلوب: ${finalPricing.totalCost.toFixed(2)} ${wallet.currency}`,
        balance: wallet.balance,
        required: finalPricing.totalCost,
      });
    }
  }

  // Handle pickupPoint - convert to ObjectId if provided
  let pickupPointId = null;
  if (req.body.delivery?.pickupPoint) {
    const mongoose = await import('mongoose');
    try {
      // Try to convert to ObjectId if it's a valid string
      pickupPointId = new mongoose.Types.ObjectId(req.body.delivery.pickupPoint);
    } catch (error) {
      // If conversion fails, it might already be an ObjectId or invalid
      pickupPointId = req.body.delivery.pickupPoint;
    }
  }

  // Create SmartCartOrder
  const order = await SmartCartOrder.create({
    orderNumber: generateOrderNumber(),
    user: req.user.id,
    products: cart.items.map(item => ({
      url: item.productUrl,
      name: item.name,
      price: item.price,
      currency: item.currency,
      image: item.image,
      quantity: item.quantity,
      color: item.options?.color,
      size: item.options?.size,
      specifications: item.options?.specifications,
      store: item.store,
      status: 'pending',
    })),
    pricing: finalPricing,
    delivery: {
      type: req.body.delivery?.type || 'home', // 'home' or 'pickup_point'
      address: req.body.delivery?.address || {},
      pickupPoint: pickupPointId,
      estimatedDelivery: req.body.delivery?.estimatedDelivery,
      deliveryNotes: req.body.delivery?.deliveryNotes || '',
    },
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      note: 'تم إنشاء الطلب من السلة الذكية',
    }],
    metadata: {
      source: 'web',
      cartSessionId: cart._id.toString(),
      cartCreatedAt: cart.createdAt,
      cartUpdatedAt: cart.updatedAt,
    },
  });

  // Update user stats
  const User = (await import('../models/User.js')).default;
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { 'stats.totalOrders': 1 },
    $set: { 'stats.lastOrderDate': new Date() },
  });

  // Handle wallet payment AFTER creating order
  if (paymentMethod === 'wallet') {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: req.user.id });

    // تحديث حالة الطلب إلى confirmed عند الدفع عبر المحفظة
    order.status = 'confirmed';
    order.payment.status = 'paid';
    await order.save();

    // Deduct from wallet
    await wallet.addTransaction('payment', finalPricing.totalCost, {
      description: `دفع طلب #${order.orderNumber}`,
      smartCartOrderId: order._id,
    });

    // Create payment record
    try {
      const Payment = (await import('../models/Payment.js')).default;
      const generatePaymentNumber = () => {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
      };

      await Payment.create({
        paymentNumber: generatePaymentNumber(),
        smartCartOrder: order._id,
        user: req.user.id,
        amount: finalPricing.totalCost,
        currency: 'SAR',
        method: 'wallet',
        status: 'paid',
        paidAt: new Date(),
        notes: `دفع من المحفظة - الرصيد المتبقي: ${wallet.balance} ${wallet.currency}`,
      });
    } catch (error) {
      console.error('Failed to create payment record:', error);
    }

    // إنشاء فاتورة تلقائياً للدفع عبر المحفظة
    try {
      const { createInvoiceForOrder } = await import('../utils/autoInvoice.js');
      await createInvoiceForOrder(order._id, req.user.id);
    } catch (error) {
      console.error('Failed to create invoice:', error.message);
    }

    // Reload wallet to get updated balance
    await wallet.populate('user', 'name email');

    // Clear cart after checkout
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    cart.coupons = [];
    cart.discountSummary = {
      totalDiscount: 0,
      couponsUsed: 0,
      storeBreakdown: {},
    };
    cart.lastUpdated = new Date();
    await cart.save();

    // Update user stats
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalOrders': 1 },
      $set: { 'stats.lastOrderDate': new Date() },
    });

    // Send confirmation email
    try {
      if (settings.notifications?.emailNotifications && settings.notifications?.notifyOnNewOrder) {
        const { sendOrderConfirmationEmail } = await import('../utils/emailService.js');
        const user = await User.findById(req.user.id);
        await sendOrderConfirmationEmail(user, order);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    return res.status(201).json({
      success: true,
      order,
      orderId: order._id,
      wallet: {
        balance: wallet.balance,
        walletNumber: wallet.walletNumber,
      },
    });
  }

  // Create payment record (for cash on delivery, status is pending)
  // For Stripe and Cash Pay, payment will be created via webhook/callback after successful payment
  if (paymentMethod === 'cash_on_delivery') {
    try {
      const Payment = (await import('../models/Payment.js')).default;
      const generatePaymentNumber = () => {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
      };

      await Payment.create({
        paymentNumber: generatePaymentNumber(),
        smartCartOrder: order._id,
        user: req.user.id,
        amount: finalPricing.totalCost,
        currency: 'SAR',
        method: 'cash_on_delivery',
        status: 'pending',
        notes: 'دفع عند الاستلام',
      });
    } catch (error) {
      console.error('Failed to create payment record:', error);
      // Don't fail the checkout if payment record creation fails
    }
  }

  // For Cash Pay and Stripe, don't clear cart or send email yet
  // Payment gateway will handle order confirmation via webhook/callback
  // Only clear cart for cash_on_delivery and wallet payments (where payment is confirmed)
  const shouldClearCart = paymentMethod === 'cash_on_delivery' || paymentMethod === 'wallet';

  // Send confirmation email only for confirmed payments
  if (shouldClearCart) {
    try {
      if (settings.notifications?.emailNotifications && settings.notifications?.notifyOnNewOrder) {
        const { sendOrderConfirmationEmail } = await import('../utils/emailService.js');
        const user = await User.findById(req.user.id);
        await sendOrderConfirmationEmail(user, order);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    // Clear cart after checkout (only for confirmed payments)
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    cart.coupons = [];
    cart.discountSummary = {
      totalDiscount: 0,
      couponsUsed: 0,
      storeBreakdown: {},
    };
    cart.lastUpdated = new Date();
    await cart.save();
  }

  // Return order ID for Stripe checkout session creation
  res.status(201).json({
    success: true,
    order,
    orderId: order._id, // For Stripe to link payment to order
  });
});