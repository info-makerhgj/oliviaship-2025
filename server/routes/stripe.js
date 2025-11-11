import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Webhook endpoint (no authentication, but Stripe signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const secretKey = settings.payment?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    const webhookSecret = settings.payment?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      return res.status(400).json({ message: 'Stripe غير مكوّن' });
    }

    const stripeInstance = new Stripe(secretKey);
    const sig = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature
    if (webhookSecret) {
      try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
    } else {
      // In development/test mode, parse without verification
      try {
        event = JSON.parse(req.body.toString());
      } catch (e) {
        // If already parsed or other format
        event = req.body;
      }
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Only process if payment was successful
      if (session.payment_status !== 'paid') {
        console.log('Payment not completed, status:', session.payment_status);
        return res.json({ received: true });
      }

      try {
        const Payment = (await import('../models/Payment.js')).default;
        const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
        const Cart = (await import('../models/Cart.js')).default;
        const User = (await import('../models/User.js')).default;
        const { generateOrderNumber } = await import('../utils/generateOrderNumber.js');
        const { calculateCost } = await import('../utils/calculateCost.js');
        const generatePaymentNumber = () => {
          const prefix = 'PAY';
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `${prefix}${timestamp}${random}`;
        };

        const userId = session.metadata?.userId;
        const cartId = session.metadata?.cartId;
        const expectedAmount = parseFloat(session.metadata?.amount || '0');

        if (!userId || !cartId) {
          console.error('Missing userId or cartId in session metadata');
          return res.json({ received: true });
        }

        // Check if order already exists for this payment
        const existingPayment = await Payment.findOne({
          transactionId: session.id,
        });

        if (existingPayment) {
          console.log('Payment already exists for this session');
          return res.json({ received: true });
        }

        // Get cart
        const cart = await Cart.findById(cartId).populate('coupons.couponId');
        
        if (!cart || cart.items.length === 0) {
          console.error('Cart not found or empty');
          return res.json({ received: true });
        }

        // Verify amount matches
        const paidAmount = session.amount_total / 100; // Convert from cents to SAR
        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          console.error(`Amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
          // Continue anyway, but log the issue
        }

        // Get settings for pricing calculation
        const Settings = (await import('../models/Settings.js')).default;
        const settings = await Settings.getSettings();

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
        };

        if (cart.discountSummary?.totalDiscount > 0) {
          finalPricing.totalCost -= cart.discountSummary.totalDiscount;
          finalPricing.totalInYER = Math.round(finalPricing.totalCost * (settings.pricing?.currencyRates?.SAR || 67));
        }

        // Create order
        const order = await SmartCartOrder.create({
          orderNumber: generateOrderNumber(),
          user: userId,
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
          delivery: {},
          status: 'pending',
          statusHistory: [{
            status: 'pending',
            note: 'تم إنشاء الطلب بعد الدفع الناجح عبر Stripe',
          }],
          metadata: {
            source: 'web',
            paymentMethod: 'stripe',
            cartSessionId: cart._id.toString(),
            stripeSessionId: session.id,
          },
        });

        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.totalOrders': 1 },
          $set: { 'stats.lastOrderDate': new Date() },
        });

        // Create payment record
        const payment = await Payment.create({
          paymentNumber: generatePaymentNumber(),
          smartCartOrder: order._id,
          user: userId,
          amount: paidAmount,
          currency: 'SAR',
          method: 'stripe',
          status: 'paid',
          transactionId: session.id,
          gateway: 'stripe',
          gatewayResponse: session,
          paidAt: new Date(),
          notes: `دفع ناجح عبر Stripe - Session: ${session.id}`,
        });

        // Clear cart after successful payment
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

        // Send confirmation email if enabled
        try {
          if (settings.notifications?.emailNotifications && settings.notifications?.notifyOnNewOrder) {
            const { sendOrderConfirmationEmail } = await import('../utils/emailService.js');
            const user = await User.findById(userId);
            if (user) {
              await sendOrderConfirmationEmail(user, order);
            }
          }
        } catch (error) {
          console.error('Email sending failed:', error);
        }

        console.log(`Order ${order.orderNumber} and Payment ${payment.paymentNumber} created successfully after Stripe payment`);
      } catch (error) {
        console.error('Error processing successful payment:', error);
        // Don't return error to Stripe, log it instead
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ message: error.message || 'Webhook processing failed' });
  }
});

// Initialize Stripe - will check settings dynamically
let stripe = null;

const initializeStripe = async () => {
  try {
    const settings = await Settings.getSettings();
    const secretKey = settings.payment?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      stripe = new Stripe(secretKey);
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
  return false;
};

// Initialize on module load
initializeStripe();

router.get('/publishable-key', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const publishableKey = settings.payment?.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '';
    res.json({
      success: true,
      key: publishableKey,
      enabled: settings.payment?.stripeEnabled || false,
    });
  } catch (error) {
    res.json({
      success: false,
      key: '',
      enabled: false,
    });
  }
});

router.get('/verify-session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const settings = await Settings.getSettings();
    const secretKey = settings.payment?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      return res.status(400).json({ message: 'Stripe غير مكوّن' });
    }

    const stripeInstance = new Stripe(secretKey);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      const Payment = (await import('../models/Payment.js')).default;
      let payment = await Payment.findOne({ transactionId: sessionId })
        .populate('smartCartOrder', 'orderNumber')
        .populate('order', 'orderNumber');

      // If payment record exists, order was created by webhook
      if (payment) {
        const orderId = payment.smartCartOrder?._id || payment.order?._id;
        return res.json({
          success: true,
          paid: true,
          orderId: orderId,
          orderNumber: payment.smartCartOrder?.orderNumber || payment.order?.orderNumber,
          createdBy: 'webhook',
        });
      }

      // Payment successful but no order created (webhook might have failed)
      // Create order as fallback
      try {
        const userId = session.metadata?.userId;
        const cartId = session.metadata?.cartId;
        const expectedAmount = parseFloat(session.metadata?.amount || '0');

        if (!userId || !cartId) {
          console.error('Missing userId or cartId in session metadata for fallback order creation');
          return res.json({
            success: true,
            paid: true,
            paymentStatus: 'paid',
            orderId: null,
            message: 'تم الدفع لكن لم يتم العثور على بيانات الطلب',
          });
        }

        const Cart = (await import('../models/Cart.js')).default;
        const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
        const User = (await import('../models/User.js')).default;
        const { generateOrderNumber } = await import('../utils/generateOrderNumber.js');
        const { calculateCost } = await import('../utils/calculateCost.js');
        
        const generatePaymentNumber = () => {
          const prefix = 'PAY';
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `${prefix}${timestamp}${random}`;
        };

        // Check if cart still exists
        const cart = await Cart.findById(cartId).populate('coupons.couponId');
        
        if (!cart || cart.items.length === 0) {
          // Cart was already cleared, try to find if order exists by session
          const existingOrder = await SmartCartOrder.findOne({ 
            'metadata.stripeSessionId': sessionId 
          });
          
          if (existingOrder) {
            // Order exists but payment wasn't linked
            payment = await Payment.create({
              paymentNumber: generatePaymentNumber(),
              smartCartOrder: existingOrder._id,
              user: userId,
              amount: session.amount_total / 100,
              currency: 'SAR',
              method: 'stripe',
              status: 'paid',
              transactionId: sessionId,
              gateway: 'stripe',
              gatewayResponse: session,
              paidAt: new Date(),
              notes: `دفع ناجح عبر Stripe (Fallback) - Session: ${sessionId}`,
            });

            return res.json({
              success: true,
              paid: true,
              orderId: existingOrder._id,
              orderNumber: existingOrder.orderNumber,
              createdBy: 'fallback',
            });
          }
          
          return res.json({
            success: true,
            paid: true,
            paymentStatus: 'paid',
            orderId: null,
            message: 'تم الدفع لكن السلة فارغة. قد يكون الطلب موجوداً بالفعل.',
          });
        }

        // Calculate pricing using new store-based calculation
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
        };

        if (cart.discountSummary?.totalDiscount > 0) {
          finalPricing.totalCost -= cart.discountSummary.totalDiscount;
          finalPricing.totalInYER = Math.round(finalPricing.totalCost * (settings.pricing?.currencyRates?.SAR || 67));
        }

        // Create order
        const order = await SmartCartOrder.create({
          orderNumber: generateOrderNumber(),
          user: userId,
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
          delivery: {},
          status: 'pending',
          statusHistory: [{
            status: 'pending',
            note: 'تم إنشاء الطلب بعد التحقق من الدفع الناجح (Fallback)',
          }],
          metadata: {
            source: 'web',
            paymentMethod: 'stripe',
            cartSessionId: cart._id.toString(),
            stripeSessionId: sessionId,
            createdBy: 'verify-endpoint-fallback',
          },
        });

        // Create payment record
        payment = await Payment.create({
          paymentNumber: generatePaymentNumber(),
          smartCartOrder: order._id,
          user: userId,
          amount: session.amount_total / 100,
          currency: 'SAR',
          method: 'stripe',
          status: 'paid',
          transactionId: sessionId,
          gateway: 'stripe',
          gatewayResponse: session,
          paidAt: new Date(),
          notes: `دفع ناجح عبر Stripe (Fallback) - Session: ${sessionId}`,
        });

        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.totalOrders': 1 },
          $set: { 'stats.lastOrderDate': new Date() },
        });

        // Clear cart
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

        console.log(`Fallback: Order ${order.orderNumber} and Payment ${payment.paymentNumber} created after verification`);

        return res.json({
          success: true,
          paid: true,
          orderId: order._id,
          orderNumber: order.orderNumber,
          createdBy: 'fallback',
        });
      } catch (fallbackError) {
        console.error('Fallback order creation failed:', fallbackError);
        return res.json({
          success: true,
          paid: true,
          paymentStatus: 'paid',
          orderId: null,
          message: 'تم الدفع لكن فشل في إنشاء الطلب. يرجى الاتصال بالدعم.',
          error: fallbackError.message,
        });
      }
    }

    // Payment not successful
    res.json({
      success: true,
      paid: false,
      paymentStatus: session.payment_status,
      message: session.payment_status === 'unpaid' ? 'لم يتم الدفع' : `حالة الدفع: ${session.payment_status}`,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'فشل في التحقق من حالة الدفع',
      error: error.message,
    });
  }
});

router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Check if Stripe is enabled in settings
    if (!settings.payment?.stripeEnabled) {
      return res.status(400).json({ message: 'Stripe غير مفعل في الإعدادات' });
    }

    // Initialize Stripe with settings
    const secretKey = settings.payment?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(400).json({ message: 'مفتاح Stripe غير موجود' });
    }

    const stripeInstance = new Stripe(secretKey);
    const siteName = settings.general?.siteName || 'منصة التوصيل العالمي';

    // Store cart ID in metadata instead of order ID
    // Order will be created only after successful payment via webhook
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'sar',
          product_data: {
            name: `طلب ${siteName}`,
            description: 'طلب منتجات من المتاجر العالمية',
          },
          unit_amount: Math.round(req.body.amount * 100), // Convert to halalah
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?payment=cancelled`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        cartId: req.body.cartId || null, // Store cart ID to create order later
        amount: req.body.amount?.toString() || '0', // Store amount for verification
      },
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(400).json({ message: error.message || 'فشل في إنشاء جلسة الدفع' });
  }
});

export default router;
