import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

// Helper function to generate payment number
const generatePaymentNumber = () => {
  const prefix = 'PAY';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Get all payments (Admin only)
export const getAllPayments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    method,
    userId,
    orderId,
    smartCartOrderId,
    search,
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (method) {
    query.method = method;
  }

  if (userId) {
    query.user = userId;
  }

  if (orderId) {
    query.order = orderId;
  }

  if (smartCartOrderId) {
    query.smartCartOrder = smartCartOrderId;
  }

  if (search) {
    // Search by payment number or transaction ID
    const paymentSearch = {
      $or: [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
      ],
    };

    // Also search by user name/email using aggregation
    const User = (await import('../models/User.js')).default;
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id').lean();

    // Build search query
    if (matchingUsers.length > 0) {
      query.$or = [
        paymentSearch,
        { user: { $in: matchingUsers.map(u => u._id) } },
      ];
    } else {
      // Only search payment fields if no user matches
      query.$or = paymentSearch.$or;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const payments = await Payment.find(query)
    .populate('user', 'name email phone')
    .populate('order', 'orderNumber')
    .populate('smartCartOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get single payment (Admin only, or user's own payment)
export const getPayment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('user', 'name email phone')
    .populate('order', 'orderNumber')
    .populate('smartCartOrder', 'orderNumber');

  if (!payment) {
    return next(new AppError('المدفوعة غير موجودة', 404));
  }

  // Check if user is admin or owns this payment
  if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user.id) {
    return next(new AppError('غير مصرح لك بالوصول إلى هذه المدفوعة', 403));
  }

  res.json({
    success: true,
    payment,
  });
});

// Get user's payments
export const getMyPayments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    method,
  } = req.query;

  const query = { user: req.user.id };

  if (status) {
    query.status = status;
  }

  if (method) {
    query.method = method;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const payments = await Payment.find(query)
    .populate('order', 'orderNumber')
    .populate('smartCartOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Create payment (usually called internally after order creation)
export const createPayment = catchAsync(async (req, res, next) => {
  const {
    orderId,
    smartCartOrderId,
    amount,
    currency = 'SAR',
    method,
    status = 'pending',
    transactionId,
    gatewayResponse,
    notes,
  } = req.body;

  // Validate that either orderId or smartCartOrderId is provided
  if (!orderId && !smartCartOrderId) {
    return next(new AppError('يجب تحديد رقم الطلب أو طلب السلة الذكية', 400));
  }

  if (!amount || amount <= 0) {
    return next(new AppError('المبلغ غير صحيح', 400));
  }

  if (!method) {
    return next(new AppError('طريقة الدفع مطلوبة', 400));
  }

  // Validate order exists
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('الطلب غير موجود', 404));
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('غير مصرح لك بإنشاء مدفوعة لهذا الطلب', 403));
    }
  }

  if (smartCartOrderId) {
    const order = await SmartCartOrder.findById(smartCartOrderId);
    if (!order) {
      return next(new AppError('الطلب غير موجود', 404));
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('غير مصرح لك بإنشاء مدفوعة لهذا الطلب', 403));
    }
  }

  // Check if payment already exists for this order
  const existingPayment = await Payment.findOne({
    $or: [
      { order: orderId },
      { smartCartOrder: smartCartOrderId },
    ],
  });

  if (existingPayment) {
    return next(new AppError('يوجد مدفوعة مسبقاً لهذا الطلب', 400));
  }

  const payment = await Payment.create({
    paymentNumber: generatePaymentNumber(),
    order: orderId || null,
    smartCartOrder: smartCartOrderId || null,
    user: req.user.id,
    amount,
    currency,
    method,
    status,
    transactionId,
    gatewayResponse,
    notes,
    paidAt: status === 'paid' ? new Date() : null,
  });

  await payment.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'order', select: 'orderNumber' },
    { path: 'smartCartOrder', select: 'orderNumber' },
  ]);

  res.status(201).json({
    success: true,
    payment,
  });
});

