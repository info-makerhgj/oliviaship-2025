import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import Agent from '../models/Agent.js';
import AgentCustomer from '../models/AgentCustomer.js';
import AgentOrder from '../models/AgentOrder.js';
import AgentCommission from '../models/AgentCommission.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import { calculateCost } from '../utils/calculateCost.js';
import Settings from '../models/Settings.js';

/**
 * Create order for customer
 * إنشاء طلب للعميل
 */
export const createOrder = catchAsync(async (req, res, next) => {
  const { agentId } = req.params;
  const { customerId, products, delivery, notes } = req.body;

  // Verify agent
  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  // Verify customer
  const customer = await AgentCustomer.findOne({
    _id: customerId,
    agent: agentId,
  });

  if (!customer) {
    return next(new AppError('العميل غير موجود', 404));
  }

  if (!products || products.length === 0) {
    return next(new AppError('يجب إضافة منتجات على الأقل', 400));
  }

  // Get settings
  const settings = await Settings.getSettings();

  // Calculate pricing
  let totalProductPrice = 0;
  let totalQuantity = 0;
  
  products.forEach(item => {
    totalProductPrice += (item.price * item.quantity);
    totalQuantity += item.quantity;
  });

  const firstItem = products[0];
  const store = firstItem.store || 'other';
  const currency = firstItem.currency || 'SAR';

  const pricing = await calculateCost(
    totalProductPrice / totalQuantity,
    currency,
    totalQuantity,
    store
  );

  const productPriceRatio = totalProductPrice / pricing.productPrice;
  const shippingMultiplier = Math.ceil(products.length / 3);
  
  let shippingCost = pricing.shippingCost * shippingMultiplier;
  const freeShippingThreshold = settings.shipping?.freeShippingThreshold;
  if (freeShippingThreshold && totalProductPrice >= freeShippingThreshold) {
    shippingCost = 0;
  }

  const finalPricing = {
    subtotal: totalProductPrice,
    productPrice: totalProductPrice,
    shippingCost: shippingCost,
    commission: pricing.commission * productPriceRatio,
    customsFees: pricing.customsFees * productPriceRatio,
    totalDiscount: 0,
    totalCost: 0,
  };

  finalPricing.totalCost =
    finalPricing.productPrice +
    finalPricing.shippingCost +
    finalPricing.commission +
    finalPricing.customsFees;

  const exchangeRate = settings?.pricing?.currencyRates?.SAR || 67;
  finalPricing.totalInYER = Math.round(finalPricing.totalCost * exchangeRate);

  // Create order
  const orderNumber = await AgentOrder.generateOrderNumber();
  const order = await AgentOrder.create({
    agent: agentId,
    customer: customerId,
    orderNumber,
    products,
    pricing: finalPricing,
    delivery: delivery || { type: 'home', address: customer.address },
    status: 'draft',
    notes,
    statusHistory: [{
      status: 'draft',
      note: 'تم إنشاء الطلب كمسودة',
    }],
  });

  // Calculate commission
  await order.calculateCommission();

  // Update customer stats
  await customer.updateStats();

  // Update agent stats
  await agent.updateStats();

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الطلب بنجاح',
    order,
  });
});

/**
 * Get all orders for agent
 * الحصول على جميع طلبات الوكيل
 */
