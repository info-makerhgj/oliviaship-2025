import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import cashPayService from '../services/cashPayService.js';

/**
 * Create Cash Pay payment request
 * إنشاء طلب دفع عبر Cash Pay
 */
export const createCashPayPayment = catchAsync(async (req, res, next) => {
  const { orderId, smartCartOrderId } = req.body;

  // التحقق من وجود order
  if (!orderId && !smartCartOrderId) {
    return next(new AppError('يجب تحديد رقم الطلب', 400));
  }

  let order = null;
  let orderType = null;
  
  if (orderId) {
    order = await Order.findById(orderId).populate('user', 'name email phone');
    orderType = 'order';
    if (!order) {
      return next(new AppError('الطلب غير موجود', 404));
    }
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('غير مصرح لك بإنشاء دفعة لهذا الطلب', 403));
    }
  } else {
    order = await SmartCartOrder.findById(smartCartOrderId).populate('user', 'name email phone');
    orderType = 'smartCartOrder';
    if (!order) {
      return next(new AppError('الطلب غير موجود', 404));
    }
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('غير مصرح لك بإنشاء دفعة لهذا الطلب', 403));
    }
  }

  // التحقق من عدم وجود دفعة مسبقة
  const existingPayment = await Payment.findOne({
    $or: [
      { order: orderId },
      { smartCartOrder: smartCartOrderId },
    ],
  });

  if (existingPayment && existingPayment.status === 'paid') {
    return next(new AppError('تم الدفع لهذا الطلب مسبقاً', 400));
  }

  // حساب المبلغ الإجمالي
  const amount = order.totalAmount || order.total;
  const currency = order.currency || 'YER'; // Cash Pay يستخدم الريال اليمني عادة

  // بناء URLs للعودة
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnUrl = `${baseUrl}/payment/cashpay/callback?orderId=${orderId || smartCartOrderId}`;
  const cancelUrl = `${baseUrl}/payment/cashpay/cancel?orderId=${orderId || smartCartOrderId}`;

  try {
    // الحصول على إعدادات Cash Pay من قاعدة البيانات
    const settings = await Settings.getSettings();
    if (!settings.payment?.cashPayEnabled) {
      return next(new AppError('خدمة Cash Pay غير مفعلة. يرجى تفعيلها من الإعدادات.', 400));
    }

    const cashPayConfig = {
      apiKey: settings.payment.cashPayApiKey,
      apiSecret: settings.payment.cashPayApiSecret,
      merchantId: settings.payment.cashPayMerchantId,
      baseUrl: settings.payment.cashPayBaseUrl || 'https://api.cash.com.ye',
    };

    // التحقق من وجود الإعدادات المطلوبة
    if (!cashPayConfig.apiKey || !cashPayConfig.apiSecret || !cashPayConfig.merchantId) {
      return next(new AppError('إعدادات Cash Pay غير مكتملة. يرجى إكمال الإعدادات من صفحة الإعدادات.', 400));
    }

    // إنشاء طلب دفع في Cash Pay
    const cashPayResponse = await cashPayService.createPaymentRequest({
      amount,
      currency,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerPhone: order.user.phone,
      customerEmail: order.user.email,
      description: `دفعة للطلب رقم ${order.orderNumber}`,
      returnUrl,
      cancelUrl,
    }, cashPayConfig);

    // إنشاء سجل الدفعة في قاعدة البيانات
    const payment = await Payment.create({
      paymentNumber: `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: orderId || null,
      smartCartOrder: smartCartOrderId || null,
      user: order.user._id,
      amount,
      currency,
      method: 'cash_pay',
      status: 'pending',
      gateway: 'cash_pay',
      transactionId: cashPayResponse.transactionId,
      gatewayResponse: cashPayResponse.data,
    });

    res.status(200).json({
      success: true,
      message: 'تم إنشاء طلب الدفع بنجاح',
      payment: {
        id: payment._id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
      paymentUrl: cashPayResponse.paymentUrl,
      transactionId: cashPayResponse.transactionId,
    });
  } catch (error) {
    // If payment creation failed and order was created, mark order as cancelled
    // The order will remain in pending status but user can retry
    console.error('Cash Pay payment creation failed:', error);
    
    // Try to update order status to indicate payment failed
    try {
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          status: 'cancelled',
          $push: {
            statusHistory: {
              status: 'cancelled',
              note: 'فشل في إنشاء دفعة Cash Pay - يمكن إعادة المحاولة',
            },
          },
        });
      } else if (smartCartOrderId) {
        await SmartCartOrder.findByIdAndUpdate(smartCartOrderId, {
          status: 'cancelled',
          $push: {
            statusHistory: {
              status: 'cancelled',
              note: 'فشل في إنشاء دفعة Cash Pay - يمكن إعادة المحاولة',
            },
          },
        });
      }
    } catch (cleanupError) {
      console.error('Failed to update order status after payment failure:', cleanupError);
    }
    
    return next(new AppError(error.message || 'حدث خطأ في إنشاء طلب الدفع', 500));
  }
});

/**
 * Handle Cash Pay callback (return URL)
 * معالجة استدعاء العودة من Cash Pay
 */
export const handleCashPayCallback = catchAsync(async (req, res, next) => {
  const { transactionId, orderId, smartCartOrderId } = req.query;

  if (!transactionId) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=missing_transaction_id`);
  }

  try {
    // الحصول على إعدادات Cash Pay من قاعدة البيانات
    const settings = await Settings.getSettings();
    if (!settings.payment?.cashPayEnabled) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=cashpay_disabled`);
    }

    const cashPayConfig = {
      apiKey: settings.payment.cashPayApiKey,
      apiSecret: settings.payment.cashPayApiSecret,
      merchantId: settings.payment.cashPayMerchantId,
      baseUrl: settings.payment.cashPayBaseUrl || 'https://api.cash.com.ye',
    };

    // التحقق من حالة الدفعة من Cash Pay
    const statusResponse = await cashPayService.verifyPaymentStatus(transactionId, cashPayConfig);

    // البحث عن الدفعة في قاعدة البيانات
    const payment = await Payment.findOne({
      transactionId,
      $or: [
        { order: orderId },
        { smartCartOrder: smartCartOrderId },
      ],
    });

    if (!payment) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=payment_not_found`);
    }

    // تحديث حالة الدفعة
    if (statusResponse.status === 'paid' && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verification: statusResponse.data,
      };
      await payment.save();

      // تحديث حالة الطلب
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      } else if (payment.smartCartOrder) {
        const order = await SmartCartOrder.findById(payment.smartCartOrder);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      }
    }

    // إعادة توجيه حسب الحالة
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (statusResponse.status === 'paid') {
      return res.redirect(`${frontendUrl}/payment/success?paymentId=${payment._id}`);
    } else {
      return res.redirect(`${frontendUrl}/payment/failed?transactionId=${transactionId}`);
    }
  } catch (error) {
    console.error('Cash Pay Callback Error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=verification_failed`);
  }
});

