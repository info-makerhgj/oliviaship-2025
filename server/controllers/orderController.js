import Order from '../models/Order.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { calculateCost } from '../utils/calculateCost.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

export const createOrder = catchAsync(async (req, res, next) => {
  const { product, quantity = 1, color, size, delivery } = req.body;

  // Calculate pricing
  const pricing = await calculateCost(
    product.price,
    product.currency,
    quantity,
    product.store
  );

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user.id,
    product: {
      ...product,
      quantity,
      color,
      size,
    },
    pricing,
    delivery,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      note: 'تم إنشاء الطلب',
    }],
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { 'stats.totalOrders': 1 },
    $set: { 'stats.lastOrderDate': new Date() },
  });

  // Create payment record (assuming cash on delivery for single orders)
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
      order: order._id,
      user: req.user.id,
      amount: pricing.totalCost,
      currency: pricing.currency || 'SAR',
      method: 'cash_on_delivery',
      status: 'pending',
      notes: 'دفع عند الاستلام',
    });
  } catch (error) {
    console.error('Failed to create payment record:', error);
    // Don't fail the order creation if payment record creation fails
  }

  // Send confirmation email (only if enabled in settings)
  try {
    const Settings = (await import('../models/Settings.js')).default;
    const settings = await Settings.getSettings();
    if (settings.notifications?.emailNotifications && settings.notifications?.notifyOnNewOrder) {
      await sendOrderConfirmationEmail(req.user, order);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
  }

  res.status(201).json({
    success: true,
    order,
  });
});

export const getOrders = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { isDeleted: false };

  // If not admin, only show user's orders
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email');

  if (!order) {
    return res.status(404).json({
      message: 'الطلب غير موجود',
    });
  }

  // Check if user has access
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      message: 'ليس لديك صلاحية لعرض هذا الطلب',
    });
  }

  res.json({
    success: true,
    order,
  });
});

export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id).populate('user');

  if (!order) {
    return res.status(404).json({
      message: 'الطلب غير موجود',
    });
  }

  order.status = status;
  order.statusHistory.push({
    status,
    note,
    updatedBy: req.user.id,
  });

  await order.save();

  // Send notification email if enabled
  try {
    const Settings = (await import('../models/Settings.js')).default;
    const settings = await Settings.getSettings();
    if (settings.notifications?.emailNotifications && settings.notifications?.notifyOnStatusChange) {
      const { sendEmail } = await import('../utils/emailService.js');
      await sendEmail({
        email: order.user.email,
        subject: `تحديث حالة طلبك #${order.orderNumber}`,
        html: `
          <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>مرحباً ${order.user.name}</h2>
            <p>تم تحديث حالة طلبك #${order.orderNumber}</p>
            <p><strong>الحالة الجديدة:</strong> ${status}</p>
            ${note ? `<p><strong>ملاحظة:</strong> ${note}</p>` : ''}
          </div>
        `,
      });
    }
  } catch (error) {
    console.error('Notification email failed:', error);
  }

  res.json({
    success: true,
    order,
  });
});