export const getOrders = catchAsync(async (req, res, next) => {
  const { agentId } = req.params;
  const {
    page = 1,
    limit = 20,
    status,
    customerId,
    customerPaymentStatus,
    agentPaymentStatus,
  } = req.query;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بالوصول', 403));
  }

  const query = { agent: agentId };

  if (status) {
    query.status = status;
  }
  if (customerId) {
    query.customer = customerId;
  }
  if (customerPaymentStatus) {
    query.customerPaymentStatus = customerPaymentStatus;
  }
  if (agentPaymentStatus) {
    query.agentPaymentStatus = agentPaymentStatus;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await AgentOrder.find(query)
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AgentOrder.countDocuments(query);

  res.json({
    success: true,
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Get order by ID
 * الحصول على طلب محدد
 */
export const getOrder = catchAsync(async (req, res, next) => {
  const { agentId, orderId } = req.params;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بالوصول', 403));
  }

  const order = await AgentOrder.findOne({
    _id: orderId,
    agent: agentId,
  }).populate('customer').populate('smartCartOrder').populate('order');

  if (!order) {
    return next(new AppError('الطلب غير موجود', 404));
  }

  res.json({
    success: true,
    order,
  });
});

/**
 * Update order status
 * تحديث حالة الطلب
 */
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { agentId, orderId } = req.params;
  const { status, note } = req.body;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  const order = await AgentOrder.findOne({
    _id: orderId,
    agent: agentId,
  });

  if (!order) {
    return next(new AppError('الطلب غير موجود', 404));
  }

  // Check authorization - agent can only update their own orders, admin can update any
  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  if (status) {
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `تم تحديث الحالة إلى ${status}`,
      updatedBy: req.user.id,
    });
  }

  await order.save();

  res.json({
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    order,
  });
});

/**
 * Mark customer payment as received
 * تسجيل دفع العميل للوكيل
 */
