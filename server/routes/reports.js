import express from 'express';
import {
  getRevenueReport,
  getSalesReport,
  getCustomerReport,
  getPerformanceReport,
  generateReport,
  getReports,
  getReport,
  deleteReport,
  exportReport,
  cleanOldReports,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// جميع المسارات تحتاج مصادقة وصلاحيات إدارية
router.use(protect);
router.use(authorize('admin', 'support', 'purchasing', 'shipping'));

// الحصول على التقارير الفورية (بدون حفظ)
router.get('/revenue', getRevenueReport);
router.get('/sales', getSalesReport);
router.get('/customer', getCustomerReport);
router.get('/performance', getPerformanceReport);

// إدارة التقارير المحفوظة
router.route('/').get(getReports).post(generateReport);

router.route('/:id').get(getReport).delete(deleteReport);

// تصدير تقرير
router.get('/:id/export', exportReport);

// حذف التقارير القديمة (للإدارة فقط)
router.delete('/cleanup/old', authorize('admin'), cleanOldReports);

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default;
    const count = await Order.countDocuments();
    res.json({ success: true, ordersCount: count, message: 'Test successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