export const trackOrder = catchAsync(async (req, res, next) => {
  const { orderNumber } = req.params;
  
  if (!orderNumber || orderNumber.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'الرجاء إدخال رقم الطلب',
    });
  }

  const trimmedOrderNumber = orderNumber.trim();

  // Try to find in Order model first
  let order = await Order.findOne({ 
    orderNumber: trimmedOrderNumber,
    isDeleted: { $ne: true }
  }).populate('delivery.pickupPoint', 'name address phone');

  // If not found, try SmartCartOrder
  if (!order) {
    order = await SmartCartOrder.findOne({ 
      orderNumber: trimmedOrderNumber,
      isDeleted: { $ne: true }
    }).populate('delivery.pickupPoint', 'name address phone');

    // If SmartCartOrder found, format it like Order for consistent response
    if (order) {
      // Get currency from pricing or default to SAR
      const currency = order.pricing?.currency || 'SAR';
      
      // Calculate exchange rate if totalInYER exists
      const exchangeRate = order.pricing?.totalInYER && order.pricing?.totalCost 
        ? Math.round(order.pricing.totalInYER / order.pricing.totalCost)
        : null;

      return res.json({
        success: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          statusHistory: order.statusHistory || [],
          products: order.products || [], // Multiple products for SmartCartOrder
          product: order.products?.[0] ? {
            name: order.products[0].name,
            price: order.products[0].price,
            currency: order.products[0].currency,
            image: order.products[0].image,
            quantity: order.products[0].quantity,
            store: order.products[0].store,
            url: order.products[0].url,
          } : null,
          isCartOrder: true, // Flag to indicate it's a cart order
          pricing: {
            ...order.pricing,
            currency: currency,
            exchangeRate: exchangeRate,
          },
          delivery: {
            type: order.delivery?.type,
            address: order.delivery?.address,
            pickupPoint: order.delivery?.pickupPoint,
            trackingNumber: order.delivery?.trackingNumber,
            estimatedDelivery: order.delivery?.estimatedDelivery,
            deliveryNotes: order.delivery?.deliveryNotes,
            readyForPickup: order.delivery?.readyForPickup,
          },
          payment: {
            status: order.payment?.status,
            method: order.payment?.method,
          },
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
    }
  }

  // If still not found
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'الطلب غير موجود. يرجى التحقق من رقم الطلب والمحاولة مرة أخرى.',
    });
  }

  // Format regular Order response
  // Get currency from pricing or product or default to SAR
  const currency = order.pricing?.currency || order.product?.currency || 'SAR';
  
  // Calculate exchange rate if totalInYER exists
  const exchangeRate = order.pricing?.totalInYER && order.pricing?.totalCost 
    ? Math.round(order.pricing.totalInYER / order.pricing.totalCost)
    : null;

  res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory || [],
      product: {
        name: order.product?.name,
        price: order.product?.price,
        currency: order.product?.currency,
        image: order.product?.image,
        quantity: order.product?.quantity,
        store: order.product?.store,
        url: order.product?.url,
      },
      isCartOrder: false,
      pricing: {
        ...order.pricing,
        currency: currency,
        exchangeRate: exchangeRate,
      },
      delivery: {
        type: order.delivery?.type,
        address: order.delivery?.address,
        pickupPoint: order.delivery?.pickupPoint,
        trackingNumber: order.delivery?.trackingNumber,
        estimatedDelivery: order.delivery?.estimatedDelivery,
        deliveryNotes: order.delivery?.deliveryNotes,
        readyForPickup: order.delivery?.readyForPickup,
      },
      payment: {
        status: order.payment?.status,
        method: order.payment?.method,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  });
});

// @desc    Assign order to pickup point (Admin only)
// @route   PUT /api/orders/:id/assign-point
// @access  Private (Admin)
export const assignOrderToPoint = catchAsync(async (req, res, next) => {
  const { pointId } = req.body;
  
  if (!pointId) {
    return res.status(400).json({
      message: 'يرجى تحديد النقطة',
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: 'الطلب غير موجود',
    });
  }

  // Import PointOfSale model
  const PointOfSale = (await import('../models/PointOfSale.js')).default;
  const point = await PointOfSale.findById(pointId);

  if (!point) {
    return res.status(404).json({
      message: 'النقطة غير موجودة',
    });
  }

  // Import mongoose for ObjectId
  const mongoose = await import('mongoose');
  const pointObjectId = new mongoose.Types.ObjectId(pointId);

  // Assign to point - use ObjectId to ensure proper reference
  order.delivery.type = 'pickup_point';
  order.delivery.pickupPoint = pointObjectId;
  order.delivery.readyForPickup = false;
  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: `تم توجيه الطلب إلى نقطة الاستلام: ${point.name}`,
    updatedBy: req.user.id,
  });

  await order.save();

  console.log('✅ Order assigned to point:', {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    pointId: pointId,
    pointObjectId: pointObjectId.toString(),
    savedPickupPoint: order.delivery.pickupPoint?.toString(),
    savedType: typeof order.delivery.pickupPoint,
  });

  res.json({
    success: true,
    message: `تم توجيه الطلب إلى النقطة: ${point.name}`,
    order,
  });
});