// Update payment status (Admin only, or for specific cases)
export const updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes, proofOfPayment } = req.body;

  if (!status || !['pending', 'paid', 'failed', 'refunded'].includes(status)) {
    return next(new AppError('حالة الدفع غير صحيحة', 400));
  }

  const payment = await Payment.findById(id).populate('user', 'name email');

  if (!payment) {
    return next(new AppError('المدفوعة غير موجودة', 404));
  }

  // Only admin can update payment status
  if (req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بتحديث حالة المدفوعة', 403));
  }

  const oldStatus = payment.status;

  // If status hasn't changed, just update notes/proof
  if (oldStatus === status) {
    if (notes) {
      payment.notes = notes;
    }
    if (proofOfPayment) {
      payment.proofOfPayment = proofOfPayment;
    }
    await payment.save();
    return res.json({
      success: true,
      payment,
      message: 'تم تحديث المدفوعة',
    });
  }

  // Handle wallet payment balance changes
  if (payment.method === 'wallet') {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: payment.user._id || payment.user });

    if (!wallet) {
      wallet = await Wallet.create({
        user: payment.user._id || payment.user,
        balance: 0,
        currency: payment.currency || 'SAR',
      });
    }

    // Scenario 1: Changing from 'refunded' to 'paid' - deduct from wallet
    if (oldStatus === 'refunded' && status === 'paid') {
      const amountToDeduct = payment.refundedAmount > 0 ? payment.refundedAmount : payment.amount;
      
      // Check if user has sufficient balance
      if (wallet.balance < amountToDeduct) {
        return next(new AppError(`رصيد المحفظة غير كافي (${wallet.balance} ${wallet.currency}) لخصم ${amountToDeduct} ${payment.currency || 'SAR'}`, 400));
      }

      // Deduct from wallet
      await wallet.addTransaction('payment', amountToDeduct, {
        description: `دفع مدفوعة #${payment.paymentNumber} (إعادة تفعيل)`,
        orderId: payment.order || undefined,
        smartCartOrderId: payment.smartCartOrder || undefined,
      });

      // Clear refund info since we're reverting it
      payment.refundedAmount = 0;
      payment.refundedAt = null;
      payment.refundReason = null;

      console.log(`✅ Deducted ${amountToDeduct} ${payment.currency || 'SAR'} from wallet (refunded → paid). New balance: ${wallet.balance}`);
    }

    // Scenario 2: Changing from 'paid' to 'refunded' - refund to wallet
    if (oldStatus === 'paid' && status === 'refunded') {
      // Only refund if not already refunded (avoid double refund)
      if (!payment.refundedAt) {
        const refundAmount = payment.amount;

        // Refund to wallet
        await wallet.addTransaction('refund', refundAmount, {
          description: `استرداد مدفوعة #${payment.paymentNumber}`,
          orderId: payment.order || undefined,
          smartCartOrderId: payment.smartCartOrder || undefined,
        });

        // Set refund info
        payment.refundedAmount = refundAmount;
        payment.refundedAt = new Date();
        payment.refundReason = notes || 'استرداد مطلوب من الإدارة';

        console.log(`✅ Refunded ${refundAmount} ${payment.currency || 'SAR'} to wallet (paid → refunded). New balance: ${wallet.balance}`);
      }
    }

    // Scenario 3: Changing from 'paid' or 'refunded' to 'failed' or 'pending' - no wallet change needed
    // Scenario 4: Changing from 'failed' or 'pending' to 'paid' - deduct from wallet (initial payment)
    if ((oldStatus === 'pending' || oldStatus === 'failed') && status === 'paid') {
      // Check if user has sufficient balance
      if (wallet.balance < payment.amount) {
        return next(new AppError(`رصيد المحفظة غير كافي (${wallet.balance} ${wallet.currency}) لدفع ${payment.amount} ${payment.currency || 'SAR'}`, 400));
      }

      // Deduct from wallet (initial payment)
      await wallet.addTransaction('payment', payment.amount, {
        description: `دفع مدفوعة #${payment.paymentNumber}`,
        orderId: payment.order || undefined,
        smartCartOrderId: payment.smartCartOrder || undefined,
      });

      console.log(`✅ Deducted ${payment.amount} ${payment.currency || 'SAR'} from wallet (${oldStatus} → paid). New balance: ${wallet.balance}`);
    }
  }

  // Update payment status
  payment.status = status;

  if (status === 'paid' && !payment.paidAt) {
    payment.paidAt = new Date();
  }

  if (notes) {
    payment.notes = notes;
  }

  if (proofOfPayment) {
    payment.proofOfPayment = proofOfPayment;
  }

  await payment.save();

  // إنشاء فاتورة تلقائياً عند تأكيد الدفع
  if (status === 'paid' && oldStatus !== 'paid' && payment.orderId) {
    const { createInvoiceForOrder } = await import('../utils/autoInvoice.js');
    await createInvoiceForOrder(payment.orderId, payment.user);
  }

  res.json({
    success: true,
    payment,
    message: `تم تحديث حالة المدفوعة من ${oldStatus} إلى ${status}`,
  });
});

