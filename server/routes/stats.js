import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, admin, async (req, res) => {
  const totalOrders = await Order.countDocuments({ isDeleted: false });
  const totalUsers = await User.countDocuments();
  const totalPayments = await Payment.countDocuments();
  const ordersThisMonth = await Order.countDocuments({
    createdAt: { $gte: new Date(new Date().setDate(1)) },
    isDeleted: false,
  });

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalUsers,
      totalPayments,
      ordersThisMonth,
    },
  });
});

export default router;