export const markCustomerPayment = catchAsync(async (req, res, next) => {
  const { agentId, orderId } = req.params;
  const { paymentMethod, paymentDate, notes } = req.body;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  const order = await AgentOrder.findOne({
    _id: orderId,
    agent: agentId,
  });

  if (!order) {
    return next(new AppError('الطلب غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  order.customerPaymentStatus = 'paid';
  order.customerPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
  order.customerPaymentMethod = paymentMethod;
  order.customerPaymentNotes = notes;

  await order.save();

  res.json({
    success: true,
    message: 'تم تسجيل دفع العميل بنجاح',
    order,
  });
});

/**
 * Submit order to platform (create SmartCartOrder)
 * إرسال الطلب للمنصة
 */
export const submitOrder = catchAsync(async (req, res, next) => {
  const { agentId, orderId } = req.params;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  const order = await AgentOrder.findOne({
    _id: orderId,
    agent: agentId,
  }).populate('customer');

  if (!order) {
    return next(new AppError('الطلب غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  // Check if order already has a SmartCartOrder
  if (order.smartCartOrder) {
    const existingOrder = await SmartCartOrder.findById(order.smartCartOrder);
    if (existingOrder) {
      return res.json({
        success: true,
        message: 'الطلب تم إرساله مسبقاً للمنصة',
        order,
        smartCartOrder: {
          id: existingOrder._id,
          orderNumber: existingOrder.orderNumber,
        },
      });
    }
    // If reference exists but order doesn't, clear it
    order.smartCartOrder = undefined;
  }

  // Only allow draft or pending orders to be submitted
  if (order.status !== 'draft' && order.status !== 'pending') {
    // If status is not draft/pending but no smartCartOrder exists, try to create one
    if (!order.smartCartOrder) {
      console.log(`Order ${order._id} has status ${order.status} but no smartCartOrder. Creating one...`);
      // Continue with creation
    } else {
      return next(new AppError('الطلب تم إرساله مسبقاً', 400));
    }
  }

  // Create SmartCartOrder
  let smartCartOrder;
  try {
    const { generateOrderNumber } = await import('../utils/generateOrderNumber.js').catch(() => ({
      generateOrderNumber: () => {
        const prefix = 'YM';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
      }
    }));
    
    smartCartOrder = await SmartCartOrder.create({
      orderNumber: generateOrderNumber(),
      user: agent.user, // Agent's user account
      products: order.products || [],
      pricing: order.pricing || {},
      delivery: order.delivery || {},
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: `طلب من وكيل ${agent.agentNumber} - عميل: ${order.customer?.name || 'غير محدد'}`,
        timestamp: new Date(),
      }],
      metadata: {
        source: 'agent',
        agentId: agent._id,
        agentOrderId: order._id,
        customerName: order.customer?.name || '',
        customerPhone: order.customer?.phone || '',
      },
    });

    // Link order to SmartCartOrder
    order.smartCartOrder = smartCartOrder._id;
    order.status = 'pending';
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: 'pending',
      note: 'تم إرسال الطلب للمنصة',
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    await order.save();
  } catch (error) {
    console.error('Error creating SmartCartOrder:', error);
    return next(new AppError(`فشل في إنشاء الطلب في المنصة: ${error.message}`, 500));
  }

  // Calculate and create commission
  const commission = await AgentCommission.create({
    agent: agentId,
    agentOrder: order._id,
    orderNumber: order.orderNumber,
    amount: order.commission,
    commissionRate: agent.commissionRate,
    orderAmount: order.pricing.totalCost,
    status: 'calculated',
    calculatedAt: new Date(),
  });

  // Update agent earnings
  agent.totalCommissions += order.commission;
  agent.pendingAmount += (order.pricing.totalCost - order.commission);
  await agent.save();

  res.json({
    success: true,
    message: 'تم إرسال الطلب للمنصة بنجاح',
    order,
    smartCartOrder: {
      id: smartCartOrder._id,
      orderNumber: smartCartOrder.orderNumber,
    },
    commission: {
      id: commission._id,
      amount: commission.amount,
    },
  });
});

/**
 * Mark agent payment to platform
 * تسجيل دفع الوكيل للمنصة
 */
export const markAgentPayment = catchAsync(async (req, res, next) => {
  const { agentId, orderId } = req.params;
  const {
    paymentMethod,
    paymentDate,
    transactionId,
    proofUrl,
    notes,
  } = req.body;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  const order = await AgentOrder.findOne({
    _id: orderId,
    agent: agentId,
  });

  if (!order) {
    return next(new AppError('الطلب غير موجود', 404));
  }

  // Only agent themselves or admin can mark payment
  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  if (order.agentPaymentStatus === 'paid') {
    return next(new AppError('تم تسجيل الدفع مسبقاً', 400));
  }

  // Handle wallet payment
  if (paymentMethod === 'wallet') {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: agent.user });
    
    if (!wallet) {
      return next(new AppError('المحفظة غير موجودة', 404));
    }

    const amountToPay = order.pricing.totalCost - order.commission;
    
    if (wallet.balance < amountToPay) {
      return next(new AppError(`رصيد المحفظة غير كافي. الرصيد المتاح: ${wallet.balance} ${wallet.currency}`, 400));
    }

    // Deduct from wallet
    await wallet.addTransaction('payment', amountToPay, {
      description: `دفع طلب وكيل #${order.orderNumber}`,
      agentOrderId: order._id,
    });

    // Reload wallet to get updated balance
    await wallet.populate('user', 'name email');
  }

  order.agentPaymentStatus = 'paid';
  order.agentPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
  order.agentPaymentMethod = paymentMethod;
  order.agentPaymentTransactionId = transactionId;
  order.agentPaymentProof = proofUrl;
  order.agentPaymentNotes = notes;

  await order.save();

  // Update agent stats
  const paidAmount = order.pricing.totalCost - order.commission;
  agent.totalPaidToPlatform += paidAmount;
  agent.pendingAmount = Math.max(0, agent.pendingAmount - paidAmount);
  await agent.save();

  // Update commission status if payment is confirmed by admin
  if (req.user.role === 'admin') {
    const commission = await AgentCommission.findOne({ agentOrder: orderId });
    if (commission) {
      commission.status = 'paid';
      commission.paidAt = new Date();
      commission.paidBy = req.user.id;
      commission.paymentMethod = paymentMethod;
      await commission.save();

      agent.totalEarnings += commission.amount;
      await agent.save();
    }
  }

  res.json({
    success: true,
    message: 'تم تسجيل دفع الوكيل بنجاح',
    order,
  });
});

/**
 * Batch submit orders
 * إرسال عدة طلبات دفعة واحدة
 */
export const batchSubmitOrders = catchAsync(async (req, res, next) => {
  const { agentId } = req.params;
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return next(new AppError('يجب تحديد الطلبات المراد إرسالها', 400));
  }

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  const results = [];
  const errors = [];

  for (const orderId of orderIds) {
    try {
      const order = await AgentOrder.findOne({
        _id: orderId,
        agent: agentId,
      }).populate('customer');

      if (!order) {
        errors.push({ orderId, error: 'الطلب غير موجود' });
        continue;
      }

      // Check if order already has a SmartCartOrder
      if (order.smartCartOrder) {
        const existingOrder = await SmartCartOrder.findById(order.smartCartOrder);
        if (existingOrder) {
          results.push({ 
            orderId, 
            success: true, 
            smartCartOrderId: existingOrder._id,
            message: 'الطلب تم إرساله مسبقاً'
          });
          continue;
        }
        // If reference exists but order doesn't, clear it
        order.smartCartOrder = undefined;
      }

      // Only allow draft or pending orders to be submitted (unless no smartCartOrder exists)
      if (order.status !== 'draft' && order.status !== 'pending' && order.smartCartOrder) {
        errors.push({ orderId, error: 'الطلب تم إرساله مسبقاً' });
        continue;
      }

      // Submit order (reuse submitOrder logic)
      let smartCartOrder;
      try {
        const { generateOrderNumber } = await import('../utils/generateOrderNumber.js').catch(() => ({
          generateOrderNumber: () => {
            const prefix = 'YM';
            const timestamp = Date.now().toString().slice(-8);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `${prefix}${timestamp}${random}`;
          }
        }));
        
        smartCartOrder = await SmartCartOrder.create({
          orderNumber: generateOrderNumber(),
          user: agent.user,
          products: order.products || [],
          pricing: order.pricing || {},
          delivery: order.delivery || {},
          status: 'pending',
          statusHistory: [{
            status: 'pending',
            note: `طلب من وكيل ${agent.agentNumber} - عميل: ${order.customer?.name || 'غير محدد'}`,
            timestamp: new Date(),
          }],
          metadata: {
            source: 'agent',
            agentId: agent._id,
            agentOrderId: order._id,
            customerName: order.customer?.name || '',
            customerPhone: order.customer?.phone || '',
          },
        });

        order.smartCartOrder = smartCartOrder._id;
        order.status = 'pending';
        if (!order.statusHistory) {
          order.statusHistory = [];
        }
        order.statusHistory.push({
          status: 'pending',
          note: 'تم إرسال الطلب للمنصة',
          updatedBy: req.user.id,
          timestamp: new Date(),
        });
        await order.save();
      } catch (error) {
        console.error(`Error creating SmartCartOrder for order ${orderId}:`, error);
        errors.push({ orderId, error: `فشل في إنشاء الطلب: ${error.message}` });
        continue;
      }

      // Create commission
      await AgentCommission.create({
        agent: agentId,
        agentOrder: order._id,
        orderNumber: order.orderNumber,
        amount: order.commission,
        commissionRate: agent.commissionRate,
        orderAmount: order.pricing.totalCost,
        status: 'calculated',
        calculatedAt: new Date(),
      });

      results.push({ orderId, success: true, smartCartOrderId: smartCartOrder._id });
    } catch (error) {
      errors.push({ orderId, error: error.message });
    }
  }

  // Update agent stats
  await agent.updateStats();

  res.json({
    success: true,
    message: `تم إرسال ${results.length} طلب بنجاح`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
});

export default {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  markCustomerPayment,
  submitOrder,
  markAgentPayment,
  batchSubmitOrders,
};