/**
 * Handle Cash Pay webhook
 * معالجة webhook من Cash Pay
 */
export const handleCashPayWebhook = catchAsync(async (req, res, next) => {
  try {
    // الحصول على إعدادات Cash Pay من قاعدة البيانات
    const settings = await Settings.getSettings();
    if (!settings.payment?.cashPayEnabled) {
      return res.status(400).json({
        success: false,
        message: 'خدمة Cash Pay غير مفعلة',
      });
    }

    const cashPayConfig = {
      apiKey: settings.payment.cashPayApiKey,
      apiSecret: settings.payment.cashPayApiSecret,
      merchantId: settings.payment.cashPayMerchantId,
      baseUrl: settings.payment.cashPayBaseUrl || 'https://api.cash.com.ye',
    };

    // التحقق من webhook
    const webhookData = await cashPayService.handleWebhook(req.body, cashPayConfig);

    // البحث عن الدفعة
    const payment = await Payment.findOne({
      transactionId: webhookData.transactionId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    // تحديث حالة الدفعة
    if (webhookData.status === 'paid' && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        webhook: webhookData.data,
      };
      await payment.save();

      // تحديث حالة الطلب
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      } else if (payment.smartCartOrder) {
        const order = await SmartCartOrder.findById(payment.smartCartOrder);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      }
    } else if (webhookData.status === 'failed' && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        webhook: webhookData.data,
      };
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'تم معالجة webhook بنجاح',
    });
  } catch (error) {
    console.error('Cash Pay Webhook Error:', error);
    return next(new AppError(error.message || 'فشل معالجة webhook', 400));
  }
});

