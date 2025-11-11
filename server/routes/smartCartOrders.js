import express from 'express';
import SmartCartOrder from '../models/SmartCartOrder.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { protect, admin } from '../middleware/auth.js';
import { catchAsync } from '../utils/catchAsync.js';

const router = express.Router();

router.post('/', protect, catchAsync(async (req, res, next) => {
  const order = await SmartCartOrder.create({
    orderNumber: generateOrderNumber(),
    user: req.user.id,
    ...req.body,
  });
  res.json({ success: true, order });
}));

router.get('/', protect, catchAsync(async (req, res, next) => {
  const query = req.user.role === 'admin' ? {} : { user: req.user.id };
  const orders = await SmartCartOrder.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
}));

router.get('/:id', protect, catchAsync(async (req, res, next) => {
  const order = await SmartCartOrder.findById(req.params.id)
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

  // If this is an agent order, populate agent order details
  let agentOrder = null;
  if (order.metadata?.source === 'agent' && order.metadata?.agentOrderId) {
    try {
      const AgentOrder = (await import('../models/AgentOrder.js')).default;
      agentOrder = await AgentOrder.findById(order.metadata.agentOrderId)
        .populate('customer', 'name phone')
        .populate('agent', 'agentNumber commissionRate');
    } catch (error) {
      console.error('Failed to load agent order:', error);
    }
  }

  res.json({
    success: true,
    order,
    agentOrder,
  });
}));

router.put('/:id/assign-point', protect, admin, catchAsync(async (req, res, next) => {
  const { pointId } = req.body;
  
  if (!pointId) {
    return res.status(400).json({
      message: 'يرجى تحديد النقطة',
    });
  }

  const order = await SmartCartOrder.findById(req.params.id);

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

  console.log('✅ SmartCartOrder assigned to point:', {
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
}));

router.put('/:id/status', protect, admin, catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  const order = await SmartCartOrder.findById(req.params.id).populate('user');

  if (!order) {
    return res.status(404).json({
      message: 'الطلب غير موجود',
    });
  }

  order.status = status;
  order.statusHistory.push({
    status,
    note: note || '',
    updatedBy: req.user.id,
    timestamp: new Date(),
  });

  await order.save();

  // If this is an agent order, sync status with AgentOrder
  if (order.metadata?.source === 'agent' && order.metadata?.agentOrderId) {
    try {
      const AgentOrder = (await import('../models/AgentOrder.js')).default;
      const agentOrder = await AgentOrder.findById(order.metadata.agentOrderId);
      
      if (agentOrder && agentOrder.status !== status) {
        agentOrder.status = status;
        agentOrder.statusHistory.push({
          status,
          note: note || `تم تحديث الحالة من لوحة الإدارة`,
          updatedBy: req.user.id,
          timestamp: new Date(),
        });
        await agentOrder.save();
      }
    } catch (error) {
      console.error('Failed to sync AgentOrder status:', error);
      // Don't fail the request if sync fails
    }
  }

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
}));

export default router;