// Process refund (Admin only)
export const processRefund = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { refundedAmount, refundReason } = req.body;

  const payment = await Payment.findById(id).populate('user', 'name email');

  if (!payment) {
    return next(new AppError('المدفوعة غير موجودة', 404));
  }

  // Only allow refund if payment is paid
  if (payment.status !== 'paid') {
    return next(new AppError('لا يمكن استرداد المدفوعة إلا إذا كانت مدفوعة', 400));
  }

  // Prevent double refund
  if (payment.refundedAt) {
    return next(new AppError('تم استرداد هذه المدفوعة مسبقاً', 400));
  }

  if (!refundedAmount || refundedAmount <= 0 || refundedAmount > payment.amount) {
    return next(new AppError('مبلغ الاسترداد غير صحيح', 400));
  }

  // Update payment status
  payment.status = 'refunded';
  payment.refundedAmount = refundedAmount;
  payment.refundedAt = new Date();
  payment.refundReason = refundReason || 'استرداد مطلوب من الإدارة';

  // If payment method is wallet, restore balance to user's wallet
  if (payment.method === 'wallet') {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: payment.user._id || payment.user });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        user: payment.user._id || payment.user,
        balance: 0,
        currency: payment.currency || 'SAR',
      });
    }

    // Add refund transaction to wallet (only if not already refunded)
    await wallet.addTransaction('refund', refundedAmount, {
      description: `استرداد مدفوعة #${payment.paymentNumber}`,
      orderId: payment.order || undefined,
      smartCartOrderId: payment.smartCartOrder || undefined,
    });

    console.log(`✅ Refunded ${refundedAmount} ${payment.currency || 'SAR'} to wallet. New balance: ${wallet.balance}`);
  }

  await payment.save();

  res.json({
    success: true,
    payment,
    message: payment.method === 'wallet' 
      ? `تم استرداد المدفوعة بنجاح وتم إعادة ${refundedAmount} ${payment.currency || 'SAR'} للمحفظة`
      : 'تم استرداد المدفوعة بنجاح',
  });
});

// Get payment statistics (Admin only)
export const getPaymentStats = catchAsync(async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue,
      paidRevenue,
      paymentsByMethod,
      recentPayments,
    ] = await Promise.all([
      Payment.countDocuments(query).catch(() => 0),
      Payment.countDocuments({ ...query, status: 'paid' }).catch(() => 0),
      Payment.countDocuments({ ...query, status: 'pending' }).catch(() => 0),
      Payment.countDocuments({ ...query, status: 'failed' }).catch(() => 0),
      Payment.countDocuments({ ...query, status: 'refunded' }).catch(() => 0),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).catch(() => []),
      Payment.aggregate([
        { $match: { ...query, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).catch(() => []),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]).catch(() => []),
      Payment.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .catch(() => []),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalPayments || 0,
        byStatus: {
          paid: paidPayments || 0,
          pending: pendingPayments || 0,
          failed: failedPayments || 0,
          refunded: refundedPayments || 0,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          paid: paidRevenue[0]?.total || 0,
        },
        byMethod: paymentsByMethod.reduce((acc, item) => {
          if (item && item._id) {
            acc[item._id] = {
              count: item.count || 0,
              total: item.total || 0,
            };
          }
          return acc;
        }, {}),
        recentPayments: recentPayments || [],
      },
    });
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    return next(error);
  }
});