/**
 * Verify payment status
 * التحقق من حالة الدفعة
 */
export const verifyCashPayPayment = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  
  if (!payment) {
    return next(new AppError('الدفعة غير موجودة', 404));
  }

  // التحقق من أن المستخدم صاحب الطلب أو admin
  if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بالوصول لهذه الدفعة', 403));
  }

  if (!payment.transactionId) {
    return res.status(200).json({
      success: true,
      payment: {
        ...payment.toObject(),
        status: payment.status,
      },
      verified: false,
      message: 'لا يوجد رقم معاملة للتحقق',
    });
  }

  try {
    // الحصول على إعدادات Cash Pay من قاعدة البيانات
    const settings = await Settings.getSettings();
    if (!settings.payment?.cashPayEnabled) {
      return next(new AppError('خدمة Cash Pay غير مفعلة', 400));
    }

    const cashPayConfig = {
      apiKey: settings.payment.cashPayApiKey,
      apiSecret: settings.payment.cashPayApiSecret,
      merchantId: settings.payment.cashPayMerchantId,
      baseUrl: settings.payment.cashPayBaseUrl || 'https://api.cash.com.ye',
    };

    // التحقق من Cash Pay
    const statusResponse = await cashPayService.verifyPaymentStatus(payment.transactionId, cashPayConfig);

    // تحديث حالة الدفعة إذا تغيرت
    if (statusResponse.status === 'paid' && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verification: statusResponse.data,
      };
      await payment.save();
    } else if (statusResponse.status === 'failed' && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verification: statusResponse.data,
      };
      await payment.save();
    }

    await payment.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'order', select: 'orderNumber' },
      { path: 'smartCartOrder', select: 'orderNumber' },
    ]);

    res.status(200).json({
      success: true,
      payment,
      verified: true,
      cashPayStatus: statusResponse.status,
    });
  } catch (error) {
    return next(new AppError(error.message || 'فشل التحقق من حالة الدفعة', 500));
  }
});

/**
 * Refund payment through Cash Pay
 * إرجاع دفعة عبر Cash Pay
 */
export const refundCashPayPayment = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  // Admin only
  if (req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  const payment = await Payment.findById(paymentId);
  
  if (!payment) {
    return next(new AppError('الدفعة غير موجودة', 404));
  }

  if (payment.method !== 'cash_pay') {
    return next(new AppError('هذه الدفعة ليست عبر Cash Pay', 400));
  }

  if (payment.status !== 'paid') {
    return next(new AppError('يمكن إرجاع الدفعات المدفوعة فقط', 400));
  }

  if (!payment.transactionId) {
    return next(new AppError('لا يوجد رقم معاملة لإرجاع الدفعة', 400));
  }

  try {
    // الحصول على إعدادات Cash Pay من قاعدة البيانات
    const settings = await Settings.getSettings();
    if (!settings.payment?.cashPayEnabled) {
      return next(new AppError('خدمة Cash Pay غير مفعلة', 400));
    }

    const cashPayConfig = {
      apiKey: settings.payment.cashPayApiKey,
      apiSecret: settings.payment.cashPayApiSecret,
      merchantId: settings.payment.cashPayMerchantId,
      baseUrl: settings.payment.cashPayBaseUrl || 'https://api.cash.com.ye',
    };

    // إرجاع الدفعة عبر Cash Pay
    const refundAmount = amount || payment.amount;
    const refundResponse = await cashPayService.refundPayment(
      payment.transactionId,
      refundAmount === payment.amount ? null : refundAmount, // null = full refund
      reason || 'طلب إرجاع من الإدارة',
      cashPayConfig
    );

    // تحديث حالة الدفعة
    payment.status = 'refunded';
    payment.refundedAmount = refundAmount;
    payment.refundedAt = new Date();
    payment.refundReason = reason || 'إرجاع من الإدارة';
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      refund: refundResponse.data,
    };
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'تم إرجاع الدفعة بنجاح',
      payment,
      refund: {
        refundId: refundResponse.refundId,
        amount: refundAmount,
        status: refundResponse.status,
      },
    });
  } catch (error) {
    return next(new AppError(error.message || 'فشل إرجاع الدفعة', 500));
  }
});

